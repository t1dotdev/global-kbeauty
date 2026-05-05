"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { api, type RouterOutputs } from "~/trpc/react";

type CertReq = RouterOutputs["certificateRequest"]["list"][number];

export function CertificateAdmin() {
  const approved = api.certificateRequest.list.useQuery({ status: "approved" });
  const issued = api.certificate.list.useQuery({});
  const templates = api.template.list.useQuery();

  const [issuing, setIssuing] = useState<CertReq | null>(null);

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-base font-semibold">
            Approved cert requests waiting issuance
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {approved.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-neutral-500">
                  Nothing waiting.
                </TableCell>
              </TableRow>
            )}
            {approved.data?.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.createdAt.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {r.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" onClick={() => setIssuing(r)}>
                    Issue
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-base font-semibold">Issued certificates</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issued</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issued.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-neutral-500">
                  None yet.
                </TableCell>
              </TableRow>
            )}
            {issued.data?.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.issuedAt.toLocaleString()}</TableCell>
                <TableCell className="font-mono text-xs">
                  {c.sharedSlug}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/certificate/${c.sharedSlug}`}
                    target="_blank"
                    className="text-sm font-medium text-neutral-700 hover:underline"
                  >
                    Open
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {issuing ? (
        <IssueDialog
          request={issuing}
          templates={templates.data ?? []}
          onClose={() => {
            setIssuing(null);
            void approved.refetch();
            void issued.refetch();
          }}
        />
      ) : null}
    </div>
  );
}

function IssueDialog({
  request,
  templates,
  onClose,
}: {
  request: CertReq;
  templates: RouterOutputs["template"]["list"];
  onClose: () => void;
}) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const issue = api.certificate.issue.useMutation({
    onSuccess: onClose,
  });

  return (
    <Dialog open onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue certificate</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Template</Label>
            <Select
              value={templateId}
              onValueChange={(v) => setTemplateId(v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pick a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {issue.error ? (
            <p className="text-sm text-red-600">{issue.error.message}</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            disabled={!templateId || issue.isPending}
            onClick={() => issue.mutate({ requestId: request.id, templateId })}
          >
            {issue.isPending ? "Generating PDF…" : "Issue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
