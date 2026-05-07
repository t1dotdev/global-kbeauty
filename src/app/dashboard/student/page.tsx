import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "~/server/auth";

export default async function StudentDashboardPage() {
  const session = await auth();
  const t = await getTranslations();
  const status = session?.user?.status;
  return (
    <main className="w-full p-4 lg:p-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">
          {t("register.student")}
        </h1>
        <p className="text-muted-foreground text-sm">{t("app.tagline")}</p>
      </header>

      {status === "pending_approval" ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {t("status.pending_approval")}
        </div>
      ) : null}

      <nav className="grid gap-3 sm:grid-cols-2">
        <NavCard
          href="/dashboard/student/certificates"
          title={t("nav.myCertificates")}
          desc={t("nav.myCertificatesDesc")}
        />
        <NavCard
          href="/dashboard/student/request"
          title={t("nav.requestCertificate")}
          desc={t("nav.requestCertificateDesc")}
        />
      </nav>
    </main>
  );
}

function NavCard({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="bg-card text-card-foreground hover:border-primary rounded-2xl border p-5 shadow-sm transition hover:shadow"
    >
      <div className="text-base font-semibold">{title}</div>
      <div className="text-muted-foreground text-sm">{desc}</div>
    </Link>
  );
}
