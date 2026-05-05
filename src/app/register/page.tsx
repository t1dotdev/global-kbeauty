import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth, signOut } from "~/server/auth";

export default async function RegisterSelectorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.roleKind) {
    return <SessionRefreshRequired roleKind={session.user.roleKind} />;
  }

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

function SessionRefreshRequired({ roleKind }: { roleKind: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">
          Session refresh required
        </h1>
        <p className="mb-6 text-sm text-neutral-500">
          Your account role is set to {roleKind}, but your browser still has an
          older session token. Sign out and sign back in to refresh access.
        </p>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
