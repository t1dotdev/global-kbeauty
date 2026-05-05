import { CoursesAdmin } from "./courses-admin";

export default function AdminCoursesPage() {
  return (
    <main className="mx-auto max-w-5xl p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
        <p className="text-sm text-neutral-500">
          Curriculum offered by centers across the platform.
        </p>
      </header>
      <CoursesAdmin />
    </main>
  );
}
