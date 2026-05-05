import { ApprovalsTable } from "~/app/dashboard/_components/approvals-table";

export default function AdminApprovalsPage() {
  return (
    <main className="w-full p-8">
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">Approvals</h1>
        <p className="text-sm text-neutral-500">
          Final-step approvals for centers, master applications, and
          certificates.
        </p>
      </header>
      <ApprovalsTable />
    </main>
  );
}
