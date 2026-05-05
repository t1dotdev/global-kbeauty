import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export type CodeKind = "center" | "master" | "student";

function classifyCode(code: string): CodeKind | null {
  if (/-S\d{3,}$/.test(code)) return "student";
  if (/-M\d{2}\d{3,}$/.test(code)) return "master";
  if (/^GKB-CTR-[A-Z0-9]{3,4}$/.test(code)) return "center";
  return null;
}

export const searchRouter = createTRPCRouter({
  byCode: protectedProcedure
    .input(z.object({ code: z.string().min(3).max(64) }))
    .query(async ({ ctx, input }) => {
      const code = input.code.toUpperCase().trim();
      const kind = classifyCode(code);
      if (!kind) return { kind: null as null, target: null };

      if (kind === "center") {
        const c = await ctx.db.query.centers.findFirst({
          where: (t, { eq }) => eq(t.code, code),
        });
        return { kind, target: c ?? null };
      }
      if (kind === "master") {
        const m = await ctx.db.query.masterProfiles.findFirst({
          where: (t, { eq }) => eq(t.masterCode, code),
        });
        return { kind, target: m ?? null };
      }
      const s = await ctx.db.query.studentProfiles.findFirst({
        where: (t, { eq }) => eq(t.studentCode, code),
      });
      return { kind, target: s ?? null };
    }),

  globalSearch: protectedProcedure
    .input(z.object({ q: z.string().min(2).max(255) }))
    .query(async ({ ctx, input }) => {
      const q = `%${input.q}%`;
      const [centers, masters, students] = await Promise.all([
        ctx.db.query.centers.findMany({
          where: (t, { or, ilike }) =>
            or(ilike(t.name, q), ilike(t.code, q)),
          limit: 10,
          columns: { id: true, code: true, name: true },
        }),
        ctx.db.query.masterProfiles.findMany({
          where: (t, { or, ilike }) =>
            or(
              ilike(t.masterCode, q),
              ilike(t.firstNameEn, q),
              ilike(t.lastNameEn, q),
              ilike(t.idCardNumber, q),
            ),
          limit: 10,
          columns: {
            id: true,
            masterCode: true,
            firstNameEn: true,
            lastNameEn: true,
          },
        }),
        ctx.db.query.studentProfiles.findMany({
          where: (t, { or, ilike }) =>
            or(
              ilike(t.studentCode, q),
              ilike(t.fullNameEn, q),
              ilike(t.idOrPassport, q),
            ),
          limit: 10,
          columns: {
            id: true,
            studentCode: true,
            fullNameEn: true,
          },
        }),
      ]);
      return { centers, masters, students };
    }),
});
