"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { api, type RouterOutputs } from "~/trpc/react";

type Event = RouterOutputs["calendar"]["list"][number];

export function CalendarView({ canEdit }: { canEdit: boolean }) {
  const list = api.calendar.list.useQuery({});
  const [editing, setEditing] = useState<Event | "new" | null>(null);

  const grouped = (list.data ?? []).reduce<Record<string, Event[]>>(
    (acc, ev) => {
      const k = ev.startsAt.toLocaleDateString();
      (acc[k] ??= []).push(ev);
      return acc;
    },
    {},
  );

  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-base font-semibold">Upcoming events</h2>
        {canEdit ? (
          <Button onClick={() => setEditing("new")}>New event</Button>
        ) : null}
      </div>
      <div className="divide-y">
        {Object.keys(grouped).length === 0 && (
          <div className="p-8 text-center text-sm text-neutral-500">
            No events scheduled.
          </div>
        )}
        {Object.entries(grouped).map(([date, events]) => (
          <div key={date} className="grid gap-2 p-4">
            <div className="text-sm font-semibold text-neutral-600">{date}</div>
            <ul className="grid gap-2">
              {events.map((ev) => (
                <li
                  key={ev.id}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3"
                >
                  <div>
                    <div className="text-sm font-medium">{ev.title}</div>
                    {ev.description ? (
                      <div className="mt-0.5 text-xs text-neutral-600">
                        {ev.description}
                      </div>
                    ) : null}
                    <div className="mt-1 text-xs text-neutral-500">
                      {ev.startsAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      –{" "}
                      {ev.endsAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  {canEdit ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(ev)}
                    >
                      Edit
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {editing ? (
        <EventDialog
          event={editing === "new" ? null : editing}
          onClose={() => {
            setEditing(null);
            void list.refetch();
          }}
        />
      ) : null}
    </section>
  );
}

function toDateTimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EventDialog({
  event,
  onClose,
}: {
  event: Event | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [startsAt, setStartsAt] = useState(
    event ? toDateTimeLocal(event.startsAt) : "",
  );
  const [endsAt, setEndsAt] = useState(
    event ? toDateTimeLocal(event.endsAt) : "",
  );

  const create = api.calendar.create.useMutation({ onSuccess: onClose });
  const update = api.calendar.update.useMutation({ onSuccess: onClose });
  const remove = api.calendar.delete.useMutation({ onSuccess: onClose });
  const busy = create.isPending || update.isPending || remove.isPending;

  return (
    <Dialog open onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event ? "Edit event" : "New event"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Starts</Label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Ends</Label>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {(create.error ?? update.error ?? remove.error) ? (
            <p className="text-sm text-red-600">
              {(create.error ?? update.error ?? remove.error)?.message}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          {event ? (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => remove.mutate({ id: event.id })}
            >
              Delete
            </Button>
          ) : null}
          <Button
            disabled={busy || title.length < 1 || !startsAt || !endsAt}
            onClick={() => {
              const payload = {
                title,
                description: description || undefined,
                startsAt: new Date(startsAt),
                endsAt: new Date(endsAt),
              };
              if (event) update.mutate({ id: event.id, ...payload });
              else create.mutate(payload);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
