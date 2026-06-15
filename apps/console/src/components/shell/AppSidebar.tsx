"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Bot,
  Phone,
  PhoneCall,
  PhoneOutgoing,
  BookOpen,
  Settings2,
  Wrench,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/src/components/ui/sidebar";
import { NavMain, type NavItem } from "@/src/components/shell/NavMain";
import { OrgSwitcher } from "@/src/components/shell/OrgSwitcher";
import { NavUser, type NavUserProps } from "@/src/components/shell/NavUser";

const primaryNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Agents", href: "/agents", icon: Bot },
  { title: "Phone numbers", href: "/numbers", icon: Phone },
  { title: "Outbound", href: "/outbound", icon: PhoneOutgoing },
  { title: "Call logs", href: "/calls", icon: PhoneCall },
  { title: "Knowledge base", href: "/kb", icon: BookOpen },
  { title: "Tools", href: "/tools", icon: Wrench },
];

const settingsNav: NavItem[] = [
  {
    title: "Settings",
    href: "/settings",
    icon: Settings2,
    items: [
      { title: "Profile", href: "/settings/profile" },
      { title: "Organization", href: "/settings/organization" },
      { title: "Billing", href: "/settings/billing" },
      { title: "API keys", href: "/settings/api-keys" },
      { title: "Roles", href: "/settings/roles" },
      { title: "Danger zone", href: "/settings/danger" },
    ],
  },
];

export function AppSidebar({
  activeOrgId,
  user,
  ...props
}: {
  activeOrgId: string;
  user: NavUserProps;
} & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/60 p-3.5">
        <OrgSwitcher activeOrgId={activeOrgId} />
      </SidebarHeader>
      <SidebarContent className="gap-1 py-2.5">
        <NavMain label="Platform" items={primaryNav} />
        <SidebarSeparator className="mx-5 bg-sidebar-border/50" />
        <NavMain label="Workspace" items={settingsNav} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/60 p-3.5">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
