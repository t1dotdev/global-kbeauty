import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Card } from "~/components/ui/card";

export default async function HomePage() {
  const t = await getTranslations();

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-2xl items-center gap-6 p-10 text-center">
        <div>
          <Image
            src="/logo.png"
            alt={t("app.name")}
            width={180}
            height={200}
            priority
            className="h-auto w-44"
          />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("app.name")}
        </h1>
        <p className="text-muted-foreground text-sm">{t("app.tagline")}</p>
      </Card>
    </main>
  );
}
