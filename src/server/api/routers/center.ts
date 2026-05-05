import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { buildCenterPipeline } from "~/server/api/approval/pipeline";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { centers, users } from "~/server/db/schema";

const fileKey = z.string().max(1024).nullable().optional();

export const centerCreateInput = z.object({
  name: z.string().min(2).max(255),
  address: z.string().max(2000).optional(),
  directorTitle: z.string().max(64).optional(),
  directorName: z.string().max(255).optional(),
  directorIdCard: z.string().max(64).optional(),
  vocationalFields: z.array(z.string().max(255)).default([]),
  contents: z.array(z.string().max(1000)).default([]),
  appointmentDate: z.coerce.date().optional(),
  appointmentNumber: z.string().max(128).optional(),
  idCardUrl: fileKey,
  paymentSlipUrl: fileKey,
  photoUrl: fileKey,
});

export const centerRouter = createTRPCRouter({
  myCenter: protectedProcedure.query(async ({ ctx }) => {
    const c = await ctx.db.query.centers.findFirst({
      where: (t, { eq }) => eq(t.ownerUserId, ctx.session.user.id),
    });
    return c ?? null;
  }),

  /** Public list of approved centers — used in the master registration form. */
  listApproved: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.query.centers.findMany({
      where: (t, { eq }) => eq(t.status, "approved"),
      orderBy: (t, { asc }) => [asc(t.name)],
      columns: { id: true, code: true, name: true },
    });
    return rows;
  }),

  create: protectedProcedure
    .input(centerCreateInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db.query.centers.findFirst({
        where: (t, { eq }) => eq(t.ownerUserId, userId),
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have a center registration.",
        });
      }

      // Provisional code; finalised at admin approval. We store a unique
      // placeholder so the unique index holds but no real GKB-CTR-XXX is
      // claimed yet.
      const provisionalCode = `PENDING-${userId.slice(0, 8)}`;

      return await ctx.db.transaction(async (tx) => {
        const [created] = await tx
          .insert(centers)
          .values({
            ownerUserId: userId,
            code: provisionalCode,
            name: input.name,
            address: input.address,
            directorTitle: input.directorTitle,
            directorName: input.directorName,
            directorIdCard: input.directorIdCard,
            vocationalFields: input.vocationalFields,
            contents: input.contents,
            appointmentDate: input.appointmentDate,
            appointmentNumber: input.appointmentNumber,
            idCardUrl: input.idCardUrl ?? null,
            paymentSlipUrl: input.paymentSlipUrl ?? null,
            photoUrl: input.photoUrl ?? null,
            status: "pending_approval",
          })
          .returning();
        if (!created) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create center.",
          });
        }

        await buildCenterPipeline(tx, created.id);

        await tx
          .update(users)
          .set({ status: "pending_approval" })
          .where(eq(users.id, userId));

        return { id: created.id };
      });
    }),
});
