import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "~/components/locale-switcher";
import { ThemeSwitcher } from "~/components/theme-switcher";
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
              onSignOut={handleSignOut}
            />
          ) : null}
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
