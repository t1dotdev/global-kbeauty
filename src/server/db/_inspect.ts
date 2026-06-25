import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";

const email = process.argv[2] ?? "petchxpanuphong@gmail.com";

async function main() {
  const admin = await db.query.roles.findFirst({
    where: (r, { eq }) => eq(r.kind, "admin"),
  });
  if (!admin) throw new Error("admin role missing — run seed first");
  const res = await db
    .update(users)
    .set({ roleId: admin.id, status: "approved" })
    .where(eq(users.email, email))
    .returning({ email: users.email, roleId: users.roleId, status: users.status });
  console.log("PROMOTED:", res);
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
