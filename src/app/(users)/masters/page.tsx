import { getTranslations } from "next-intl/server";

import { PageHero } from "../_components/page-hero";

export default async function MastersPage() {
  const t = await getTranslations();
  return <PageHero title={t("nav.masters")} description={t("app.tagline")} />;
}
