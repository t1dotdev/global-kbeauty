import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { calendarEvents } from "~/server/db/schema";
import type { DB } from "~/server/db/types";

async function assertAdmin(ctx: { db: DB; session: { user: { id: string } } }) {
  const u = await ctx.db.query.users.findFirst({
    where: (x, { eq }) => eq(x.id, ctx.session.user.id),
    with: { role: true },
  });
  if (u?.role?.kind !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
}

const eventInput = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});

export const calendarRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          from: z.coerce.date().optional(),
          to: z.coerce.date().optional(),
        })
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.query.calendarEvents.findMany({
        where: (t, { and, gte, lte }) => {
          const f = [];
          if (input.from) f.push(gte(t.endsAt, input.from));
          if (input.to) f.push(lte(t.startsAt, input.to));
          return f.length ? and(...f) : undefined;
        },
        orderBy: (t, { asc }) => [asc(t.startsAt)],
        limit: 500,
      });
    }),

  create: protectedProcedure
    .input(eventInput)
    .mutation(async ({ ctx, input }) => {
      await assertAdmin(ctx);
      const [created] = await ctx.db
        .insert(calendarEvents)
        .values({ ...input, createdByUserId: ctx.session.user.id })
        .returning();
      return created;
    }),

  update: protectedProcedure
    .input(eventInput.partial().extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertAdmin(ctx);
      const { id, ...rest } = input;
      const [updated] = await ctx.db
        .update(calendarEvents)
        .set(rest)
        .where(eq(calendarEvents.id, id))
        .returning();
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertAdmin(ctx);
      await ctx.db
        .delete(calendarEvents)
        .where(eq(calendarEvents.id, input.id));
      return { ok: true };
    }),
});
