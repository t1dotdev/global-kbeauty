import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { courses } from "~/server/db/schema";

async function assertAdmin(ctx: {
  db: typeof import("~/server/db").db;
  session: { user: { id: string } };
}) {
  const user = await ctx.db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, ctx.session.user.id),
    with: { role: true },
  });
  if (!user || user.role?.kind !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
}

const courseInput = z.object({
  name: z.string().min(2).max(255),
  description: z.string().max(2000).optional(),
  hours: z.number().int().min(0).max(10000).default(0),
});

export const courseRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.courses.findMany({
      orderBy: (t, { asc }) => [asc(t.name)],
    });
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return (
        (await ctx.db.query.courses.findFirst({
          where: (t, { eq }) => eq(t.id, input.id),
        })) ?? null
      );
    }),

  create: protectedProcedure
    .input(courseInput)
    .mutation(async ({ ctx, input }) => {
      await assertAdmin(ctx);
      const [created] = await ctx.db
        .insert(courses)
        .values(input)
        .returning();
      return created;
    }),

  update: protectedProcedure
    .input(courseInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertAdmin(ctx);
      const { id, ...rest } = input;
      const [updated] = await ctx.db
        .update(courses)
        .set(rest)
        .where(eq(courses.id, id))
        .returning();
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertAdmin(ctx);
      await ctx.db.delete(courses).where(eq(courses.id, input.id));
      return { ok: true };
    }),
});
