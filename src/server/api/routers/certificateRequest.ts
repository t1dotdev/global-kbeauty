import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { buildCertRequestPipeline } from "~/server/api/approval/pipeline";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { certificateRequests } from "~/server/db/schema";
import type { Tx } from "~/server/db/types";

export const certificateRequestRouter = createTRPCRouter({
  myRequests: protectedProcedure.query(async ({ ctx }) => {
    const student = await ctx.db.query.studentProfiles.findFirst({
      where: (s, { eq }) => eq(s.userId, ctx.session.user.id),
    });
    if (!student) return [];
    return ctx.db.query.certificateRequests.findMany({
      where: (r, { eq }) => eq(r.studentId, student.id),
      orderBy: (r, { desc }) => [desc(r.createdAt)],
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        courseId: z.string().min(1),
        payload: z.record(z.string(), z.unknown()).default({}),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const student = await ctx.db.query.studentProfiles.findFirst({
        where: (s, { eq }) => eq(s.userId, userId),
      });
      if (!student) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only registered students may request certificates.",
        });
      }
      if (student.status !== "approved") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your student registration is not yet approved.",
        });
      }

      const master = await ctx.db.query.masterProfiles.findFirst({
        where: (m, { eq }) => eq(m.id, student.masterId),
      });
      if (!master) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Sponsoring master not found.",
        });
      }

      return await ctx.db.transaction(async (tx) => {
        const [created] = await tx
          .insert(certificateRequests)
          .values({
            studentId: student.id,
            courseId: input.courseId,
            payload: input.payload,
            status: "pending_approval",
            currentStep: 0,
          })
          .returning();
        if (!created) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
        await buildCertRequestPipeline(
          tx,
          created.id,
          student.centerId,
          master.userId,
          master.currentLevel,
        );
        return { id: created.id };
      });
    }),

  /** Admin/center/master listing. */
  list: protectedProcedure
    .input(
      z
        .object({
          status: z
            .enum(["pending_approval", "approved", "declined"])
            .optional(),
        })
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, ctx.session.user.id),
        with: { role: true },
      });
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      return ctx.db.query.certificateRequests.findMany({
        where: (r, { eq, and }) => {
          const filters = [];
          if (input.status) filters.push(eq(r.status, input.status));
          return filters.length ? and(...filters) : undefined;
        },
        orderBy: (r, { desc }) => [desc(r.createdAt)],
        limit: 200,
      });
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db.query.certificateRequests.findFirst({
        where: (r, { eq }) => eq(r.id, input.id),
      });
      if (!row) return null;
      return row;
    }),
});

// Helper exposed for the approval finalizer to update request status
export async function markCertRequestApproved(tx: Tx, requestId: string) {
  await tx
    .update(certificateRequests)
    .set({ status: "approved" })
    .where(eq(certificateRequests.id, requestId));
}

export async function markCertRequestDeclined(tx: Tx, requestId: string) {
  await tx
    .update(certificateRequests)
    .set({ status: "declined" })
    .where(eq(certificateRequests.id, requestId));
}
