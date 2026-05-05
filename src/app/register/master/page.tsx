import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { MasterRegistrationForm } from "./form";

export default async function MasterRegisterPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleKind) redirect(`/dashboard/${session.user.roleKind}`);

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">
        Register as a Master
      </h1>
      <p className="mb-8 text-sm text-neutral-500">
        Choose the center you want to join and select your desired level. Your
        application is reviewed by all higher-level masters at the center, then
        the center, then admin.
      </p>
      <MasterRegistrationForm />
    </main>
  );
}
