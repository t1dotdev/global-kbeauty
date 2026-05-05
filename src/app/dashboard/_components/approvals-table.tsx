"use client";

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
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { api, type RouterOutputs } from "~/trpc/react";

type QueueItem = RouterOutputs["approval"]["myQueue"][number];

export function ApprovalsTable() {
  const queue = api.approval.myQueue.useQuery();
  const [active, setActive] = useState<QueueItem | null>(null);

  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      <div className="border-b p-4">
        <h2 className="text-base font-semibold">Pending approvals</h2>
        <p className="text-sm text-neutral-500">
          {queue.data?.length ?? 0} item(s) awaiting your decision.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Step</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {queue.data?.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-neutral-500">
                Nothing in your queue.
              </TableCell>
            </TableRow>
          )}
          {queue.data?.map((item) => (
            <TableRow key={item.step.id}>
              <TableCell>
                <Badge variant="secondary" className="capitalize">
                  {item.kind}
                </Badge>
              </TableCell>
              <TableCell>{describeTarget(item)}</TableCell>
              <TableCell>
                <span className="text-xs text-neutral-500">
                  Step {item.step.orderIndex + 1} · {item.step.requiredKind}
                  {item.step.requiredRoleLevel != null
                    ? ` Lv ${item.step.requiredRoleLevel}`
                    : ""}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" onClick={() => setActive(item)}>
                  Review
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {active ? (
        <DecideDialog
          item={active}
          onClose={() => {
            setActive(null);
            void queue.refetch();
          }}
        />
      ) : null}
    </section>
  );
}

function describeTarget(item: QueueItem) {
  if (item.kind === "center") {
    return item.target?.name ?? item.step.targetId;
  }
  if (item.kind === "master") {
    const t = item.target;
    if (!t) return item.step.targetId;
    const name = [t.firstNameEn, t.lastNameEn].filter(Boolean).join(" ");
    const label = name ? name : (t.masterCode ?? t.id);
    return `${label} (Lv ${t.currentLevel})`;
  }
  if (item.kind === "student") {
    return item.target?.fullNameEn ?? item.step.targetId;
  }
  return item.step.targetId;
}

function DecideDialog({
  item,
  onClose,
}: {
  item: QueueItem;
  onClose: () => void;
}) {
  const [comment, setComment] = useState("");
  const [centerCodeSuffix, setCenterCodeSuffix] = useState("");
  const decide = api.approval.decide.useMutation({
    onSuccess: () => onClose(),
  });

  const isFinalCenterAdminStep =
    item.kind === "center" && item.step.requiredKind === "admin";

  return (
    <Dialog open onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="capitalize">
            Review {item.kind} approval
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Comment</label>
            <Textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          {isFinalCenterAdminStep ? (
            <div>
              <label className="mb-1 block text-sm font-medium">
                Center code suffix (3-4 chars)
              </label>
              <Input
                value={centerCodeSuffix}
                onChange={(e) =>
                  setCenterCodeSuffix(e.target.value.toUpperCase())
                }
                placeholder="BKK"
                maxLength={4}
              />
              <p className="mt-1 text-xs text-neutral-500">
                Will produce code GKB-CTR-
                {centerCodeSuffix || "XXX"}.
              </p>
            </div>
          ) : null}
          {decide.error ? (
            <p className="text-sm text-red-600">{decide.error.message}</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={decide.isPending}
            onClick={() =>
              decide.mutate({
                stepId: item.step.id,
                decision: "decline",
                comment: comment || undefined,
              })
            }
          >
            Decline
          </Button>
          <Button
            disabled={
              decide.isPending ||
              (isFinalCenterAdminStep && centerCodeSuffix.length < 3)
            }
            onClick={() =>
              decide.mutate({
                stepId: item.step.id,
                decision: "approve",
                comment: comment || undefined,
                centerCodeSuffix: isFinalCenterAdminStep
                  ? centerCodeSuffix
                  : undefined,
              })
            }
          >
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
