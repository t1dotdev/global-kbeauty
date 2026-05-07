import { ApprovalsTable } from "~/app/dashboard/_components/approvals-table";

export default function CenterApprovalsPage() {
  return (
    <main className="w-full p-4 lg:p-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">Approvals</h1>
        <p className="text-sm text-neutral-500">
          Approvals for masters and certificates within your center.
        </p>
      </header>
      <ApprovalsTable />
    </main>
  );
}
