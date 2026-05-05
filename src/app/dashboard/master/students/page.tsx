import { StudentsTable } from "~/app/dashboard/_components/students-table";

export default function MasterStudentsPage() {
  return (
    <main className="w-full p-8">
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">Students</h1>
        <p className="text-sm text-neutral-500">
          Lv 1 masters: students you sponsor. Higher levels: students within
          your center.
        </p>
      </header>
      <StudentsTable />
    </main>
  );
}
