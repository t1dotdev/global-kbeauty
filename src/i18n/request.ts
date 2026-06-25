import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import enMessages from "~/i18n/messages/en.json";
import krMessages from "~/i18n/messages/kr.json";
import { auth } from "~/server/auth";

export const locales = ["en", "kr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "kr";
}

export default getRequestConfig(async () => {
  const fromCookie = (await cookies()).get("NEXT_LOCALE")?.value;
  const session = await auth();
  const fromSession = session?.user?.preferredLocale;
  const locale: Locale = isLocale(fromCookie)
    ? fromCookie
    : isLocale(fromSession)
      ? fromSession
      : defaultLocale;

  const messages = locale === "kr" ? krMessages : enMessages;

  return { locale, messages };
});
