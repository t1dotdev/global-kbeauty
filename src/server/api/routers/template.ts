import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { certificateTemplates } from "~/server/db/schema";
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

const templateInput = z.object({
  name: z.string().min(2).max(255),
  definition: z.record(z.string(), z.unknown()).default({}),
});

export const templateRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.certificateTemplates.findMany({
      orderBy: (t, { asc }) => [asc(t.name)],
    });
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return (
        (await ctx.db.query.certificateTemplates.findFirst({
          where: (t, { eq }) => eq(t.id, input.id),
        })) ?? null
      );
    }),

  create: protectedProcedure
    .input(templateInput)
    .mutation(async ({ ctx, input }) => {
      await assertAdmin(ctx);
      const [created] = await ctx.db
        .insert(certificateTemplates)
        .values(input)
        .returning();
      return created;
    }),

  update: protectedProcedure
    .input(templateInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertAdmin(ctx);
      const { id, ...rest } = input;
      const [updated] = await ctx.db
        .update(certificateTemplates)
        .set(rest)
        .where(eq(certificateTemplates.id, id))
        .returning();
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertAdmin(ctx);
      await ctx.db
        .delete(certificateTemplates)
        .where(eq(certificateTemplates.id, input.id));
      return { ok: true };
    }),
});
