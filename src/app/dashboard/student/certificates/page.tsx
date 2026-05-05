import { StudentCertificates } from "./student-certificates";

export default function StudentCertificatesPage() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          My certificates
        </h1>
        <p className="text-sm text-neutral-500">
          Issued certificates and outstanding requests.
        </p>
      </header>
      <StudentCertificates />
    </main>
  );
}
