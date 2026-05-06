import { TRPCError } from "@trpc/server";
import { and, asc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { roles } from "~/server/db/schema";
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

const kindEnum = z.enum(["master", "center", "admin"]);
const amountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Must be a non-negative number with up to 2 decimals");

const baseSchema = z
  .object({
    name: z.string().min(2).max(128),
    description: z.string().max(2000).optional(),
    amountThb: amountSchema,
    kind: kindEnum,
    level: z.number().int().min(0).max(99).nullable(),
  })
  .refine(
    (v) => (v.kind === "master" ? v.level !== null : v.level === null),
    {
      message:
        "Master roles require a level; admin and center roles must have no level",
      path: ["level"],
    },
  );

export const roleRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    await assertAdmin(ctx);
    return ctx.db.query.roles.findMany({
      orderBy: (t) => [asc(t.kind), asc(t.level)],
    });
  }),

  create: protectedProcedure
    .input(baseSchema)
    .mutation(async ({ ctx, input }) => {
      await assertAdmin(ctx);
      const dup = await ctx.db.query.roles.findFirst({
        where:
          input.level === null
            ? and(eq(roles.kind, input.kind), isNull(roles.level))
            : and(eq(roles.kind, input.kind), eq(roles.level, input.level)),
      });
      if (dup) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A role with this kind and level already exists",
        });
      }
      const [created] = await ctx.db.insert(roles).values(input).returning();
      return created;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).and(baseSchema))
    .mutation(async ({ ctx, input }) => {
      await assertAdmin(ctx);
      const { id, ...rest } = input;
      const dup = await ctx.db.query.roles.findFirst({
        where: (t, { eq, and, isNull, ne }) => {
          const sameKindLevel =
            rest.level === null
              ? and(eq(t.kind, rest.kind), isNull(t.level))
              : and(eq(t.kind, rest.kind), eq(t.level, rest.level));
          return and(sameKindLevel, ne(t.id, id));
        },
      });
      if (dup) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A role with this kind and level already exists",
        });
      }
      const [updated] = await ctx.db
        .update(roles)
        .set(rest)
        .where(eq(roles.id, id))
        .returning();
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertAdmin(ctx);
      const inUse = await ctx.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.roleId, input.id),
      });
      if (inUse) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Cannot delete a role that is assigned to users",
        });
      }
      await ctx.db.delete(roles).where(eq(roles.id, input.id));
      return { ok: true };
    }),
});
