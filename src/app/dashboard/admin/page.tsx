import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "~/components/locale-switcher";
import { auth, signOut } from "~/server/auth";

export default async function AdminDashboardPage() {
  const session = await auth();
  const t = await getTranslations();
  return (
    <main className="mx-auto max-w-5xl p-8">
      <header className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-neutral-50">
              {t("auth.signOut")}
            </button>
          </form>
        </div>
      </header>
      <p className="mb-6 text-sm text-neutral-500">
        {t("auth.signedInAs", { email: session?.user?.email ?? "" })}
      </p>
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
      className="rounded-2xl border bg-white p-5 shadow-sm transition hover:border-neutral-900 hover:shadow"
    >
      <div className="text-base font-semibold">{title}</div>
      <div className="text-sm text-neutral-500">{desc}</div>
    </Link>
  );
}
