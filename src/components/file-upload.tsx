"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;

type Prefix =
  | "centers/"
  | "masters/"
  | "students/"
  | "certificates/"
  | "templates/";

type Props = {
  prefix: Prefix;
  value: string | null;
  onChange: (key: string | null) => void;
  accept?: string;
  label?: string;
};

export function FileUpload({
  prefix,
  value,
  onChange,
  accept = "image/png,image/jpeg,image/webp,application/pdf",
  label = "Upload file",
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const presign = api.upload.presign.useMutation();

  async function handle(file: File) {
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("File exceeds 10MB.");
      return;
    }
    setBusy(true);
    try {
      const { uploadUrl, key } = await presign.mutateAsync({
        prefix,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
      });
      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      onChange(key);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-3">
        <label
          className={cn(
            "inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs transition hover:bg-accent",
            busy && "pointer-events-none opacity-60",
          )}
        >
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handle(f);
            }}
          />
          {busy ? "Uploading…" : label}
        </label>
        {value ? (
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <span className="max-w-[260px] truncate">{value.split("/").pop()}</span>
            <button
              type="button"
              className="text-xs text-red-600 hover:underline"
              onClick={() => onChange(null)}
            >
              Remove
            </button>
          </div>
        ) : (
          <span className="text-sm text-neutral-500">No file</span>
        )}
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
