"use client";

import { useState } from "react";
import {
    AlertCircle,
    Check,
    Copy,
    Hash,
    Phone,
    RefreshCw,
    Route,
    Signal,
    X,
} from "lucide-react";

import { PageHeader } from "@/src/components/common/PageHeader";
import { EmptyState } from "@/src/components/common/EmptyState";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
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
import { BuyNumberDrawer } from "@/src/components/numbers/BuyNumberDrawer";
import { AssignAgentSelect } from "@/src/components/numbers/AssignAgentSelect";
import { useNumbers } from "@/src/hooks/queries/numbers";
import type { PhoneNumber } from "@/src/lib/api/types";
import { cn } from "@/src/lib/utils";

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDate(value: string) {
    return new Date(value).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

// ── provider chip ─────────────────────────────────────────────────────────────

const PROVIDER_META: Record<
    PhoneNumber["provider"],
    { label: string; cls: string }
> = {
    twilio:  { label: "TWILIO",  cls: "border-violet-500/20 bg-violet-500/10 text-violet-400" },
    telnyx:  { label: "TELNYX",  cls: "border-teal-500/20 bg-teal-500/10 text-teal-400" },
};

function ProviderChip({ provider }: { provider: PhoneNumber["provider"] }) {
    const meta = PROVIDER_META[provider] ?? { label: provider.toUpperCase(), cls: "border-muted bg-muted/30 text-muted-foreground" };
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
            meta.cls
        )}>
            <Signal className="size-3" />
            {meta.label}
        </span>
    );
}

// ── skeleton ──────────────────────────────────────────────────────────────────

function NumbersPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
            </div>
            <div className="overflow-hidden border bg-card">
                <div className="border-b p-4">
                    <Skeleton className="h-5 w-40" />
                </div>
                <div className="divide-y">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="grid gap-3 p-4 sm:grid-cols-5">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-5 w-20" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function NumbersPage() {
    const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
    const [bannerDismissed, setBannerDismissed] = useState(false);
    const { data: numbers, isLoading, isError, isFetching, refetch } = useNumbers();

    const assignedCount   = numbers?.filter((n) => n.agentId).length ?? 0;
    const unassignedCount = (numbers?.length ?? 0) - assignedCount;

    async function copyNumber(phoneNumber: string) {
        await navigator.clipboard.writeText(phoneNumber);
        setCopiedNumber(phoneNumber);
        setTimeout(() => setCopiedNumber(null), 2000);
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Phone numbers"
                description="Route owned numbers to agents and keep assignment coverage visible."
                actions={<BuyNumberDrawer />}
            />

            {isLoading ? (
                <NumbersPageSkeleton />
            ) : isError ? (
                <EmptyState
                    icon={Phone}
                    title="Could not load phone numbers"
                    description="Refresh the list or try again after checking your connection."
                    action={
                        <Button variant="outline" onClick={() => refetch()}>
                            <RefreshCw /> Retry
                        </Button>
                    }
                />
            ) : !numbers?.length ? (
                <EmptyState
                    icon={Phone}
                    title="No phone numbers yet"
                    description="Buy a number from your telephony provider to start routing calls."
                    action={<BuyNumberDrawer />}
                />
            ) : (
                <>
                    {/* ── stat cards ── */}
                    <div className="grid gap-3 sm:grid-cols-3">
                        {/* Total */}
                        <div className="rounded-lg border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-muted-foreground">Total numbers</p>
                                <Phone className="size-4 text-primary" />
                            </div>
                            <p className="mt-3 text-2xl font-semibold text-foreground">{numbers.length}</p>
                        </div>

                        {/* Assigned */}
                        <div className="rounded-lg border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-muted-foreground">Assigned</p>
                                <Route className="size-4 text-primary" />
                            </div>
                            <p className="mt-3 text-2xl font-semibold text-foreground">{assignedCount}</p>
                        </div>

                        {/* Needs routing — amber accent when > 0 */}
                        <div className={cn(
                            "rounded-lg border p-4 transition-all hover:shadow-sm",
                            unassignedCount > 0
                                ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
                                : "border bg-card hover:border-primary/30"
                        )}>
                            <div className="flex items-center justify-between gap-3">
                                <p className={cn(
                                    "text-sm font-medium",
                                    unassignedCount > 0 ? "text-amber-400" : "text-muted-foreground"
                                )}>
                                    Needs routing
                                </p>
                                <AlertCircle className={cn(
                                    "size-4",
                                    unassignedCount > 0 ? "text-amber-400" : "text-primary"
                                )} />
                            </div>
                            <p className={cn(
                                "mt-3 text-2xl font-semibold",
                                unassignedCount > 0 ? "text-amber-400" : "text-foreground"
                            )}>
                                {unassignedCount}
                            </p>
                        </div>
                    </div>

                    {/* ── routing warning banner ── */}
                    {unassignedCount > 0 && !bannerDismissed ? (
                        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
                            <AlertCircle className="size-4 shrink-0" />
                            <span className="flex-1">
                                {unassignedCount} number{unassignedCount > 1 ? "s" : ""} need
                                routing — assign an agent to start receiving calls.
                            </span>
                            <button
                                onClick={() => setBannerDismissed(true)}
                                aria-label="Dismiss"
                                className="shrink-0 rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    ) : null}

                    {/* ── routing table ── */}
                    <section className="overflow-hidden border bg-card">
                        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-foreground">Routing table</h2>
                                <p className="text-sm text-muted-foreground">
                                    Assign each inbound number to the agent that should answer it.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetch()}
                                disabled={isFetching}
                                className="w-full sm:w-auto"
                            >
                                <RefreshCw className={isFetching ? "animate-spin" : undefined} />
                                Refresh
                            </Button>
                        </div>

                        <div className="divide-y md:hidden">
                            {numbers.map((number) => (
                                <div key={number.phId} className="space-y-4 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/30 text-primary">
                                            <Phone className="size-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <p className="truncate font-mono text-sm font-semibold text-foreground">
                                                    {number.number}
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    aria-label={`Copy ${number.number}`}
                                                    onClick={() => copyNumber(number.number)}
                                                >
                                                    {copiedNumber === number.number ? (
                                                        <Check className="size-3.5 text-emerald-500" />
                                                    ) : (
                                                        <Copy className="size-3.5" />
                                                    )}
                                                </Button>
                                            </div>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {number.friendlyName || "No friendly name"}
                                            </p>
                                        </div>
                                        <ProviderChip provider={number.provider} />
                                    </div>
                                    <div>
                                        <p className="mb-2 text-xs font-medium text-muted-foreground">Routing</p>
                                        <AssignAgentSelect phId={number.phId} agentId={number.agentId} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                                        <div>
                                            <p>Created</p>
                                            <p className="mt-1 text-foreground">{formatDate(number.createdAt)}</p>
                                        </div>
                                        <div>
                                            <p>Modified</p>
                                            <p className="mt-1 text-foreground">{formatDate(number.updatedAt)}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p>SID</p>
                                            <p className="mt-1 truncate font-mono text-foreground">{number.sid}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="hidden overflow-x-auto md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                                        <TableHead>Number</TableHead>
                                        <TableHead>Provider</TableHead>
                                        <TableHead>Routing</TableHead>
                                        <TableHead>Timeline</TableHead>
                                        <TableHead className="text-right">SID</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {numbers.map((number) => (
                                        <TableRow
                                            key={number.phId}
                                            className="transition-colors hover:bg-muted/10"
                                        >
                                            {/* number + copy */}
                                            <TableCell className="min-w-[220px]">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/30 text-primary">
                                                        <Phone className="size-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex min-w-0 items-center gap-2">
                                                            <p className="truncate font-mono text-sm font-semibold text-foreground">
                                                                {number.number}
                                                            </p>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon-sm"
                                                                aria-label={`Copy ${number.number}`}
                                                                onClick={() => copyNumber(number.number)}
                                                            >
                                                                {copiedNumber === number.number ? (
                                                                    <Check className="size-3.5 text-emerald-500" />
                                                                ) : (
                                                                    <Copy className="size-3.5" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {number.friendlyName || "No friendly name"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* provider chip */}
                                            <TableCell>
                                                <ProviderChip provider={number.provider} />
                                            </TableCell>

                                            {/* routing select */}
                                            <TableCell className="min-w-[220px]">
                                                <AssignAgentSelect
                                                    phId={number.phId}
                                                    agentId={number.agentId}
                                                />
                                            </TableCell>

                                            {/* timeline */}
                                            <TableCell className="whitespace-nowrap">
                                                <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                                                    <span>Created {formatDate(number.createdAt)}</span>
                                                    <span className="text-muted-foreground/60">
                                                        Modified {formatDate(number.updatedAt)}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* SID with tooltip */}
                                            <TableCell className="text-right">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="inline-flex cursor-help items-center gap-1 font-mono text-xs text-muted-foreground">
                                                            <Hash className="size-3" />
                                                            {number.sid.slice(0, 10)}…
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="left" className="font-mono text-xs">
                                                        {number.sid}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
