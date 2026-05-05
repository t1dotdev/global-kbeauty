import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { CenterRegistrationForm } from "./form";

export default async function CenterRegisterPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleKind) redirect(`/dashboard/${session.user.roleKind}`);

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">
        Register a Center
      </h1>
      <p className="mb-8 text-sm text-neutral-500">
        Submit your center for admin approval. You can edit your details later
        from your center dashboard.
      </p>
      <CenterRegistrationForm />
    </main>
  );
}
