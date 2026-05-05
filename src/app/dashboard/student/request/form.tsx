"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

export function CertRequestForm() {
  const router = useRouter();
  const courses = api.course.list.useQuery();
  const [courseId, setCourseId] = useState("");
  const [notes, setNotes] = useState("");

  const create = api.certificateRequest.create.useMutation({
    onSuccess: () => router.push("/dashboard/student/certificates"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!courseId) return;
        create.mutate({
          courseId,
          payload: notes ? { notes } : {},
        });
      }}
      className="grid gap-6 rounded-2xl border bg-white p-6 shadow-sm"
    >
      <div className="grid gap-2">
        <Label>Course</Label>
        <Select value={courseId} onValueChange={(v) => setCourseId(v ?? "")}>
          <SelectTrigger>
            <SelectValue placeholder="Select a course" />
          </SelectTrigger>
          <SelectContent>
            {courses.data?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} ({c.hours} h)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Notes for approvers (optional)</Label>
        <Textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {create.error ? (
        <p className="text-sm text-red-600">{create.error.message}</p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={!courseId || create.isPending}>
          {create.isPending ? "Submitting…" : "Submit request"}
        </Button>
      </div>
    </form>
  );
}
