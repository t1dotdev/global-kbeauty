import { TRPCError } from "@trpc/server";
import { z } from "zod";

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

export type AdminRoleKind = "admin" | "center" | "master" | "student" | null;

export const adminUserRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      await assertAdmin(ctx);
      const rows = await ctx.db.query.users.findMany({
        with: {
          role: true,
          masterProfile: true,
          studentProfile: true,
          centerOwned: true,
        },
        orderBy: (u, { desc }) => [desc(u.createdAt)],
      });

      const search = input?.search?.toLowerCase().trim();
      const filtered = search
        ? rows.filter(
            (u) =>
              u.email.toLowerCase().includes(search) ||
              (u.name?.toLowerCase().includes(search) ?? false),
          )
        : rows;

      return filtered.map((u) => {
        const kind = deriveKind(u);
        return {
          id: u.id,
          email: u.email,
          name: u.name,
          image: u.image,
          status: u.status,
          createdAt: u.createdAt,
          roleKind: kind,
          roleLabel: deriveLabel(u, kind),
        };
      });
    }),
});

type RowWithRels = {
  role: { kind: "admin" | "center" | "master"; level: number | null } | null;
  masterProfile: { currentLevel: number } | null;
  studentProfile: { id: string } | null;
  centerOwned: { id: string } | null;
};

function deriveKind(u: RowWithRels): AdminRoleKind {
  if (u.role?.kind === "admin") return "admin";
  if (u.role?.kind === "center" || u.centerOwned) return "center";
  if (u.role?.kind === "master" || u.masterProfile) return "master";
  if (u.studentProfile) return "student";
  return null;
}

function deriveLabel(u: RowWithRels, kind: AdminRoleKind): string {
  if (kind === "admin") return "Admin";
  if (kind === "center") return "Center";
  if (kind === "master") {
    const level = u.role?.level ?? u.masterProfile?.currentLevel ?? null;
    return level != null ? `Master Lv ${level}` : "Master";
  }
  if (kind === "student") return "Student";
  return "—";
}
