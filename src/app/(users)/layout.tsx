import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "~/components/locale-switcher";
import { ThemeSwitcher } from "~/components/theme-switcher";
import { buttonVariants } from "~/components/ui/button";
import { auth, signOut } from "~/server/auth";

import { TopbarUser } from "./_components/topbar-user";

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const t = await getTranslations();

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 lg:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt={t("app.name")}
            width={28}
            height={31}
            priority
          />
          <span className="text-base font-semibold tracking-tight">
            {t("app.name")}
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {[
            { href: "/", label: t("nav.home") },
            { href: "/centers", label: t("nav.centers") },
            { href: "/masters", label: t("nav.masters") },
            { href: "/students", label: t("nav.students") },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeSwitcher />
          {session?.user ? (
            <TopbarUser
              user={{
                name: session.user.name ?? session.user.email ?? "",
                email: session.user.email ?? "",
                image: session.user.image ?? null,
              }}
              dashboard={
                session.user.roleKind === "admin"
                  ? { href: "/dashboard/admin", label: t("nav.dashboard") }
                  : undefined
              }
              onSignOut={handleSignOut}
            />
          ) : (
            <Link
              href="/login"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("auth.signIn")}
            </Link>
          )}
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
