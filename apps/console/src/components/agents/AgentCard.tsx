"use client";

import Link from "next/link";
import {
    BadgeCheck,
    BookOpen,
    Bot,
    FlaskConical,
    Pencil,
    Phone,
    PhoneCall,
    Trash2,
    Wrench,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { Switch } from "@/src/components/ui/switch";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { useUpdateAgent } from "@/src/hooks/queries/agents";
import type { Agent } from "@/src/lib/api/types";
import { cn } from "@/src/lib/utils";

const stats = [
    { label: "Numbers", key: "phoneNumbersCount",    icon: Phone },
    { label: "Calls",   key: "callLogsCount",        icon: PhoneCall },
    { label: "Docs",    key: "knowledgeSourcesCount", icon: BookOpen },
    { label: "Tools",   key: "toolsCount",            icon: Wrench },
] as const;

function shortAgentId(agent: Agent) {
    return agent.agentSlug || `${agent.agentId.slice(0, 8)}…`;
}

export function AgentCard({ agent }: { agent: Agent }) {
    const update = useUpdateAgent(agent.agentId);

    async function onActiveChange(isActive: boolean) {
        await update.mutateAsync({ isActive });
    }

    return (
        <article className="group flex flex-col gap-5 rounded-xl border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md">

            {/* ── header ── */}
            <header className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Bot className="size-4" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-foreground">
                            {agent.name}
                        </h3>
                        <p className="truncate text-[11px] text-muted-foreground">
                            {shortAgentId(agent)}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                    <Switch
                        checked={agent.isActive}
                        onCheckedChange={onActiveChange}
                        disabled={update.isPending}
                        aria-label={agent.isActive ? "Pause agent" : "Resume agent"}
                    />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className={cn(
                                "flex size-7 items-center justify-center rounded-md border",
                                agent.isConfigured
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                                    : "border-muted bg-muted/30 text-muted-foreground"
                            )}>
                                <BadgeCheck className="size-3.5" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            {agent.isConfigured ? "Configured" : "Not configured"}
                        </TooltipContent>
                    </Tooltip>
                    <Button variant="ghost" size="icon-sm" asChild aria-label="Edit agent">
                        <Link href={`/agents/${agent.agentId}`}>
                            <Pencil className="size-3.5" />
                        </Link>
                    </Button>
                </div>
            </header>

            {/* ── stats — 2×2 mini tiles ── */}
            <div className="grid grid-cols-2 gap-2">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.key} className="flex flex-col gap-1.5 rounded-lg bg-muted/30 px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                                <Icon className="size-3.5 text-primary/80" />
                                <span className="text-[11px] font-medium text-muted-foreground">
                                    {stat.label}
                                </span>
                            </div>
                            <p className="tabular-nums text-xl font-bold leading-none text-foreground">
                                {agent[stat.key]}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* ── footer actions ── */}
            <div className="space-y-3">
                <Separator />
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5" disabled>
                        <FlaskConical className="size-3.5" />
                        Test
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled
                    >
                        <Trash2 className="size-3.5" />
                        Delete
                    </Button>
                </div>
            </div>
        </article>
    );
}
