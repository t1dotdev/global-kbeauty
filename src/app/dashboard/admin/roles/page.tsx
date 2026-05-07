import { getTranslations } from "next-intl/server";
import { KeyRound } from "lucide-react";
import { Badge } from "~/components/ui/badge";

import { RolesAdmin } from "./roles-admin";

export default async function AdminRolesPage() {
  const t = await getTranslations();
  return (
    <main className="w-full p-4 lg:p-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("nav.roles")}
          </h1>
          <p className="text-muted-foreground text-sm">{t("nav.rolesDesc")}</p>
        </div>
        <Badge variant="outline" className="gap-1.5 self-start">
          <KeyRound className="size-3.5" />
          Roles &amp; permissions
        </Badge>
      </header>
      <RolesAdmin />
    </main>
  );
}
