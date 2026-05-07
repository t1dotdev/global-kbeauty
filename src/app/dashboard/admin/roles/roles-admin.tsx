"use client";

import { useState } from "react";
import {
  Building2,
  Inbox,
  KeyRound,
  Loader2,
  Plus,
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
import { Label } from "~/components/ui/label";
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

type Role = RouterOutputs["role"]["list"][number];
type Kind = "master" | "center" | "admin";

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

const KIND_META: Record<
  Kind,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeClass: string;
    accent: string;
  }
> = {
  master: {
    label: "Master",
    icon: Sparkles,
    badgeClass: "border-purple-200 bg-purple-50 text-purple-700",
    accent: "text-purple-600",
  },
  center: {
    label: "Center",
    icon: Building2,
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    accent: "text-blue-600",
  },
  admin: {
    label: "Admin",
    icon: ShieldCheck,
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
    accent: "text-amber-600",
  },
};

function formatThb(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export function RolesAdmin() {
  const list = api.role.list.useQuery();
  const [editing, setEditing] = useState<Role | "new" | null>(null);

  const items = list.data ?? [];
  const counts = items.reduce<Record<Kind, number>>(
    (acc, r) => {
      acc[r.kind as Kind] = (acc[r.kind as Kind] ?? 0) + 1;
      return acc;
    },
    { master: 0, center: 0, admin: 0 },
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
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-base font-semibold">All roles</h2>
              <p className="text-muted-foreground text-sm">
                {items.length} total · payouts in THB
              </p>
            </div>
            {list.isFetching ? (
              <Loader2 className="text-muted-foreground size-4 animate-spin" />
            ) : null}
          </div>
          <Button onClick={() => setEditing("new")}>
            <Plus className="size-4" />
            New role
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-[140px]">Kind</TableHead>
              <TableHead className="w-[80px]">Level</TableHead>
              <TableHead className="w-[140px] text-right">
                Payout (THB)
              </TableHead>
              <TableHead className="hidden md:table-cell">
                Description
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <Loader2 className="text-muted-foreground mx-auto size-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12">
                  <div className="text-muted-foreground flex flex-col items-center gap-2">
                    <Inbox className="size-8" />
                    <p className="text-sm font-medium">No roles yet</p>
                    <p className="text-xs">
                      Create one to define payouts and permissions.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((r) => {
                const meta = KIND_META[r.kind as Kind] ?? {
                  label: r.kind,
                  icon: KeyRound,
                  badgeClass: "",
                  accent: "",
                };
                const Icon = meta.icon;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`gap-1.5 ${meta.badgeClass}`}
                      >
                        <Icon className="size-3.5" />
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.level != null ? (
                        <span className="font-mono text-sm">Lv {r.level}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatThb(r.amountThb)}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden max-w-md truncate md:table-cell">
                      {r.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(r)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </section>

      {editing ? (
        <RoleDialog
          initial={editing === "new" ? null : editing}
          onClose={() => {
            setEditing(null);
            void list.refetch();
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

function RoleDialog({
  initial,
  onClose,
}: {
  initial: Role | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amountThb, setAmountThb] = useState(initial?.amountThb ?? "0");
  const [kind, setKind] = useState<Kind>(initial?.kind ?? "master");
  const [level, setLevel] = useState<number>(initial?.level ?? 1);

  const create = api.role.create.useMutation({ onSuccess: () => onClose() });
  const update = api.role.update.useMutation({ onSuccess: () => onClose() });
  const remove = api.role.delete.useMutation({ onSuccess: () => onClose() });

  const busy = create.isPending || update.isPending || remove.isPending;
  const error =
    create.error?.message ?? update.error?.message ?? remove.error?.message;

  const validAmount = AMOUNT_RE.test(amountThb);
  const canSubmit = !busy && name.trim().length >= 2 && validAmount;

  const submit = () => {
    const effectiveLevel = kind === "master" ? level : null;
    const payload = {
      name,
      description: description || undefined,
      amountThb,
      kind,
      level: effectiveLevel,
    };
    if (initial) {
      update.mutate({ id: initial.id, ...payload });
    } else {
      create.mutate(payload);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit role" : "New role"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <Label className="mb-1 block">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Kind</Label>
              <select
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                value={kind}
                onChange={(e) => setKind(e.target.value as Kind)}
              >
                <option value="master">master</option>
                <option value="center">center</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div>
              <Label className="mb-1 block">
                Level {kind === "master" ? "" : "(n/a)"}
              </Label>
              <Input
                type="number"
                min={0}
                max={99}
                disabled={kind !== "master"}
                value={kind === "master" ? level : ""}
                onChange={(e) => setLevel(parseInt(e.target.value || "0", 10))}
              />
            </div>
          </div>
          <div>
            <Label className="mb-1 block">Payout (THB)</Label>
            <Input
              inputMode="decimal"
              value={amountThb}
              onChange={(e) => setAmountThb(e.target.value)}
            />
            {!validAmount ? (
              <p className="mt-1 text-xs text-red-600">
                Use a non-negative number with up to 2 decimals.
              </p>
            ) : null}
          </div>
          <div>
            <Label className="mb-1 block">Description</Label>
            <Textarea
              rows={4}
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
        <DialogFooter className="gap-2">
          {initial ? (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => remove.mutate({ id: initial.id })}
            >
              Delete
            </Button>
          ) : null}
          <Button disabled={!canSubmit} onClick={submit}>
            {initial ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
