import { RevenueTable } from "~/app/dashboard/_components/revenue-table";

export default function CenterRevenuePage() {
  return (
    <main className="w-full p-8">
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">Revenue</h1>
        <p className="text-sm text-neutral-500">
          Earnings from approvals you have signed off.
        </p>
      </header>
      <RevenueTable />
    </main>
  );
}
