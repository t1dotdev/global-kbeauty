import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { env } from "~/env";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import {
  certificateRequests,
  certificateTemplates,
  certificates,
  centers,
  courses,
  masterProfiles,
  studentProfiles,
} from "~/server/db/schema";
import { renderCertificatePdf } from "~/server/storage/certificate-pdf";
import { presignDownload, putObject } from "~/server/storage/r2";

async function assertAdmin(ctx: {
  db: typeof import("~/server/db").db;
  session: { user: { id: string } };
}) {
  const u = await ctx.db.query.users.findFirst({
    where: (x, { eq }) => eq(x.id, ctx.session.user.id),
    with: { role: true },
  });
  if (u?.role?.kind !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
}

function randomToken(length = 24) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, length);
}

export const certificateRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({ studentId: z.string().optional() })
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.query.certificates.findMany({
        where: (t, { eq }) =>
          input.studentId ? eq(t.studentId, input.studentId) : undefined,
        orderBy: (t, { desc }) => [desc(t.issuedAt)],
        limit: 200,
      });
    }),

  myCertificates: protectedProcedure.query(async ({ ctx }) => {
    const student = await ctx.db.query.studentProfiles.findFirst({
      where: (s, { eq }) => eq(s.userId, ctx.session.user.id),
    });
    if (!student) return [];
    return ctx.db.query.certificates.findMany({
      where: (t, { eq }) => eq(t.studentId, student.id),
      orderBy: (t, { desc }) => [desc(t.issuedAt)],
    });
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return (
        (await ctx.db.query.certificates.findFirst({
          where: (t, { eq }) => eq(t.id, input.id),
        })) ?? null
      );
    }),

  /** Public lookup by share slug — used by the public viewer. */
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const cert = await ctx.db.query.certificates.findFirst({
        where: (t, { eq }) => eq(t.sharedSlug, input.slug),
      });
      if (!cert) return null;
      const [student, course] = await Promise.all([
        ctx.db.query.studentProfiles.findFirst({
          where: (s, { eq }) => eq(s.id, cert.studentId),
          columns: { fullNameEn: true, studentCode: true, centerId: true, masterId: true },
        }),
        ctx.db.query.courses.findFirst({
          where: (c, { eq }) => eq(c.id, cert.courseId),
          columns: { name: true, hours: true },
        }),
      ]);
      const center = student
        ? await ctx.db.query.centers.findFirst({
            where: (c, { eq }) => eq(c.id, student.centerId),
            columns: { name: true, code: true },
          })
        : null;
      const master = student
        ? await ctx.db.query.masterProfiles.findFirst({
            where: (m, { eq }) => eq(m.id, student.masterId),
            columns: {
              firstNameEn: true,
              lastNameEn: true,
              masterCode: true,
            },
          })
        : null;

      return {
        id: cert.id,
        slug: cert.sharedSlug,
        issuedAt: cert.issuedAt,
        pdfUrl: cert.pdfUrl,
        student: student ?? null,
        course: course ?? null,
        center: center ?? null,
        master: master ?? null,
      };
    }),

  /** Admin issues a certificate from an approved cert request. */
  issue: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        templateId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertAdmin(ctx);

      const req = await ctx.db.query.certificateRequests.findFirst({
        where: (r, { eq }) => eq(r.id, input.requestId),
      });
      if (!req) throw new TRPCError({ code: "NOT_FOUND" });
      if (req.status !== "approved") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Certificate request is not yet approved.",
        });
      }

      const template = await ctx.db.query.certificateTemplates.findFirst({
        where: (t, { eq }) => eq(t.id, input.templateId),
      });
      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found.",
        });
      }

      const student = await ctx.db.query.studentProfiles.findFirst({
        where: (s, { eq }) => eq(s.id, req.studentId),
      });
      const course = await ctx.db.query.courses.findFirst({
        where: (c, { eq }) => eq(c.id, req.courseId),
      });
      if (!student || !course) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
      const [center, master] = await Promise.all([
        ctx.db.query.centers.findFirst({
          where: (c, { eq }) => eq(c.id, student.centerId),
        }),
        ctx.db.query.masterProfiles.findFirst({
          where: (m, { eq }) => eq(m.id, student.masterId),
        }),
      ]);

      const slug = randomToken(16);
      const qrToken = randomToken(24);
      const certKey = `certificates/${student.id}/${slug}.pdf`;
      const baseUrl = env.NEXT_PUBLIC_APP_URL ?? "";
      const shareUrl = `${baseUrl}/certificate/${slug}`;

      const buf = await renderCertificatePdf({
        certificateCode: slug,
        studentName: student.fullNameEn ?? "",
        studentCode: student.studentCode ?? null,
        courseName: course.name,
        courseHours: course.hours,
        centerName: center?.name ?? null,
        centerCode: center?.code ?? null,
        masterName: master
          ? [master.firstNameEn, master.lastNameEn]
              .filter(Boolean)
              .join(" ") || null
          : null,
        masterCode: master?.masterCode ?? null,
        issuedAt: new Date(),
        shareUrl,
      });
      const upload = await putObject({
        key: certKey,
        body: buf,
        contentType: "application/pdf",
      });

      const [created] = await ctx.db
        .insert(certificates)
        .values({
          studentId: student.id,
          courseId: course.id,
          requestId: req.id,
          templateId: template.id,
          pdfUrl: upload.publicUrl ?? certKey,
          qrToken,
          sharedSlug: slug,
          issuedByUserId: ctx.session.user.id,
        })
        .returning();
      if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return { id: created.id, slug };
    }),

  /** Generate a signed download URL for a certificate's PDF. */
  signedDownload: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const cert = await ctx.db.query.certificates.findFirst({
        where: (t, { eq }) => eq(t.id, input.id),
      });
      if (!cert) throw new TRPCError({ code: "NOT_FOUND" });
      // pdfUrl might be an absolute URL (public) or a key.
      const key = cert.pdfUrl?.startsWith("http")
        ? new URL(cert.pdfUrl).pathname.replace(/^\//, "")
        : cert.pdfUrl;
      if (!key) throw new TRPCError({ code: "NOT_FOUND" });
      const url = await presignDownload(key);
      return { url };
    }),
});

void certificateRequests;
void courses;
void centers;
void masterProfiles;
void studentProfiles;
