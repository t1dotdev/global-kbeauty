import { FileText } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { TemplatesAdmin } from "./templates-admin";

export default function AdminTemplatesPage() {
  return (
    <main className="w-full p-4 lg:p-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Certificate templates
          </h1>
          <p className="text-muted-foreground text-sm">
            The visual layout will be supplied later. For now templates store a
            name + JSON definition that the renderer consumes.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 self-start">
          <FileText className="size-3.5" />
          Templates
        </Badge>
      </header>
      <TemplatesAdmin />
    </main>
  );
}
