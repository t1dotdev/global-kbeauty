import { StudentCertificates } from "./student-certificates";

export default function StudentCertificatesPage() {
  return (
    <main className="w-full p-8">
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">
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
