"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";

export function RevenueTable() {
  const ledger = api.revenue.myEntries.useQuery({ limit: 100 });
  const total = api.revenue.myTotal.useQuery();

  return (
    <section className="grid gap-4">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="text-sm text-neutral-500">Total earnings</div>
        <div className="text-3xl font-semibold">฿ {total.data ?? "0"}</div>
      </div>
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-base font-semibold">Recent</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Amount (THB)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledger.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-neutral-500">
                  No earnings yet.
                </TableCell>
              </TableRow>
            )}
            {ledger.data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.createdAt.toLocaleString()}</TableCell>
                <TableCell className="capitalize">{row.sourceType}</TableCell>
                <TableCell className="text-right">{row.amountThb}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
