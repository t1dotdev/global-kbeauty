import { eq, sum } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { revenueLedger } from "~/server/db/schema";

export const revenueRouter = createTRPCRouter({
  myEntries: protectedProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(500).default(100) })
        .default({ limit: 100 }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.query.revenueLedger.findMany({
        where: (t, { eq }) => eq(t.userId, ctx.session.user.id),
        orderBy: (t, { desc }) => [desc(t.createdAt)],
        limit: input.limit,
      });
    }),

  myTotal: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select({ total: sum(revenueLedger.amountThb) })
      .from(revenueLedger)
      .where(eq(revenueLedger.userId, ctx.session.user.id));
    return row?.total ?? "0";
  }),
});
