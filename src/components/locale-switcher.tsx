"use client";

import { LanguagesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { api } from "~/trpc/react";

export function LocaleSwitcher() {
  const t = useTranslations("locale");
  const locale = useLocale();
  const router = useRouter();
  const set = api.user.setLocale.useMutation({
    onSuccess: () => router.refresh(),
  });
  const setLocale = (value: "en" | "kr") => {
    if (value !== locale) set.mutate({ locale: value });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
        <LanguagesIcon className="size-4" />
        <span className="sr-only">{t("label")}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuItem onClick={() => setLocale("en")}>
          {t("en")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale("kr")}>
          {t("kr")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
