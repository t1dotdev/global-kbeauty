import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "~/server/auth";

export default async function RegisterSelectorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleKind) redirect(`/dashboard/${session.user.roleKind}`);

  const t = await getTranslations("register");

  const options = [
    {
      href: "/register/student",
      title: t("student"),
      desc: t("studentDesc"),
    },
    {
      href: "/register/master",
      title: t("master"),
      desc: t("masterDesc"),
    },
    {
      href: "/register/center",
      title: t("center"),
      desc: t("centerDesc"),
    },
  ];

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">
          {t("chooseRole")}
        </h1>
        <p className="mb-8 text-sm text-neutral-500">
          {t("chooseRoleSubtitle")}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {options.map((opt) => (
            <Link
              key={opt.href}
              href={opt.href}
              className="rounded-2xl border bg-white p-5 shadow-sm transition hover:border-neutral-900 hover:shadow"
            >
              <div className="mb-1 text-base font-semibold">{opt.title}</div>
              <div className="text-sm text-neutral-500">{opt.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
