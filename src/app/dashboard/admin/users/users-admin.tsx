"use client";

import { useMemo, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/react";

type Filter = "all" | "admin" | "center" | "master" | "student" | "none";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "admin", label: "Admin" },
  { value: "center", label: "Center" },
  { value: "master", label: "Master" },
  { value: "student", label: "Student" },
  { value: "none", label: "Unassigned" },
];

const roleVariant: Record<
  "admin" | "center" | "master" | "student" | "none",
  "default" | "secondary" | "outline"
> = {
  admin: "default",
  center: "default",
  master: "secondary",
  student: "outline",
  none: "outline",
};

export function UsersAdmin() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const list = api.adminUser.list.useQuery({ search: search || undefined });

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: 0,
      admin: 0,
      center: 0,
      master: 0,
      student: 0,
      none: 0,
    };
    for (const u of list.data ?? []) {
      c.all += 1;
      const key = (u.roleKind ?? "none") as Exclude<Filter, "all">;
      c[key] += 1;
    }
    return c;
  }, [list.data]);

  const visible = (list.data ?? []).filter((u) =>
    filter === "all" ? true : (u.roleKind ?? "none") === filter,
  );

  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="-mx-1 min-w-0 overflow-x-auto px-1">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList>
              {filters.map((f) => (
                <TabsTrigger key={f.value} value={f.value}>
                  {f.label}
                  <span className="text-muted-foreground ml-1 text-xs">
                    {counts[f.value]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <Input
          placeholder="Search by name or email"
          className="w-full sm:max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-neutral-500">
                No users.
              </TableCell>
            </TableRow>
          )}
          {visible.map((u) => {
            const variantKey = u.roleKind ?? "none";
            const initials = (u.name ?? u.email)
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase())
              .join("");
            return (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarImage
                        src={u.image ?? undefined}
                        alt={u.name ?? u.email}
                      />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{u.name ?? "—"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-neutral-600">{u.email}</TableCell>
                <TableCell>
                  <Badge variant={roleVariant[variantKey]}>{u.roleLabel}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {u.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-neutral-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}
