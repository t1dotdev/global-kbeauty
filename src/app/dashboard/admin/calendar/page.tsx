import { CalendarView } from "~/app/dashboard/_components/calendar-view";

export default function AdminCalendarPage() {
  return (
    <main className="mx-auto max-w-4xl p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <p className="text-sm text-neutral-500">
          Global events visible to all authenticated users.
        </p>
      </header>
      <CalendarView canEdit />
    </main>
  );
}
