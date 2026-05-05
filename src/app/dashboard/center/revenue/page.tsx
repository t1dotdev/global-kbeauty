import { RevenueTable } from "~/app/dashboard/_components/revenue-table";

export default function CenterRevenuePage() {
  return (
    <main className="mx-auto max-w-5xl p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Revenue</h1>
        <p className="text-sm text-neutral-500">
          Earnings from approvals you have signed off.
        </p>
      </header>
      <RevenueTable />
    </main>
  );
}
