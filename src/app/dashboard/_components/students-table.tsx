"use client";

import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { api, type RouterOutputs } from "~/trpc/react";

type Student = RouterOutputs["student"]["list"][number];

export function StudentsTable({ canEdit = false }: { canEdit?: boolean }) {
  const [search, setSearch] = useState("");
  const list = api.student.list.useQuery({ search: search || undefined });
  const utils = api.useUtils();
  const remove = api.student.delete.useMutation({
    onSuccess: () => utils.student.list.invalidate(),
  });

  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b p-4">
        <h2 className="text-base font-semibold">Students</h2>
        <Input
          placeholder="Search by name, code, or ID"
          className="max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>ID / Passport</TableHead>
            <TableHead>Status</TableHead>
            {canEdit ? (
              <TableHead className="text-right">Actions</TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.data?.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={canEdit ? 5 : 4}
                className="text-center text-neutral-500"
              >
                No students.
              </TableCell>
            </TableRow>
          )}
          {list.data?.map((s: Student) => (
            <TableRow key={s.id}>
              <TableCell className="font-mono text-xs">
                {s.studentCode ?? "—"}
              </TableCell>
              <TableCell>{s.fullNameEn ?? "—"}</TableCell>
              <TableCell>{s.idOrPassport ?? "—"}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="capitalize">
                  {s.status}
                </Badge>
              </TableCell>
              {canEdit ? (
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm("Delete this student?")) {
                        remove.mutate({ id: s.id });
                      }
                    }}
                    disabled={remove.isPending}
                  >
                    Delete
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
