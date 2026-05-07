import { ShieldCheck } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { ApprovalsTable } from "~/app/dashboard/_components/approvals-table";

export default function AdminApprovalsPage() {
  return (
    <main className="w-full p-4 lg:p-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
          <p className="text-muted-foreground text-sm">
            Final-step approvals for centers, master applications, and
            certificates.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 self-start">
          <ShieldCheck className="size-3.5" />
          Approval queue
        </Badge>
      </header>
      <ApprovalsTable />
    </main>
  );
}
