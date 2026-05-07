import { CertRequestForm } from "./form";

export default function StudentRequestPage() {
  return (
    <main className="w-full p-4 lg:p-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">
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
