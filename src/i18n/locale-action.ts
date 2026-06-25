"use server";

import { cookies } from "next/headers";

import { locales, type Locale } from "./request";

const COOKIE = "NEXT_LOCALE";

export async function setLocale(locale: Locale) {
  if (!locales.includes(locale)) return;
  const store = await cookies();
  store.set(COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
