import { Award } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { CertificateAdmin } from "./certificate-admin";

export default function AdminCertificatesPage() {
  return (
    <main className="w-full p-4 lg:p-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Certificates
          </h1>
          <p className="text-muted-foreground text-sm">
            Issue certificates for cert requests that have cleared the approval
            chain.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 self-start">
          <Award className="size-3.5" />
          Issuance
        </Badge>
      </header>
      <CertificateAdmin />
    </main>
  );
}
