import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth, signOut } from "~/server/auth";

export default async function Home() {
  const session = await auth();
  const t = await getTranslations();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-6 text-neutral-900">
      <div className="flex w-full max-w-xl flex-col items-center gap-8 rounded-2xl border bg-white p-10 shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("app.name")}
          </h1>
          <p className="text-sm text-neutral-500">{t("app.tagline")}</p>
        </div>

        {session?.user ? (
          <div className="flex w-full flex-col items-center gap-4">
            <p className="text-sm text-neutral-600">
              {t("auth.signedInAs", { email: session.user.email ?? "" })}
            </p>
            <div className="flex gap-3">
              <Link
                href={
                  session.user.roleKind
                    ? `/dashboard/${session.user.roleKind}`
                    : "/register"
                }
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              >
                {t("auth.continue")}
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                >
                  {t("auth.signOut")}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
          >
            {t("auth.signIn")}
          </Link>
        )}
      </div>
    </main>
  );
}
