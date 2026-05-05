import { TemplatesAdmin } from "./templates-admin";

export default function AdminTemplatesPage() {
  return (
    <main className="mx-auto max-w-5xl p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Certificate templates
        </h1>
        <p className="text-sm text-neutral-500">
          The visual layout will be supplied later. For now templates store a
          name + JSON definition that the renderer consumes.
        </p>
      </header>
      <TemplatesAdmin />
    </main>
  );
}
