import Image from "next/image";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth, signIn } from "~/server/auth";

export default async function LoginPage(props: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await props.searchParams;
  if (session?.user) redirect(callbackUrl ?? "/");

  const t = await getTranslations();

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo.png"
            alt={t("app.name")}
            width={160}
            height={178}
            priority
            className="h-auto w-40"
          />
        </div>
        <p className="mb-8 text-center text-sm text-neutral-500">
          {t("app.tagline")}
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackUrl ?? "/" });
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50"
          >
            <GoogleIcon />
            {t("auth.continueWithGoogle")}
          </button>
        </form>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.995 3.018v2.51h3.227c1.886-1.736 2.986-4.291 2.986-7.351z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.964-.895 6.618-2.422l-3.227-2.51c-.895.6-2.04.955-3.391.955-2.605 0-4.81-1.76-5.6-4.122H3.064v2.59A9.997 9.997 0 0 0 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.901a6.011 6.011 0 0 1 0-3.8V7.51H3.064a10 10 0 0 0 0 8.98L6.4 13.9z"
      />
      <path
        fill="#EA4335"
        d="M12 5.977c1.468 0 2.787.505 3.823 1.495l2.866-2.866C16.96 2.99 14.696 2 12 2 8.087 2 4.71 4.244 3.064 7.51L6.4 10.1c.79-2.36 2.995-4.122 5.6-4.122z"
      />
    </svg>
  );
}
