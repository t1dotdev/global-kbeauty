import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { DB } from "~/server/db/types";

async function assertAdmin(ctx: { db: DB; session: { user: { id: string } } }) {
  const user = await ctx.db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, ctx.session.user.id),
    with: { role: true },
  });
  if (!user || user.role?.kind !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
}

export const userRouter = createTRPCRouter({
  listAll: protectedProcedure.query(async ({ ctx }) => {
    await assertAdmin(ctx);
    return ctx.db.query.users.findMany({
      orderBy: (t, { asc }) => [asc(t.createdAt)],
      with: {
        role: true,
        masterProfile: true,
        studentProfile: true,
        centerOwned: true,
      },
    });
  }),
});
