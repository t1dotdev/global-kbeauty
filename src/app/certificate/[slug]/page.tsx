import { notFound } from "next/navigation";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { headers } from "next/headers";

export default async function CertificateSharePage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const ctx = await createTRPCContext({
    headers: new Headers(await headers()),
  });
  const trpc = createCaller(ctx);
  const cert = await trpc.certificate.bySlug({ slug });
  if (!cert) return notFound();

  const studentName = cert.student?.fullNameEn ?? "—";
  const masterName = cert.master
    ? [cert.master.firstNameEn, cert.master.lastNameEn]
        .filter(Boolean)
        .join(" ")
    : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-2xl rounded-3xl border bg-white p-12 text-center shadow-sm">
        <p className="mb-1 text-sm tracking-widest text-neutral-500 uppercase">
          Certificate of Completion
        </p>
        <h1 className="mb-8 text-2xl font-semibold tracking-tight">
          Global K-Beauty
        </h1>

        <p className="text-sm text-neutral-500">Awarded to</p>
        <p className="mt-1 text-3xl font-semibold">{studentName}</p>
        {cert.student?.studentCode ? (
          <p className="mt-1 text-xs text-neutral-500">
            {cert.student.studentCode}
          </p>
        ) : null}

        <div className="my-8 border-t" />

        <p className="text-sm text-neutral-500">Course</p>
        <p className="mt-1 text-lg font-medium">
          {cert.course?.name}
          {cert.course?.hours ? ` — ${cert.course.hours} h` : ""}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-neutral-500">Center</p>
            <p className="text-sm font-medium">
              {cert.center?.name ?? "—"}
              {cert.center?.code ? ` (${cert.center.code})` : ""}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Master</p>
            <p className="text-sm font-medium">
              {masterName ?? "—"}
              {cert.master?.masterCode ? ` (${cert.master.masterCode})` : ""}
            </p>
          </div>
        </div>

        <p className="mt-10 text-xs text-neutral-500">
          Issued {new Date(cert.issuedAt).toLocaleDateString()} · Verify slug{" "}
          {cert.slug}
        </p>
        {cert.pdfUrl ? (
          <a
            href={cert.pdfUrl}
            target="_blank"
            className="mt-6 inline-block rounded-lg border px-4 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            Open PDF
          </a>
        ) : null}
      </div>
    </main>
  );
}
