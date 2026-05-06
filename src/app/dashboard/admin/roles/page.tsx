import { getTranslations } from "next-intl/server";

import { RolesAdmin } from "./roles-admin";

export default async function AdminRolesPage() {
  const t = await getTranslations();
  return (
    <main className="w-full p-8">
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">
          {t("nav.roles")}
        </h1>
        <p className="text-sm text-neutral-500">{t("nav.rolesDesc")}</p>
      </header>
      <RolesAdmin />
    </main>
  );
}
