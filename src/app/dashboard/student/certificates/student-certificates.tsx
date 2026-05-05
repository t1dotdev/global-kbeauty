"use client";

import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";

export function StudentCertificates() {
  const requests = api.certificateRequest.myRequests.useQuery();
  const certs = api.certificate.myCertificates.useQuery();

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-base font-semibold">Issued</h2>
          <Link
            href="/dashboard/student/request"
            className="text-sm font-medium text-neutral-700 hover:underline"
          >
            New request
          </Link>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issued</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {certs.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-neutral-500">
                  No certificates yet.
                </TableCell>
              </TableRow>
            )}
            {certs.data?.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.issuedAt.toLocaleString()}</TableCell>
                <TableCell className="font-mono text-xs">
                  {c.sharedSlug}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/certificate/${c.sharedSlug}`}
                    target="_blank"
                    className="mr-2 text-sm text-neutral-700 hover:underline"
                  >
                    Share
                  </Link>
                  <DownloadButton id={c.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-base font-semibold">Pending requests</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-neutral-500">
                  No requests in flight.
                </TableCell>
              </TableRow>
            )}
            {requests.data?.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.createdAt.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {r.status.replace("_", " ")}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}

function DownloadButton({ id }: { id: string }) {
  const sign = api.certificate.signedDownload.useMutation();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={sign.isPending}
      onClick={async () => {
        const res = await sign.mutateAsync({ id });
        window.open(res.url, "_blank");
      }}
    >
      Download
    </Button>
  );
}
