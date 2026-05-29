"use client";

import { useState } from "react";
import {
    Bot,
    Check,
    Copy,
    Hash,
    Phone,
    RefreshCw,
    Route,
    ShieldCheck,
} from "lucide-react";

import { PageHeader } from "@/src/components/common/PageHeader";
import { EmptyState } from "@/src/components/common/EmptyState";
import { Badge } from "@/src/components/ui/badge";
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
import { BuyNumberDrawer } from "@/src/components/numbers/BuyNumberDrawer";
import { AssignAgentSelect } from "@/src/components/numbers/AssignAgentSelect";
import { useNumbers } from "@/src/hooks/queries/numbers";
import type { PhoneNumber } from "@/src/lib/api/types";

function formatDate(value: string) {
    return new Date(value).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function providerLabel(provider: PhoneNumber["provider"]) {
    return provider.toUpperCase();
}

function NumbersPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
                {[...Array(3)].map((_, index) => (
                    <Skeleton key={index} className="h-24 w-full" />
                ))}
            </div>
            <div className="overflow-hidden border bg-card">
                <div className="border-b p-4">
                    <Skeleton className="h-5 w-40" />
                </div>
                <div className="divide-y">
                    {[...Array(6)].map((_, index) => (
                        <div key={index} className="grid gap-3 p-4 sm:grid-cols-5">
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

export default function NumbersPage() {
    const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
    const {
        data: numbers,
        isLoading,
        isError,
        isFetching,
        refetch,
    } = useNumbers();

    const assignedCount = numbers?.filter((number) => number.agentId).length ?? 0;
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
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="border bg-card p-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Total numbers
                                </p>
                                <Phone className="size-4 text-primary" />
                            </div>
                            <p className="mt-3 text-2xl font-semibold text-foreground">
                                {numbers.length}
                            </p>
                        </div>
                        <div className="border bg-card p-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Assigned
                                </p>
                                <Route className="size-4 text-primary" />
                            </div>
                            <p className="mt-3 text-2xl font-semibold text-foreground">
                                {assignedCount}
                            </p>
                        </div>
                        <div className="border bg-card p-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Needs routing
                                </p>
                                <Bot className="size-4 text-primary" />
                            </div>
                            <p className="mt-3 text-2xl font-semibold text-foreground">
                                {unassignedCount}
                            </p>
                        </div>
                    </div>

                    <section className="overflow-hidden border bg-card">
                        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-foreground">
                                    Routing table
                                </h2>
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
                                <RefreshCw
                                    className={isFetching ? "animate-spin" : undefined}
                                />
                                Refresh
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Number</TableHead>
                                        <TableHead>Provider</TableHead>
                                        <TableHead>Routing</TableHead>
                                        <TableHead>Timeline</TableHead>
                                        <TableHead className="text-right">SID</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {numbers.map((number) => (
                                        <TableRow key={number.phId}>
                                            <TableCell className="min-w-[220px]">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-9 shrink-0 items-center justify-center border bg-muted/30 text-primary">
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
                                                                size="icon-xs"
                                                                aria-label={`Copy ${number.number}`}
                                                                onClick={() => copyNumber(number.number)}
                                                            >
                                                                {copiedNumber === number.number ? (
                                                                    <Check className="size-3 text-emerald-600" />
                                                                ) : (
                                                                    <Copy className="size-3" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {number.friendlyName || "No friendly name"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className="gap-1 uppercase tracking-wide"
                                                >
                                                    <ShieldCheck className="size-3" />
                                                    {providerLabel(number.provider)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="min-w-[220px]">
                                                <AssignAgentSelect
                                                    phId={number.phId}
                                                    agentId={number.agentId}
                                                />
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-sm">
                                                <div className="space-y-0.5">
                                                    <p className="text-foreground">
                                                        Created {formatDate(number.createdAt)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Modified {formatDate(number.updatedAt)}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span
                                                    title={number.sid}
                                                    className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground"
                                                >
                                                    <Hash className="size-3" />
                                                    {number.sid.slice(0, 12)}
                                                </span>
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
