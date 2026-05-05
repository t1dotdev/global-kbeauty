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

type Course = RouterOutputs["course"]["list"][number];

export function CoursesAdmin() {
  const list = api.course.list.useQuery();
  const [editing, setEditing] = useState<Course | "new" | null>(null);

  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-base font-semibold">All courses</h2>
        <Button onClick={() => setEditing("new")}>New course</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.data?.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-neutral-500">
                No courses yet.
              </TableCell>
            </TableRow>
          )}
          {list.data?.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>{c.hours}</TableCell>
              <TableCell className="max-w-md truncate text-neutral-500">
                {c.description}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(c)}
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editing ? (
        <CourseDialog
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

function CourseDialog({
  initial,
  onClose,
}: {
  initial: Course | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [hours, setHours] = useState(initial?.hours ?? 0);

  const create = api.course.create.useMutation({ onSuccess: () => onClose() });
  const update = api.course.update.useMutation({ onSuccess: () => onClose() });
  const remove = api.course.delete.useMutation({ onSuccess: () => onClose() });

  const busy = create.isPending || update.isPending || remove.isPending;
  const error = create.error?.message ?? update.error?.message ?? remove.error?.message;

  return (
    <Dialog open onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit course" : "New course"}</DialogTitle>
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
          <div>
            <Label className="mb-1 block">Hours</Label>
            <Input
              type="number"
              min={0}
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value || "0", 10))}
            />
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
          <Button
            disabled={busy || name.trim().length < 2}
            onClick={() =>
              initial
                ? update.mutate({
                    id: initial.id,
                    name,
                    hours,
                    description: description || undefined,
                  })
                : create.mutate({
                    name,
                    hours,
                    description: description || undefined,
                  })
            }
          >
            {initial ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
