import { GraduationCap } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { CoursesAdmin } from "./courses-admin";

export default function AdminCoursesPage() {
  return (
    <main className="w-full p-4 lg:p-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
          <p className="text-muted-foreground text-sm">
            Curriculum offered by centers across the platform.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 self-start">
          <GraduationCap className="size-3.5" />
          Curriculum
        </Badge>
      </header>
      <CoursesAdmin />
    </main>
  );
}
