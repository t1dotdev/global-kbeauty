"use client";

import { useMemo, useState } from "react";
import { Inbox, Loader2, Search } from "lucide-react";

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

const roleBadgeClass: Record<Exclude<Filter, "all">, string> = {
  admin: "border-amber-200 bg-amber-50 text-amber-800",
  center: "border-blue-200 bg-blue-50 text-blue-700",
  master: "border-purple-200 bg-purple-50 text-purple-700",
  student: "border-emerald-200 bg-emerald-50 text-emerald-700",
  none: "border-neutral-200 bg-neutral-50 text-neutral-600",
};

const statusBadgeClass: Record<string, string> = {
  active: "border-green-200 bg-green-50 text-green-700",
  pending_approval: "border-amber-200 bg-amber-50 text-amber-800",
  suspended: "border-red-200 bg-red-50 text-red-700",
  invited: "border-sky-200 bg-sky-50 text-sky-700",
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
    <section className="bg-card rounded-2xl border shadow-sm">
      <div className="flex flex-col gap-3 border-b p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-base font-semibold">All users</h2>
              <p className="text-muted-foreground text-sm">
                {counts.all} total
              </p>
            </div>
            {list.isFetching ? (
              <Loader2 className="text-muted-foreground size-4 animate-spin" />
            ) : null}
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search by name or email"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
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
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center">
                <Loader2 className="text-muted-foreground mx-auto size-5 animate-spin" />
              </TableCell>
            </TableRow>
          ) : visible.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-12">
                <div className="text-muted-foreground flex flex-col items-center gap-2">
                  <Inbox className="size-8" />
                  <p className="text-sm font-medium">No users</p>
                  <p className="text-xs">Try a different filter or search.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            visible.map((u) => {
              const variantKey = (u.roleKind ?? "none") as Exclude<
                Filter,
                "all"
              >;
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
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {u.name ?? "—"}
                        </div>
                        <div className="text-muted-foreground truncate text-xs md:hidden">
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={roleBadgeClass[variantKey]}
                    >
                      {u.roleLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`capitalize ${
                        statusBadgeClass[u.status] ??
                        "border-neutral-200 bg-neutral-50 text-neutral-600"
                      }`}
                    >
                      {u.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden lg:table-cell">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </section>
  );
}
