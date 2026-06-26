import { Card } from "~/components/ui/card";

export function PageHero({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-2xl items-center gap-4 p-10 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </Card>
    </main>
  );
}
