"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowUpDown,
    BadgeCheck,
    Bot,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    FlaskConical,
    MoreHorizontal,
    Pencil,
    Trash2,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Switch } from "@/src/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/src/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { useUpdateAgent } from "@/src/hooks/queries/agents";
import type { Agent } from "@/src/lib/api/types";
import { cn } from "@/src/lib/utils";

const PAGE_SIZE = 10;

// ── configured chip ───────────────────────────────────────────────────────────

function ConfiguredChip({ configured }: { configured: boolean }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className={cn(
                    "inline-flex cursor-default items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium",
                    configured
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-muted bg-muted/30 text-muted-foreground"
                )}>
                    <BadgeCheck className="size-3" />
                    {configured ? "Configured" : "Not set"}
                </span>
            </TooltipTrigger>
            <TooltipContent>
                {configured ? "Agent has a saved configuration" : "Open the agent to configure voice, prompts, and tools"}
            </TooltipContent>
        </Tooltip>
    );
}

// ── status switch row ─────────────────────────────────────────────────────────

function StatusCell({ agent }: { agent: Agent }) {
    const update = useUpdateAgent(agent.agentId);
    return (
        <Switch
            checked={agent.isActive}
            onCheckedChange={(v) => update.mutate({ isActive: v })}
            disabled={update.isPending}
            aria-label={agent.isActive ? "Pause agent" : "Resume agent"}
        />
    );
}

// ── sortable head ─────────────────────────────────────────────────────────────

function SortHead({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <TableHead className={cn("whitespace-nowrap", className)}>
            <span className="inline-flex items-center gap-1.5">
                {children}
                <ArrowUpDown className="size-3 text-muted-foreground/50" />
            </span>
        </TableHead>
    );
}

// ── main component ────────────────────────────────────────────────────────────

interface Props {
    agents: Agent[];
    isLoading: boolean;
}

export function AgentsTable({ agents, isLoading }: Props) {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const totalPages = Math.max(1, Math.ceil(agents.length / PAGE_SIZE));
    const slice = agents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const allSelected = slice.length > 0 && slice.every((a) => selected.has(a.agentId));
    const toggleAll = () =>
        setSelected(allSelected ? new Set() : new Set(slice.map((a) => a.agentId)));
    const toggleOne = (id: string) =>
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* ── table ── */}
            <div className="overflow-hidden border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                            <TableHead className="w-12 pl-4">
                                <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                            </TableHead>
                            <SortHead>Agent</SortHead>
                            <TableHead className="w-24">Status</TableHead>
                            <TableHead className="w-32">Configured</TableHead>
                            <SortHead className="w-24 text-right">Numbers</SortHead>
                            <SortHead className="w-24 text-right">Calls</SortHead>
                            <SortHead className="w-24 text-right">Docs</SortHead>
                            <SortHead className="w-24 text-right">Tools</SortHead>
                            <TableHead className="w-14 pr-4 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {slice.map((agent) => (
                            <TableRow
                                key={agent.agentId}
                                onClick={() => router.push(`/agents/${agent.agentId}`)}
                                className={cn(
                                    "cursor-pointer border-b transition-colors hover:bg-muted/10",
                                    selected.has(agent.agentId) && "bg-primary/5"
                                )}
                            >
                                {/* checkbox — stop propagation so clicking it doesn't navigate */}
                                <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selected.has(agent.agentId)}
                                        onCheckedChange={() => toggleOne(agent.agentId)}
                                        aria-label="Select row"
                                    />
                                </TableCell>

                                {/* agent name + slug */}
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                                            <Bot className="size-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="max-w-[200px] truncate text-sm font-medium text-foreground">
                                                {agent.name}
                                            </p>
                                            <p className="max-w-[200px] truncate text-xs text-muted-foreground">
                                                {agent.agentSlug}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>

                                {/* active toggle — stop propagation so the toggle doesn't also navigate */}
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <StatusCell agent={agent} />
                                </TableCell>

                                {/* configured */}
                                <TableCell>
                                    <ConfiguredChip configured={agent.isConfigured} />
                                </TableCell>

                                {/* stats */}
                                <TableCell className="text-right tabular-nums text-sm">{agent.phoneNumbersCount}</TableCell>
                                <TableCell className="text-right tabular-nums text-sm">{agent.callLogsCount}</TableCell>
                                <TableCell className="text-right tabular-nums text-sm">{agent.knowledgeSourcesCount}</TableCell>
                                <TableCell className="text-right tabular-nums text-sm">{agent.toolsCount}</TableCell>

                                {/* actions — stop propagation so the menu doesn't also navigate */}
                                <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="size-8" aria-label="Row actions">
                                                <MoreHorizontal className="size-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/agents/${agent.agentId}`} className="flex items-center gap-2">
                                                    <Pencil className="size-4" /> Edit
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem disabled>
                                                <FlaskConical className="size-4" /> Test
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem disabled className="text-destructive focus:text-destructive">
                                                <Trash2 className="size-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* ── pagination bar ── */}
            <div className="flex items-center justify-between gap-2 px-1 text-sm text-muted-foreground">
                <span className="shrink-0">
                    {selected.size} of {agents.length} row(s) selected.
                </span>
                <div className="flex items-center gap-4">
                    <span className="whitespace-nowrap font-medium text-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex items-center gap-0.5">
                        <Button variant="outline" size="icon" className="size-8" onClick={() => setPage(1)} disabled={page <= 1} aria-label="First page">
                            <ChevronsLeft className="size-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="size-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} aria-label="Previous page">
                            <ChevronLeft className="size-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="size-8" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} aria-label="Next page">
                            <ChevronRight className="size-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="size-8" onClick={() => setPage(totalPages)} disabled={page >= totalPages} aria-label="Last page">
                            <ChevronsRight className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
