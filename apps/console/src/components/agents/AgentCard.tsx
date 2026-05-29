"use client";

import Link from "next/link";
import {
    BadgeCheck,
    BookOpen,
    Pencil,
    Phone,
    PhoneCall,
    Wrench,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Switch } from "@/src/components/ui/switch";
import { useUpdateAgent } from "@/src/hooks/queries/agents";
import type { Agent } from "@/src/lib/api/types";
import { cn } from "@/src/lib/utils";

const stats = [
    { label: "Numbers", key: "phoneNumbersCount", icon: Phone },
    { label: "Calls", key: "callLogsCount", icon: PhoneCall },
    { label: "Documents", key: "knowledgeSourcesCount", icon: BookOpen },
    { label: "Tools", key: "toolsCount", icon: Wrench },
] as const;

function shortAgentId(agent: Agent) {
    return agent.agentSlug || `${agent.agentId.slice(0, 8)}...`;
}

export function AgentCard({ agent }: { agent: Agent }) {
    const update = useUpdateAgent(agent.agentId);

    async function onActiveChange(isActive: boolean) {
        await update.mutateAsync({ isActive });
    }

    return (
        <article className="group flex min-h-72 flex-col gap-6 border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md">
            <header className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                    <h3 className="truncate text-lg font-semibold text-foreground">
                        {agent.name}
                    </h3>
                    <p className="truncate text-xs font-medium text-muted-foreground">
                        {shortAgentId(agent)}
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <Switch
                        checked={agent.isActive}
                        onCheckedChange={onActiveChange}
                        disabled={update.isPending}
                        aria-label={agent.isActive ? "Pause agent" : "Resume agent"}
                    />
                    <div
                        className={cn(
                            "flex size-8 items-center justify-center border",
                            agent.isConfigured
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                                : "border-muted bg-muted/30 text-muted-foreground"
                        )}
                        title={agent.isConfigured ? "Configured" : "Not configured"}
                    >
                        <BadgeCheck className="size-4" />
                    </div>
                    <Button variant="ghost" size="icon" asChild aria-label="Edit agent">
                        <Link href={`/agents/${agent.agentId}`}>
                            <Pencil className="size-4" />
                        </Link>
                    </Button>
                </div>
            </header>

            <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-8">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.key} className="flex items-center gap-4">
                            <div className="flex size-11 shrink-0 items-center justify-center border bg-muted/30 text-primary">
                                <Icon className="size-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-muted-foreground">
                                    {stat.label}
                                </p>
                                <p className="text-xl font-semibold leading-none text-foreground">
                                    {agent[stat.key]}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

        </article>
    );
}
