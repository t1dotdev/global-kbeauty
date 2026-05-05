import { CertificateAdmin } from "./certificate-admin";

export default function AdminCertificatesPage() {
  return (
    <main className="mx-auto max-w-5xl p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Certificates</h1>
        <p className="text-sm text-neutral-500">
          Issue certificates for cert requests that have cleared the approval
          chain.
        </p>
      </header>
      <CertificateAdmin />
    </main>
  );
}
