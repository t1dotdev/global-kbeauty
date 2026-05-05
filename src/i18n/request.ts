import { getRequestConfig } from "next-intl/server";
import enMessages from "~/i18n/messages/en.json";
import krMessages from "~/i18n/messages/kr.json";
import { auth } from "~/server/auth";

export const locales = ["en", "kr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export default getRequestConfig(async () => {
  const session = await auth();
  const fromSession = session?.user?.preferredLocale;
  const locale: Locale =
    fromSession === "kr" || fromSession === "en" ? fromSession : defaultLocale;

  const messages = locale === "kr" ? krMessages : enMessages;

  return { locale, messages };
});
