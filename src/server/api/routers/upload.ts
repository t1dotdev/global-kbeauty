import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { presignUpload } from "~/server/storage/r2";

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_PREFIXES = [
  "centers/",
  "masters/",
  "students/",
  "certificates/",
  "templates/",
] as const;

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

function safeKey(prefix: string, userId: string, filename: string) {
  const safeName = filename.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 96);
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}${userId}/${stamp}_${rand}_${safeName}`;
}

export const uploadRouter = createTRPCRouter({
  presign: protectedProcedure
    .input(
      z.object({
        prefix: z.enum(ALLOWED_PREFIXES),
        filename: z.string().min(1).max(200),
        contentType: z.string().min(1).max(200),
        size: z.number().int().positive().max(MAX_BYTES),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ALLOWED_MIME.has(input.contentType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unsupported file type: ${input.contentType}`,
        });
      }
      const key = safeKey(input.prefix, ctx.session.user.id, input.filename);
      return presignUpload({ key, contentType: input.contentType });
    }),
});
