import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  Award,
  CalendarDays,
  FileText,
  GraduationCap,
  KeyRound,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";

export default async function AdminDashboardPage() {
  const t = await getTranslations();

  const items = [
    {
      href: "/dashboard/admin/approvals",
      title: t("nav.approvals"),
      desc: t("nav.approvalsDesc"),
      icon: ShieldCheck,
    },
    {
      href: "/dashboard/admin/roles",
      title: t("nav.roles"),
      desc: t("nav.rolesDesc"),
      icon: KeyRound,
    },
    {
      href: "/dashboard/admin/users",
      title: t("nav.users"),
      desc: t("nav.usersDesc"),
      icon: Users,
    },
    {
      href: "/dashboard/admin/courses",
      title: t("nav.courses"),
      desc: t("nav.coursesDesc"),
      icon: GraduationCap,
    },
    {
      href: "/dashboard/admin/templates",
      title: t("nav.templates"),
      desc: t("nav.templatesDesc"),
      icon: FileText,
    },
    {
      href: "/dashboard/admin/certificates",
      title: t("nav.certificates"),
      desc: t("nav.certificatesDesc"),
      icon: Award,
    },
    {
      href: "/dashboard/admin/calendar",
      title: t("nav.calendar"),
      desc: t("nav.calendarDesc"),
      icon: CalendarDays,
    },
  ];

  return (
    <main className="w-full p-4 lg:p-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Admin console
          </h1>
          <p className="text-muted-foreground text-sm">
            Oversee approvals, accounts, and platform operations.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 self-start">
          <ShieldCheck className="size-3.5" />
          Administrator
        </Badge>
      </header>

      <section aria-labelledby="management-heading">
        <h2
          id="management-heading"
          className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase"
        >
          Management
        </h2>
        <nav className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <NavCard
              key={item.href}
              href={item.href}
              title={item.title}
              desc={item.desc}
              Icon={item.icon}
            />
          ))}
        </nav>
      </section>
    </main>
  );
}

function NavCard({
  href,
  title,
  desc,
  Icon,
}: {
  href: string;
  title: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="group bg-card text-card-foreground hover:border-primary focus-visible:border-primary focus-visible:ring-ring/50 flex items-start gap-3 rounded-2xl border p-5 shadow-sm outline-none transition hover:shadow focus-visible:ring-[3px]"
    >
      <div className="bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate text-base font-semibold">{title}</div>
          <ArrowRight className="text-muted-foreground size-4 shrink-0 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
        </div>
        <div className="text-muted-foreground line-clamp-1 text-sm">{desc}</div>
      </div>
    </Link>
  );
}
