"use client";

import { useState } from "react";
import {
  Award,
  Building2,
  Inbox,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
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
type Kind = QueueItem["kind"];

const KIND_META: Record<
  Kind,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeClass: string;
    accent: string;
  }
> = {
  center: {
    label: "Center",
    icon: Building2,
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    accent: "text-blue-600",
  },
  master: {
    label: "Master",
    icon: Sparkles,
    badgeClass: "border-purple-200 bg-purple-50 text-purple-700",
    accent: "text-purple-600",
  },
  student: {
    label: "Student",
    icon: Award,
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    accent: "text-emerald-600",
  },
};

export function ApprovalsTable() {
  const queue = api.approval.myQueue.useQuery();
  const [active, setActive] = useState<QueueItem | null>(null);

  const items = queue.data ?? [];
  const counts = items.reduce<Record<Kind, number>>(
    (acc, item) => {
      acc[item.kind] = (acc[item.kind] ?? 0) + 1;
      return acc;
    },
    { center: 0, master: 0, student: 0 },
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(KIND_META) as Kind[]).map((kind) => (
          <StatCard
            key={kind}
            label={KIND_META[kind].label}
            value={counts[kind] ?? 0}
            Icon={KIND_META[kind].icon}
            accent={KIND_META[kind].accent}
          />
        ))}
      </div>

      <section className="bg-card rounded-2xl border shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="text-base font-semibold">Pending approvals</h2>
            <p className="text-muted-foreground text-sm">
              {items.length} item(s) awaiting your decision.
            </p>
          </div>
          {queue.isFetching ? (
            <Loader2 className="text-muted-foreground size-4 animate-spin" />
          ) : null}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Type</TableHead>
              <TableHead>Target</TableHead>
              <TableHead className="hidden md:table-cell">Step</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queue.isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center">
                  <Loader2 className="text-muted-foreground mx-auto size-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12">
                  <div className="text-muted-foreground flex flex-col items-center gap-2">
                    <Inbox className="size-8" />
                    <p className="text-sm font-medium">Nothing in your queue</p>
                    <p className="text-xs">
                      You&apos;re all caught up. Check back later.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const meta = KIND_META[item.kind] ?? {
                  label: item.kind,
                  icon: ShieldCheck,
                  badgeClass: "",
                  accent: "",
                };
                const Icon = meta.icon;
                return (
                  <TableRow key={item.step.id}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`gap-1.5 ${meta.badgeClass}`}
                      >
                        <Icon className="size-3.5" />
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {describeTarget(item)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-muted-foreground text-xs">
                        Step {item.step.orderIndex + 1} ·{" "}
                        {item.step.requiredKind}
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
                );
              })
            )}
          </TableBody>
        </Table>
      </section>

      {active ? (
        <DecideDialog
          item={active}
          onClose={() => {
            setActive(null);
            void queue.refetch();
          }}
        />
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  Icon,
  accent,
}: {
  label: string;
  value: number;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="bg-card flex items-center gap-3 rounded-2xl border p-4 shadow-sm">
      <div
        className={`bg-muted flex size-10 items-center justify-center rounded-lg ${accent}`}
      >
        <Icon className="size-5" />
      </div>
      <div>
        <div className="text-muted-foreground text-xs tracking-wide uppercase">
          {label}
        </div>
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
      </div>
    </div>
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
              <p className="text-muted-foreground mt-1 text-xs">
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
