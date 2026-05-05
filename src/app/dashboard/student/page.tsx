import Link from "next/link";
import { auth, signOut } from "~/server/auth";

export default async function StudentDashboardPage() {
  const session = await auth();
  const status = session?.user?.status;
  return (
    <main className="mx-auto max-w-5xl p-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Student</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-neutral-50">
            Sign out
          </button>
        </form>
      </header>

      {status === "pending_approval" ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Your registration is pending approval from your master.
        </div>
      ) : null}

      <nav className="grid gap-3 sm:grid-cols-2">
        <NavCard
          href="/dashboard/student/certificates"
          title="My certificates"
          desc="Issued certificates and pending requests"
        />
        <NavCard
          href="/dashboard/student/request"
          title="Request a certificate"
          desc="Pick a course and submit for approval"
        />
      </nav>
    </main>
  );
}

function NavCard({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border bg-white p-5 shadow-sm transition hover:border-neutral-900 hover:shadow"
    >
      <div className="text-base font-semibold">{title}</div>
      <div className="text-sm text-neutral-500">{desc}</div>
    </Link>
  );
}
