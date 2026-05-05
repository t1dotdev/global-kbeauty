import { CoursesAdmin } from "./courses-admin";

export default function AdminCoursesPage() {
  return (
    <main className="w-full p-8">
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">Courses</h1>
        <p className="text-sm text-neutral-500">
          Curriculum offered by centers across the platform.
        </p>
      </header>
      <CoursesAdmin />
    </main>
  );
}
