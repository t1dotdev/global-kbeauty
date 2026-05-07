import { Users } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { UsersAdmin } from "./users-admin";

export default function AdminUsersPage() {
  return (
    <main className="w-full p-4 lg:p-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-muted-foreground text-sm">
            All accounts on the platform with their assigned role.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 self-start">
          <Users className="size-3.5" />
          Directory
        </Badge>
      </header>
      <UsersAdmin />
    </main>
  );
}
