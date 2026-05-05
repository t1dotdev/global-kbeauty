import { CalendarView } from "~/app/dashboard/_components/calendar-view";

export default function CenterCalendarPage() {
  return (
    <main className="mx-auto max-w-4xl p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
      </header>
      <CalendarView canEdit={false} />
    </main>
  );
}
