import { StudentsTable } from "~/app/dashboard/_components/students-table";

export default function CenterStudentsPage() {
  return (
    <main className="w-full p-8">
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">Students</h1>
        <p className="text-sm text-neutral-500">Students in your center.</p>
      </header>
      <StudentsTable />
    </main>
  );
}
