import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function AdminDashboardPage() {
  const t = await getTranslations();
  return (
    <main className="w-full p-8">
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
        <p className="text-muted-foreground text-sm">{t("app.tagline")}</p>
      </header>
      <nav className="grid gap-3 sm:grid-cols-2">
        <NavCard
          href="/dashboard/admin/approvals"
          title={t("nav.approvals")}
          desc={t("nav.approvalsDesc")}
        />
        <NavCard
          href="/dashboard/admin/courses"
          title={t("nav.courses")}
          desc={t("nav.coursesDesc")}
        />
        <NavCard
          href="/dashboard/admin/students"
          title={t("nav.students")}
          desc={t("nav.studentsDesc")}
        />
        <NavCard
          href="/dashboard/admin/templates"
          title={t("nav.templates")}
          desc={t("nav.templatesDesc")}
        />
        <NavCard
          href="/dashboard/admin/certificates"
          title={t("nav.certificates")}
          desc={t("nav.certificatesDesc")}
        />
        <NavCard
          href="/dashboard/admin/calendar"
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
