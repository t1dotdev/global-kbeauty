import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "~/server/auth";

export default async function MasterDashboardPage() {
  const session = await auth();
  const t = await getTranslations();
  const status = session?.user?.status;
  return (
    <main className="w-full p-4 lg:p-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">
          {t("register.master")}
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
          href="/dashboard/master/approvals"
          title={t("nav.approvals")}
          desc={t("nav.approvalsDesc")}
        />
        <NavCard
          href="/dashboard/master/students"
          title={t("nav.students")}
          desc={t("nav.studentsDesc")}
        />
        <NavCard
          href="/dashboard/master/revenue"
          title={t("nav.revenue")}
          desc={t("nav.revenueDesc")}
        />
        <NavCard
          href="/dashboard/master/calendar"
          title={t("nav.calendar")}
          desc={t("nav.calendarDesc")}
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
