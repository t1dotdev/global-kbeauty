import { getTranslations } from "next-intl/server";

import { PageHero } from "../_components/page-hero";

export default async function StudentsPage() {
  const t = await getTranslations();
  return <PageHero title={t("nav.students")} description={t("app.tagline")} />;
}
