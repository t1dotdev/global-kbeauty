import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { buildStudentPipeline } from "~/server/api/approval/pipeline";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { studentProfiles, users } from "~/server/db/schema";
import type { DB } from "~/server/db/types";

const fileKey = z.string().max(1024).nullable().optional();

export const studentCreateInput = z.object({
  masterId: z.string().min(1),
  titleEn: z.string().max(64).optional(),
  fullNameEn: z.string().max(255).optional(),
  idOrPassport: z.string().max(64).optional(),
  courseId: z.string().optional(),
  contentSubject: z.string().max(2000).optional(),
  academicPerformance: z.string().max(2000).optional(),
  completionDate: z.coerce.date().optional(),

  instructorFullName: z.string().max(255).optional(),
  instructorAppointmentNumber: z.string().max(128).optional(),
  leadInstructorName: z.string().max(255).optional(),
  leadInstructorAppointmentNumber: z.string().max(128).optional(),
  leadSeniorName: z.string().max(255).optional(),
  leadSeniorAppointmentNumber: z.string().max(128).optional(),
  regionalDirectorName: z.string().max(255).optional(),
  regionalDirectorAppointmentNumber: z.string().max(128).optional(),

  studentIdCardUrl: fileKey,
  paymentSlipUrl: fileKey,
  applicationUrl: fileKey,
  photoUrl: fileKey,
  notes: z.string().max(2000).optional(),
});

async function loadActor(ctx: { db: DB; session: { user: { id: string } } }) {
  const user = await ctx.db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, ctx.session.user.id),
    with: { role: true },
  });
  const center = await ctx.db.query.centers.findFirst({
    where: (c, { eq, and }) =>
      and(eq(c.ownerUserId, ctx.session.user.id), eq(c.status, "approved")),
    columns: { id: true },
  });
  const master = await ctx.db.query.masterProfiles.findFirst({
    where: (m, { eq, and }) =>
      and(eq(m.userId, ctx.session.user.id), eq(m.status, "approved")),
    columns: { id: true, centerId: true, currentLevel: true, userId: true },
  });
  return {
    kind: user?.role?.kind ?? null,
    level: user?.role?.level ?? null,
    center,
    master,
  };
}

const studentUpdateInput = studentCreateInput
  .partial()
  .extend({ id: z.string() });

export const studentRouter = createTRPCRouter({
  myProfile: protectedProcedure.query(async ({ ctx }) => {
    const s = await ctx.db.query.studentProfiles.findFirst({
      where: (t, { eq }) => eq(t.userId, ctx.session.user.id),
    });
    return s ?? null;
  }),

  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().max(255).optional(),
          centerId: z.string().optional(),
          masterId: z.string().optional(),
        })
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      const actor = await loadActor(ctx);
      return ctx.db.query.studentProfiles.findMany({
        where: (t, { eq, and, or, ilike }) => {
          const filters = [];
          if (actor.kind === "admin") {
            // no additional scope
          } else if (actor.kind === "center" && actor.center) {
            filters.push(eq(t.centerId, actor.center.id));
          } else if (actor.kind === "master" && actor.master) {
            // Lv1 masters see their own; higher masters see students in their center.
            if (actor.master.currentLevel === 1) {
              filters.push(eq(t.masterId, actor.master.id));
            } else {
              filters.push(eq(t.centerId, actor.master.centerId));
            }
          } else {
            // No visibility for unscoped users.
            filters.push(eq(t.id, "__none__"));
          }
          if (input.centerId) filters.push(eq(t.centerId, input.centerId));
          if (input.masterId) filters.push(eq(t.masterId, input.masterId));
          if (input.search) {
            const q = `%${input.search}%`;
            filters.push(
              or(
                ilike(t.studentCode, q),
                ilike(t.fullNameEn, q),
                ilike(t.idOrPassport, q),
              )!,
            );
          }
          return and(...filters);
        },
        orderBy: (t, { desc }) => [desc(t.createdAt)],
        limit: 200,
      });
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const actor = await loadActor(ctx);
      const row = await ctx.db.query.studentProfiles.findFirst({
        where: (t, { eq }) => eq(t.id, input.id),
      });
      if (!row) return null;
      if (actor.kind === "admin") return row;
      if (actor.kind === "center" && actor.center?.id === row.centerId)
        return row;
      if (actor.kind === "master" && actor.master) {
        if (actor.master.currentLevel === 1 && row.masterId === actor.master.id)
          return row;
        if (
          actor.master.currentLevel > 1 &&
          row.centerId === actor.master.centerId
        )
          return row;
      }
      throw new TRPCError({ code: "FORBIDDEN" });
    }),

  update: protectedProcedure
    .input(studentUpdateInput)
    .mutation(async ({ ctx, input }) => {
      const actor = await loadActor(ctx);
      const existing = await ctx.db.query.studentProfiles.findFirst({
        where: (t, { eq }) => eq(t.id, input.id),
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const isAdmin = actor.kind === "admin";
      const isOwnLv1Master =
        actor.kind === "master" &&
        actor.master?.currentLevel === 1 &&
        actor.master.id === existing.masterId;
      if (!isAdmin && !isOwnLv1Master) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { id, ...rest } = input;
      const patch: Record<string, unknown> = { ...rest };
      delete patch.masterId; // master reassignment goes through admin only via dedicated path
      if (isAdmin && rest.masterId && rest.masterId !== existing.masterId) {
        const newMaster = await ctx.db.query.masterProfiles.findFirst({
          where: (m, { eq }) => eq(m.id, rest.masterId!),
        });
        if (!newMaster) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "New master not found.",
          });
        }
        patch.masterId = newMaster.id;
        patch.centerId = newMaster.centerId;
      }

      const [updated] = await ctx.db
        .update(studentProfiles)
        .set(patch)
        .where(eq(studentProfiles.id, id))
        .returning();
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const actor = await loadActor(ctx);
      const existing = await ctx.db.query.studentProfiles.findFirst({
        where: (t, { eq }) => eq(t.id, input.id),
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const isAdmin = actor.kind === "admin";
      const isOwnLv1Master =
        actor.kind === "master" &&
        actor.master?.currentLevel === 1 &&
        actor.master.id === existing.masterId;
      if (!isAdmin && !isOwnLv1Master) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db
        .delete(studentProfiles)
        .where(eq(studentProfiles.id, input.id));
      return { ok: true };
    }),

  create: protectedProcedure
    .input(studentCreateInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db.query.studentProfiles.findFirst({
        where: (t, { eq }) => eq(t.userId, userId),
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have a student registration.",
        });
      }

      const master = await ctx.db.query.masterProfiles.findFirst({
        where: (t, { eq }) => eq(t.id, input.masterId),
      });
      if (master?.status !== "approved") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Selected master is not available.",
        });
      }
      if (master.currentLevel !== 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Students must register under a Level 1 master.",
        });
      }

      return await ctx.db.transaction(async (tx) => {
        const [created] = await tx
          .insert(studentProfiles)
          .values({
            userId,
            masterId: master.id,
            centerId: master.centerId,
            titleEn: input.titleEn,
            fullNameEn: input.fullNameEn,
            idOrPassport: input.idOrPassport,
            courseId: input.courseId ?? null,
            contentSubject: input.contentSubject,
            academicPerformance: input.academicPerformance,
            completionDate: input.completionDate,
            instructorFullName: input.instructorFullName,
            instructorAppointmentNumber: input.instructorAppointmentNumber,
            leadInstructorName: input.leadInstructorName,
            leadInstructorAppointmentNumber:
              input.leadInstructorAppointmentNumber,
            leadSeniorName: input.leadSeniorName,
            leadSeniorAppointmentNumber: input.leadSeniorAppointmentNumber,
            regionalDirectorName: input.regionalDirectorName,
            regionalDirectorAppointmentNumber:
              input.regionalDirectorAppointmentNumber,
            studentIdCardUrl: input.studentIdCardUrl ?? null,
            paymentSlipUrl: input.paymentSlipUrl ?? null,
            applicationUrl: input.applicationUrl ?? null,
            photoUrl: input.photoUrl ?? null,
            notes: input.notes,
            status: "pending_approval",
          })
          .returning();
        if (!created) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create student profile.",
          });
        }

        await buildStudentPipeline(tx, created.id, master.userId);

        await tx
          .update(users)
          .set({ status: "pending_approval" })
          .where(eq(users.id, userId));

        return { id: created.id };
      });
    }),
});
