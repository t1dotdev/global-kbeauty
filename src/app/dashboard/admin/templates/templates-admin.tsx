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

type Template = RouterOutputs["template"]["list"][number];

export function TemplatesAdmin() {
  const list = api.template.list.useQuery();
  const [editing, setEditing] = useState<Template | "new" | null>(null);

  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-base font-semibold">Templates</h2>
        <Button onClick={() => setEditing("new")}>New template</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.data?.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-neutral-500">
                No templates.
              </TableCell>
            </TableRow>
          )}
          {list.data?.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-medium">{t.name}</TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(t)}
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editing ? (
        <TemplateDialog
          template={editing === "new" ? null : editing}
          onClose={() => {
            setEditing(null);
            void list.refetch();
          }}
        />
      ) : null}
    </section>
  );
}

function TemplateDialog({
  template,
  onClose,
}: {
  template: Template | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [definitionText, setDefinitionText] = useState(
    JSON.stringify(template?.definition ?? {}, null, 2),
  );
  const [parseError, setParseError] = useState<string | null>(null);

  const create = api.template.create.useMutation({ onSuccess: onClose });
  const update = api.template.update.useMutation({ onSuccess: onClose });
  const remove = api.template.delete.useMutation({ onSuccess: onClose });
  const busy = create.isPending || update.isPending || remove.isPending;

  function parse() {
    try {
      const def = JSON.parse(definitionText) as Record<string, unknown>;
      setParseError(null);
      return def;
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON");
      return null;
    }
  }

  return (
    <Dialog open onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit template" : "New template"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Definition (JSON)</Label>
            <Textarea
              rows={10}
              value={definitionText}
              onChange={(e) => setDefinitionText(e.target.value)}
              className="font-mono text-xs"
            />
            {parseError ? (
              <p className="text-xs text-red-600">{parseError}</p>
            ) : null}
          </div>
          {(create.error ?? update.error ?? remove.error) ? (
            <p className="text-sm text-red-600">
              {(create.error ?? update.error ?? remove.error)?.message}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          {template ? (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => remove.mutate({ id: template.id })}
            >
              Delete
            </Button>
          ) : null}
          <Button
            disabled={busy || name.length < 2}
            onClick={() => {
              const def = parse();
              if (!def) return;
              if (template) {
                update.mutate({ id: template.id, name, definition: def });
              } else {
                create.mutate({ name, definition: def });
              }
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
