import "dotenv/config";
import { db } from "~/server/db";
import { roles } from "~/server/db/schema";
import { eq, and, isNull } from "drizzle-orm";

async function ensureRole(input: {
  kind: "admin" | "center" | "master";
  level: number | null;
  name: string;
  description?: string;
  amountThb?: string;
}) {
  const existing = await db.query.roles.findFirst({
    where: input.level === null
      ? and(eq(roles.kind, input.kind), isNull(roles.level))
      : and(eq(roles.kind, input.kind), eq(roles.level, input.level)),
  });
  if (existing) return existing;
  const [created] = await db
    .insert(roles)
    .values({
      kind: input.kind,
      level: input.level,
      name: input.name,
      description: input.description,
      amountThb: input.amountThb ?? "0",
    })
    .returning();
  return created;
}

async function main() {
  await ensureRole({
    kind: "admin",
    level: null,
    name: "Administrator",
    description: "Platform administrator",
  });
  await ensureRole({
    kind: "center",
    level: null,
    name: "Center",
    description: "Training center",
    amountThb: "0",
  });
  for (const lvl of [1, 2, 3, 4, 5]) {
    await ensureRole({
      kind: "master",
      level: lvl,
      name: `Master Lv ${lvl}`,
      description: `Master level ${lvl}`,
      amountThb: "0",
    });
  }
  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
