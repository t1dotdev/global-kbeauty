import { CertRequestForm } from "./form";

export default function StudentRequestPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Request a certificate
        </h1>
        <p className="text-sm text-neutral-500">
          Pick the course you completed. Your request will run through the
          approval chain (master → center → admin).
        </p>
      </header>
      <CertRequestForm />
    </main>
  );
}
