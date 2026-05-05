import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { buildMasterPipeline } from "~/server/api/approval/pipeline";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { masterProfiles, users } from "~/server/db/schema";

const fileKey = z.string().max(1024).nullable().optional();

export const masterCreateInput = z.object({
  centerId: z.string().min(1),
  desiredLevel: z.number().int().min(1).max(99),
  titleTh: z.string().max(64).optional(),
  firstNameTh: z.string().max(128).optional(),
  lastNameTh: z.string().max(128).optional(),
  titleEn: z.string().max(64).optional(),
  firstNameEn: z.string().max(128).optional(),
  lastNameEn: z.string().max(128).optional(),
  idCardNumber: z.string().max(64).optional(),
  completedCourse: z.string().max(128).optional(),
  completedCourseOther: z.string().max(2000).optional(),
  certificateRequestDate: z.coerce.date().optional(),
  completionDate: z.coerce.date().optional(),
  idCardUrl: fileKey,
  photoUrl: fileKey,
});

export const masterRouter = createTRPCRouter({
  myProfile: protectedProcedure.query(async ({ ctx }) => {
    const m = await ctx.db.query.masterProfiles.findFirst({
      where: (t, { eq }) => eq(t.userId, ctx.session.user.id),
    });
    return m ?? null;
  }),

  /** Public list of approved Lv 1 masters in a given center — used by student registration. */
  listApprovedLv1ByCenter: publicProcedure
    .input(z.object({ centerId: z.string() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.query.masterProfiles.findMany({
        where: (t, { and, eq }) =>
          and(
            eq(t.centerId, input.centerId),
            eq(t.currentLevel, 1),
            eq(t.status, "approved"),
          ),
        orderBy: (t, { asc }) => [asc(t.firstNameEn)],
        columns: {
          id: true,
          masterCode: true,
          firstNameEn: true,
          lastNameEn: true,
          centerId: true,
        },
      });
      return rows;
    }),

  create: protectedProcedure
    .input(masterCreateInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db.query.masterProfiles.findFirst({
        where: (t, { eq }) => eq(t.userId, userId),
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have a master registration.",
        });
      }

      const center = await ctx.db.query.centers.findFirst({
        where: (t, { eq }) => eq(t.id, input.centerId),
      });
      if (center?.status !== "approved") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Selected center is not available.",
        });
      }

      return await ctx.db.transaction(async (tx) => {
        const [created] = await tx
          .insert(masterProfiles)
          .values({
            userId,
            centerId: input.centerId,
            titleTh: input.titleTh,
            firstNameTh: input.firstNameTh,
            lastNameTh: input.lastNameTh,
            titleEn: input.titleEn,
            firstNameEn: input.firstNameEn,
            lastNameEn: input.lastNameEn,
            idCardNumber: input.idCardNumber,
            completedCourse: input.completedCourse,
            completedCourseOther: input.completedCourseOther,
            certificateRequestDate: input.certificateRequestDate,
            completionDate: input.completionDate,
            idCardUrl: input.idCardUrl ?? null,
            photoUrl: input.photoUrl ?? null,
            currentLevel: input.desiredLevel,
            desiredLevel: input.desiredLevel,
            status: "pending_approval",
          })
          .returning();
        if (!created) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create master profile.",
          });
        }

        await buildMasterPipeline(
          tx,
          created.id,
          input.centerId,
          input.desiredLevel,
        );

        await tx
          .update(users)
          .set({ status: "pending_approval" })
          .where(eq(users.id, userId));

        return { id: created.id };
      });
    }),
});
