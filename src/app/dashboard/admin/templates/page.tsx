import { TemplatesAdmin } from "./templates-admin";

export default function AdminTemplatesPage() {
  return (
    <main className="w-full p-8">
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">
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
