"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ClipboardCheck,
  FileText,
  Home,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "~/components/ui/sidebar";
import type { SessionRoleKind } from "~/server/auth/config.edge";

export type DashboardSidebarItem = {
  key:
    | "approvals"
    | "calendar"
    | "certificates"
    | "courses"
    | "myCertificates"
    | "overview"
    | "requestCertificate"
    | "revenue"
    | "roles"
    | "students"
    | "templates"
    | "users";
  title: string;
  description: string;
  href: string;
};

const icons = {
  approvals: ClipboardCheck,
  calendar: CalendarDays,
  certificates: Award,
  courses: BookOpen,
  myCertificates: BadgeCheck,
  overview: Home,
  requestCertificate: Send,
  revenue: ChartNoAxesColumnIncreasing,
  roles: ShieldCheck,
  students: Users,
  templates: FileText,
  users: Users,
};

export function DashboardSidebar({
  items,
  roleKind,
  roleTitle,
}: {
  items: DashboardSidebarItem[];
  roleKind: SessionRoleKind;
  roleTitle: string;
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-12"
              render={<Link href={`/dashboard/${roleKind}`} />}
              size="lg"
              tooltip={roleTitle}
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 items-center justify-center rounded-xl">
                <Sparkles className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Global K-Beauty</span>
                <span className="text-sidebar-foreground/70 truncate text-xs">
                  {roleTitle}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = icons[item.key];
                const isActive =
                  item.key === "overview"
                    ? pathname === item.href
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link href={item.href} />}
                      tooltip={item.title}
                    >
                      <Icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
