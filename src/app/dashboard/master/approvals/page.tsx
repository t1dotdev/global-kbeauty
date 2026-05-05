import { ApprovalsTable } from "~/app/dashboard/_components/approvals-table";

export default function MasterApprovalsPage() {
  return (
    <main className="mx-auto max-w-5xl p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
        <p className="text-sm text-neutral-500">
          Master approvals you are eligible for, plus students under your wing.
        </p>
      </header>
      <ApprovalsTable />
    </main>
  );
}
