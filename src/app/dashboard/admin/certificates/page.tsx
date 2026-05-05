import { CertificateAdmin } from "./certificate-admin";

export default function AdminCertificatesPage() {
  return (
    <main className="w-full p-8">
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">Certificates</h1>
        <p className="text-sm text-neutral-500">
          Issue certificates for cert requests that have cleared the approval
          chain.
        </p>
      </header>
      <CertificateAdmin />
    </main>
  );
}
