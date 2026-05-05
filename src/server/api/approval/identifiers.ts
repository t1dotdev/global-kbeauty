import { and, eq, like } from "drizzle-orm";
import { masterProfiles } from "~/server/db/schema";
import type { db as DB } from "~/server/db";

type Tx = Parameters<Parameters<typeof DB.transaction>[0]>[0];

export function centerCode(suffix: string) {
  const s = suffix.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.length < 3 || s.length > 4) {
    throw new Error("Center suffix must be 3-4 alphanumeric characters.");
  }
  return `GKB-CTR-${s}`;
}

export async function nextMasterCode(
  tx: Tx,
  centerCodeStr: string,
  level: number,
) {
  const lvl = String(level).padStart(2, "0");
  const prefix = `${centerCodeStr}-M${lvl}`;
  const existing = await tx
    .select({ code: masterProfiles.masterCode })
    .from(masterProfiles)
    .where(
      and(
        // both must be present; cast safely
        eq(masterProfiles.currentLevel, level),
        like(masterProfiles.masterCode, `${prefix}%`),
      ),
    );
  let max = 0;
  for (const row of existing) {
    if (!row.code) continue;
    const m = /M\d{2}(\d{3,})$/.exec(row.code);
    if (m?.[1]) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  const next = String(max + 1).padStart(3, "0");
  return `${prefix}${next}`;
}

export async function nextStudentCode(
  tx: Tx,
  masterCodeStr: string,
): Promise<string> {
  // students aren't allocated yet (Phase 6); placeholder generator.
  const { studentProfiles } = await import("~/server/db/schema");
  const prefix = `${masterCodeStr}-S`;
  const rows = await tx
    .select({ code: studentProfiles.studentCode })
    .from(studentProfiles)
    .where(like(studentProfiles.studentCode, `${prefix}%`));
  let max = 0;
  for (const row of rows) {
    if (!row.code) continue;
    const m = /-S(\d{3,})$/.exec(row.code);
    if (m?.[1]) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  const next = String(max + 1).padStart(4, "0");
  return `${prefix}${next}`;
}
