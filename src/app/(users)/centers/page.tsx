import { getTranslations } from "next-intl/server";

import { PageHero } from "../_components/page-hero";

export default async function CentersPage() {
  const t = await getTranslations();
  return <PageHero title={t("nav.centers")} description={t("app.tagline")} />;
}
