"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon, ChevronRight } from "lucide-react";

import {
 Collapsible,
 CollapsibleContent,
 CollapsibleTrigger,
} from "@/src/components/ui/collapsible";
import {
 SidebarGroup,
 SidebarGroupLabel,
 SidebarMenu,
 SidebarMenuButton,
 SidebarMenuItem,
 SidebarMenuSub,
 SidebarMenuSubButton,
 SidebarMenuSubItem,
 useSidebar,
} from "@/src/components/ui/sidebar";

export interface NavItem {
 title: string;
 href: string;
 icon: LucideIcon;
 items?: { title: string; href: string }[];
}

export function NavMain({ label, items }: { label: string; items: NavItem[] }) {
 const pathname = usePathname();
 const { isMobile, setOpenMobile } = useSidebar();

 const closeMobileSidebar = () => {
 if (isMobile) setOpenMobile(false);
 };

 return (
 <SidebarGroup className="px-3 py-4">
 <SidebarGroupLabel className="mb-2 h-6 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
 {label}
 </SidebarGroupLabel>
 <SidebarMenu className="gap-1">
 {items.map((item) => {
 const isActive =
 pathname === item.href || pathname.startsWith(`${item.href}/`);

 if (!item.items?.length) {
 return (
 <SidebarMenuItem key={item.title}>
 <SidebarMenuButton
 asChild
 tooltip={item.title}
 isActive={isActive}
 className="relative h-11 !bg-transparent px-3 text-[15px] font-medium text-muted-foreground shadow-none transition-colors hover:!bg-sidebar-accent/60 hover:text-sidebar-foreground data-[active=true]:!bg-sidebar-accent/70 data-[active=true]:text-sidebar-foreground data-[active=true]:shadow-none before:absolute before:left-0 before:top-1/2 before:h-6 before:w-0.5 before:-translate-y-1/2 before:bg-transparent data-[active=true]:before:bg-primary [&_svg]:size-[18px] [&_svg]:text-muted-foreground data-[active=true]:[&_svg]:text-primary hover:[&_svg]:text-sidebar-foreground"
 >
 <Link href={item.href} onClick={closeMobileSidebar}>
 <item.icon />
 <span>{item.title}</span>
 </Link>
 </SidebarMenuButton>
 </SidebarMenuItem>
 );
 }

 return (
 <Collapsible
 key={item.title}
 asChild
 defaultOpen={isActive}
 className="group/collapsible"
 >
 <SidebarMenuItem>
 <CollapsibleTrigger asChild>
 <SidebarMenuButton
 tooltip={item.title}
 isActive={isActive}
 className="relative h-11 !bg-transparent px-3 text-[15px] font-medium text-muted-foreground shadow-none transition-colors hover:!bg-sidebar-accent/60 hover:text-sidebar-foreground data-[active=true]:!bg-sidebar-accent/70 data-[active=true]:text-sidebar-foreground data-[active=true]:shadow-none data-[state=open]:!bg-sidebar-accent/50 before:absolute before:left-0 before:top-1/2 before:h-6 before:w-0.5 before:-translate-y-1/2 before:bg-transparent data-[active=true]:before:bg-primary [&_svg]:size-[18px] [&_svg]:text-muted-foreground data-[active=true]:[&_svg]:text-primary hover:[&_svg]:text-sidebar-foreground"
 >
 <item.icon />
 <span>{item.title}</span>
 <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
 </SidebarMenuButton>
 </CollapsibleTrigger>
 <CollapsibleContent>
 <SidebarMenuSub className="ml-5 mt-1.5 gap-1 border-sidebar-border/50 py-1">
 {item.items.map((sub) => {
 const subActive = pathname === sub.href;
 return (
 <SidebarMenuSubItem key={sub.title}>
 <SidebarMenuSubButton
 asChild
 isActive={subActive}
 className="h-9 !bg-transparent px-3 text-sm text-muted-foreground transition-colors hover:!bg-sidebar-accent/60 hover:text-sidebar-foreground data-[active=true]:!bg-sidebar-accent/70 data-[active=true]:font-medium data-[active=true]:text-sidebar-foreground"
 >
 <Link href={sub.href} onClick={closeMobileSidebar}>
 <span>{sub.title}</span>
 </Link>
 </SidebarMenuSubButton>
 </SidebarMenuSubItem>
 );
 })}
 </SidebarMenuSub>
 </CollapsibleContent>
 </SidebarMenuItem>
 </Collapsible>
 );
 })}
 </SidebarMenu>
 </SidebarGroup>
 );
}
