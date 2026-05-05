import { getRequestConfig } from "next-intl/server";
import { auth } from "~/server/auth";

export const locales = ["en", "kr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export default getRequestConfig(async () => {
  const session = await auth();
  const fromSession = session?.user?.preferredLocale;
  const locale: Locale =
    fromSession === "kr" || fromSession === "en" ? fromSession : defaultLocale;

  const messages = (await import(`./messages/${locale}.json`)).default as
    | Record<string, unknown>;

  return { locale, messages };
});
