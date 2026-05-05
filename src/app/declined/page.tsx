import { getTranslations } from "next-intl/server";
import { signOut } from "~/server/auth";

export default async function DeclinedPage() {
  const t = await getTranslations();
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
        <h1 className="mb-2 text-xl font-semibold">{t("declined.title")}</h1>
        <p className="mb-6 text-sm text-neutral-500">{t("declined.body")}</p>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="rounded-lg border px-4 py-2 text-sm hover:bg-neutral-50">
            {t("auth.signOut")}
          </button>
        </form>
      </div>
    </main>
  );
}
