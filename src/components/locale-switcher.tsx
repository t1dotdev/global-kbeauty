"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";

export function LocaleSwitcher() {
  const t = useTranslations("locale");
  const locale = useLocale();
  const router = useRouter();
  const set = api.user.setLocale.useMutation({
    onSuccess: () => router.refresh(),
  });

  return (
    <div className="flex items-center gap-2 text-xs text-neutral-500">
      <span aria-label={t("label")}>{t("label")}</span>
      <Select
        value={locale}
        onValueChange={(v) => v && set.mutate({ locale: v as "en" | "kr" })}
      >
        <SelectTrigger className="h-8 w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">{t("en")}</SelectItem>
          <SelectItem value="kr">{t("kr")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
