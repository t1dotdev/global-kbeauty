import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { auth, signOut } from "~/server/auth";

export default async function RegisterSelectorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.roleKind) {
    return <SessionRefreshRequired roleKind={session.user.roleKind} />;
  }

  const t = await getTranslations("register");

  const options = [
    {
      href: "/register/student",
      title: t("student"),
      desc: t("studentDesc"),
    },
    {
      href: "/register/master",
      title: t("master"),
      desc: t("masterDesc"),
    },
    {
      href: "/register/center",
      title: t("center"),
      desc: t("centerDesc"),
    },
  ];

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">
          {t("chooseRole")}
        </h1>
        <p className="text-muted-foreground mb-8 text-sm">
          {t("chooseRoleSubtitle")}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {options.map((opt) => (
            <Link
              key={opt.href}
              href={opt.href}
              className="group rounded-4xl focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
            >
              <Card className="h-full transition group-hover:shadow-lg">
                <CardHeader>
                  <CardTitle>{opt.title}</CardTitle>
                  <CardDescription>{opt.desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

function SessionRefreshRequired({ roleKind }: { roleKind: string }) {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Session refresh required</CardTitle>
          <CardDescription>
            Your account role is set to {roleKind}, but your browser still has
            an older session token. Sign out and sign back in to refresh access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit">Sign out</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
