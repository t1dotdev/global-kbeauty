import { UsersAdmin } from "./users-admin";

export default function AdminUsersPage() {
  return (
    <main className="w-full p-8">
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-neutral-500">
          All accounts on the platform with their assigned role.
        </p>
      </header>
      <UsersAdmin />
    </main>
  );
}
