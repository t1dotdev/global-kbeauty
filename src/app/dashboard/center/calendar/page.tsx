import { CalendarView } from "~/app/dashboard/_components/calendar-view";

export default function CenterCalendarPage() {
  return (
    <main className="w-full p-8">
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">Calendar</h1>
      </header>
      <CalendarView canEdit={false} />
    </main>
  );
}
