import { StudentsTable } from "~/app/dashboard/_components/students-table";

export default function CenterStudentsPage() {
  return (
    <main className="mx-auto max-w-6xl p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
        <p className="text-sm text-neutral-500">Students in your center.</p>
      </header>
      <StudentsTable />
    </main>
  );
}
