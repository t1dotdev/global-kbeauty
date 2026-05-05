import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { BellIcon, LogOutIcon } from "lucide-react";

import { LocaleSwitcher } from "~/components/locale-switcher";
import { ThemeSwitcher } from "~/components/theme-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Separator } from "~/components/ui/separator";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import { auth, signOut } from "~/server/auth";
import type { SessionRoleKind } from "~/server/auth/config.edge";

import {
  DashboardSidebar,
  type DashboardSidebarItem,
} from "./_components/dashboard-sidebar";

const roleTitles: Record<SessionRoleKind, string> = {
  admin: "Admin",
  center: "Center",
  master: "Master",
  student: "Student",
};

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [session, t, cookieStore] = await Promise.all([
    auth(),
    getTranslations(),
    cookies(),
  ]);
  const roleKind = session?.user?.roleKind ?? "student";
  const roleTitle = roleTitles[roleKind];
  const items = getDashboardItems(roleKind, t);
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const userName = session?.user?.name ?? roleTitle;
  const userEmail = session?.user?.email ?? "";
  const avatarFallback = getAvatarFallback(userName, userEmail);

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <DashboardSidebar
        items={items}
        roleKind={roleKind}
        roleTitle={roleTitle}
      />
      <div className="bg-background flex min-w-0 flex-1 flex-col md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-3xl md:peer-data-[variant=inset]:border md:peer-data-[variant=inset]:shadow-sm">
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur md:rounded-t-3xl md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="my-auto h-4 data-vertical:self-auto"
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold tracking-tight">
              {roleTitle}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Notifications">
              <BellIcon className="size-4" />
            </Button>
            <div className="hidden sm:block">
              <LocaleSwitcher />
            </div>
            <ThemeSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" className="h-10 gap-2 px-2" />}
              >
                <Avatar className="size-8">
                  <AvatarImage
                    src={session?.user?.image ?? undefined}
                    alt={userName}
                  />
                  <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>
                <span className="hidden max-w-28 truncate text-sm font-medium lg:inline">
                  {userName}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-3 px-2 py-2 text-left">
                      <Avatar className="size-9">
                        <AvatarImage
                          src={session?.user?.image ?? undefined}
                          alt={userName}
                        />
                        <AvatarFallback>{avatarFallback}</AvatarFallback>
                      </Avatar>
                      <div className="grid min-w-0 flex-1 text-sm leading-tight">
                        <span className="truncate font-medium">{userName}</span>
                        <span className="text-muted-foreground truncate text-xs">
                          {userEmail}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <DropdownMenuItem
                    variant="destructive"
                    nativeButton
                    render={
                      <button type="submit" className="w-full text-left" />
                    }
                  >
                    <LogOutIcon className="size-4" />
                    {t("auth.signOut")}
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        {children}
      </div>
    </SidebarProvider>
  );
}

function getAvatarFallback(name: string, email: string) {
  const source = name || email || "User";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getDashboardItems(
  roleKind: SessionRoleKind,
  t: Awaited<ReturnType<typeof getTranslations>>,
): DashboardSidebarItem[] {
  const root = `/dashboard/${roleKind}`;
  const overview = {
    key: "overview",
    title: roleTitles[roleKind],
    description: t("app.tagline"),
    href: root,
  } satisfies DashboardSidebarItem;

  const roleItems: Record<SessionRoleKind, DashboardSidebarItem[]> = {
    admin: [
      item("approvals", root, t),
      item("courses", root, t),
      item("students", root, t),
      item("templates", root, t),
      item("certificates", root, t),
      item("calendar", root, t),
    ],
    center: [
      item("approvals", root, t),
      item("students", root, t),
      item("revenue", root, t),
      item("calendar", root, t),
    ],
    master: [
      item("approvals", root, t),
      item("students", root, t),
      item("revenue", root, t),
      item("calendar", root, t),
    ],
    student: [
      item("myCertificates", root, t),
      item("requestCertificate", root, t),
    ],
  };

  return [overview, ...roleItems[roleKind]];
}

function item(
  key: DashboardSidebarItem["key"],
  root: string,
  t: Awaited<ReturnType<typeof getTranslations>>,
): DashboardSidebarItem {
  const paths: Partial<Record<DashboardSidebarItem["key"], string>> = {
    approvals: "approvals",
    calendar: "calendar",
    certificates: "certificates",
    courses: "courses",
    myCertificates: "certificates",
    requestCertificate: "request",
    revenue: "revenue",
    students: "students",
    templates: "templates",
  };

  return {
    key,
    title: t(`nav.${key}`),
    description: t(`nav.${key}Desc`),
    href: `${root}/${paths[key]}`,
  };
}
