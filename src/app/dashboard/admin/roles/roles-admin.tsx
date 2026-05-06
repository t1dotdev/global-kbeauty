"use client";

import { useState } from "react";

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

export function RolesAdmin() {
  const list = api.role.list.useQuery();
  const [editing, setEditing] = useState<Role | "new" | null>(null);

  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-base font-semibold">All roles</h2>
        <Button onClick={() => setEditing("new")}>New role</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Kind</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Payout (THB)</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.data?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-neutral-500">
                No roles yet.
              </TableCell>
            </TableRow>
          )}
          {list.data?.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell className="capitalize">{r.kind}</TableCell>
              <TableCell>{r.level ?? "—"}</TableCell>
              <TableCell>{r.amountThb}</TableCell>
              <TableCell className="max-w-md truncate text-neutral-500">
                {r.description}
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
          ))}
        </TableBody>
      </Table>
      {editing ? (
        <RoleDialog
          initial={editing === "new" ? null : editing}
          onClose={() => {
            setEditing(null);
            void list.refetch();
          }}
        />
      ) : null}
    </section>
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
