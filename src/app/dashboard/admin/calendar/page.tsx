import { CalendarView } from "~/app/dashboard/_components/calendar-view";

export default function AdminCalendarPage() {
  return (
    <main className="w-full p-4 lg:p-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">Calendar</h1>
        <p className="text-sm text-neutral-500">
          Global events visible to all authenticated users.
        </p>
      </header>
      <CalendarView canEdit />
    </main>
  );
}
