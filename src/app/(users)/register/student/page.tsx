import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { StudentRegistrationForm } from "./form";

export default async function StudentRegisterPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleKind) redirect(`/dashboard/${session.user.roleKind}`);

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">
        Register as a Student
      </h1>
      <p className="mb-8 text-sm text-neutral-500">
        Choose the center then your Lv 1 master. Your master reviews your
        application before you can request certificates.
      </p>
      <StudentRegistrationForm />
    </main>
  );
}
