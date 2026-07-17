"use client";

import { useId } from "react";
import Link from "next/link";
import { ArrowRight, PhoneCall } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { EmptyState } from "@/src/components/common/EmptyState";
import { dashboardCallsHref } from "@/src/components/dashboard/call-filter-links";
import type {
  DashboardRange,
  DashboardSummary,
} from "@/src/lib/api/resources/dashboard";

const directionStyles = {
  inbound: {
    label: "Inbound",
    color: "#0284C7",
    accentClass: "bg-sky-500",
    textClass: "text-sky-600 dark:text-sky-300",
    surfaceClass: "border-sky-500/25 bg-sky-500/10",
  },
  outbound: {
    label: "Outbound",
    color: "#F59E0B",
    accentClass: "bg-amber-500",
    textClass: "text-amber-600 dark:text-amber-300",
    surfaceClass: "border-amber-500/25 bg-amber-500/10",
  },
  unknown: {
    label: "Unknown",
    color: "#64748B",
    accentClass: "bg-slate-500",
    textClass: "text-slate-600 dark:text-slate-300",
    surfaceClass: "border-slate-500/25 bg-slate-500/10",
  },
};

const statusStyles: Record<
  string,
  {
    label: string;
    color: string;
    accentClass: string;
    textClass: string;
    surfaceClass: string;
  }
> = {
  COMPLETED: {
    label: "Completed",
    color: "#10B981",
    accentClass: "bg-emerald-500",
    textClass: "text-emerald-600 dark:text-emerald-300",
    surfaceClass: "border-emerald-500/25 bg-emerald-500/10",
  },
  FAILED: {
    label: "Failed",
    color: "#F43F5E",
    accentClass: "bg-rose-500",
    textClass: "text-rose-600 dark:text-rose-300",
    surfaceClass: "border-rose-500/25 bg-rose-500/10",
  },
  NOT_ANSWERED: {
    label: "Missed",
    color: "#F59E0B",
    accentClass: "bg-amber-500",
    textClass: "text-amber-600 dark:text-amber-300",
    surfaceClass: "border-amber-500/25 bg-amber-500/10",
  },
  IN_PROGRESS: {
    label: "In progress",
    color: "#3B82F6",
    accentClass: "bg-blue-500",
    textClass: "text-blue-600 dark:text-blue-300",
    surfaceClass: "border-blue-500/25 bg-blue-500/10",
  },
  SCHEDULED: {
    label: "Scheduled",
    color: "#8B5CF6",
    accentClass: "bg-violet-500",
    textClass: "text-violet-600 dark:text-violet-300",
    surfaceClass: "border-violet-500/25 bg-violet-500/10",
  },
  PROCESSED: {
    label: "Processed",
    color: "#06B6D4",
    accentClass: "bg-cyan-500",
    textClass: "text-cyan-600 dark:text-cyan-300",
    surfaceClass: "border-cyan-500/25 bg-cyan-500/10",
  },
};

const statusPattern: Record<string, string> = {
  COMPLETED: "solid bar",
  FAILED: "dashed bar",
  NOT_ANSWERED: "dotted bar",
  IN_PROGRESS: "striped bar",
  SCHEDULED: "outlined bar",
  PROCESSED: "double-line bar",
};

const directionPattern = {
  inbound: "filled segment",
  outbound: "outlined segment",
  unknown: "dashed segment",
};

function labelStatus(status: string) {
  return statusStyles[status]?.label ?? status.toLowerCase().replace("_", " ");
}

function percent(count: number, total: number) {
  return total ? Math.round((count / total) * 100) : 0;
}

export function BreakdownCharts({
  summary,
  range,
  loading,
  customFrom,
  customTo,
}: {
  summary?: DashboardSummary;
  range: DashboardRange;
  loading?: boolean;
  customFrom?: string;
  customTo?: string;
}) {
  const statusTitleId = useId();
  const statusSummaryId = useId();
  const directionTitleId = useId();
  const directionSummaryId = useId();

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const statusData = summary?.statusBreakdown.filter((item) => item.count > 0) ?? [];
  const directionData =
    summary?.directionBreakdown.filter((item) => item.count > 0) ?? [];
  const totalStatus = statusData.reduce((sum, item) => sum + item.count, 0);
  const inbound =
    directionData.find((item) => item.direction === "inbound")?.count ?? 0;
  const outbound =
    directionData.find((item) => item.direction === "outbound")?.count ?? 0;
  const directionTotal = directionData.reduce((sum, item) => sum + item.count, 0);
  const inboundPct = directionTotal
    ? Math.round((inbound / directionTotal) * 100)
    : 0;
  const outboundPct = directionTotal
    ? Math.round((outbound / directionTotal) * 100)
    : 0;
  const completedCalls =
    statusData.find((item) => item.status === "COMPLETED")?.count ?? 0;
  const completionPct = percent(completedCalls, totalStatus);
  const statusChartData = statusData.map((item) => ({
    ...item,
    label: labelStatus(item.status),
    pattern: statusPattern[item.status] ?? "solid bar",
    percentage: percent(item.count, totalStatus),
    style: statusStyles[item.status] ?? statusStyles.PROCESSED,
  }));
  const directionChartData = directionData.map((item) => ({
    ...item,
    label: directionStyles[item.direction].label,
    pattern: directionPattern[item.direction],
    percentage: percent(item.count, directionTotal),
    style: directionStyles[item.direction],
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div
        className="overflow-hidden rounded-xl border bg-card shadow-sm ring-1 ring-border/50"
        aria-labelledby={statusTitleId}
      >
        <div className="flex flex-col gap-4 border-b bg-[linear-gradient(135deg,hsl(var(--primary)/0.08),hsl(var(--background)),hsl(var(--muted)/0.55))] p-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">
              Outcomes
            </p>
            <h3
              id={statusTitleId}
              className="mt-1 text-base font-semibold text-foreground"
            >
              Call outcomes
            </h3>
            <p id={statusSummaryId} className="text-xs text-muted-foreground">
              Status distribution for the selected range by count and share of
              calls.
            </p>
          </div>
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border bg-background/80 text-center text-xs shadow-sm backdrop-blur sm:min-w-56">
            <div className="border-r border-border/70 px-3 py-2.5">
              <p className="font-semibold text-foreground tabular-nums">
                {totalStatus}
              </p>
              <p className="text-muted-foreground">tracked</p>
            </div>
            <div className="px-3 py-2.5">
              <p className="font-semibold text-emerald-600 tabular-nums dark:text-emerald-300">
                {completionPct}%
              </p>
              <p className="text-muted-foreground">completed</p>
            </div>
          </div>
        </div>
        {statusData.length ? (
          <div
            className="space-y-5 p-5"
            role="group"
            aria-label="Call outcome status breakdown chart"
            aria-describedby={statusSummaryId}
          >
            <div className="rounded-xl border bg-background/60 p-4">
              <div className="mb-3 flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-muted-foreground">
                  Outcome share
                </span>
                <span className="font-semibold text-foreground tabular-nums">
                  {totalStatus} total
                </span>
              </div>
              <div className="flex h-4 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                {statusChartData.map((item) => (
                  <div
                    key={item.status}
                    className="h-full transition-all duration-500 motion-safe:animate-in motion-safe:fade-in-0"
                    style={{
                      width: `${item.percentage}%`,
                      background: item.style.color,
                    }}
                    title={`${item.label}: ${item.percentage}%`}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {statusChartData.map((item, index) => (
                <Link
                  key={item.status}
                  href={dashboardCallsHref({ range, status: item.status, from: customFrom, to: customTo })}
                  className={`group rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 ${item.style.surfaceClass}`}
                  style={{ animationDelay: `${index * 60}ms` }}
                  aria-label={`Review ${labelStatus(item.status)} calls in the selected dashboard range`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className={`size-2.5 shrink-0 rounded-full ${item.style.accentClass}`}
                        />
                        <span className="truncate text-sm font-semibold text-foreground">
                          {item.label}
                        </span>
                      </div>
                      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                        {item.count}
                      </p>
                    </div>
                    <span className={`rounded-full bg-background/70 px-2.5 py-1 text-xs font-semibold shadow-xs ${item.style.textClass}`}>
                      {item.percentage}%
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-background/70">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.style.accentClass}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">
                      {item.pattern}
                    </span>
                    <span className={`inline-flex items-center gap-1 font-medium ${item.style.textClass}`}>
                      Review
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="sr-only">
              <table aria-describedby={statusSummaryId}>
                <caption>Call outcome status breakdown data table</caption>
                <thead>
                  <tr>
                    <th scope="col">Status</th>
                    <th scope="col">Calls</th>
                    <th scope="col">Percentage of calls</th>
                    <th scope="col">Legend pattern</th>
                  </tr>
                </thead>
                <tbody>
                  {statusChartData.map((item) => (
                    <tr key={item.status}>
                      <th scope="row">{item.label}</th>
                      <td>{item.count}</td>
                      <td>{item.percentage}%</td>
                      <td>{item.pattern}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={PhoneCall}
            title="No outcomes yet"
            description="Place a test call to confirm completion, failed, and missed call states are flowing into reporting."
            className="m-5 h-64 bg-background/40"
            action={
              <Button asChild size="sm">
                <Link href="/outbound">Place a test call</Link>
              </Button>
            }
          />
        )}
      </div>
      <div
        className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm ring-1 ring-border/50"
        aria-labelledby={directionTitleId}
      >
        <div className="flex min-w-0 flex-col gap-4 border-b bg-[linear-gradient(135deg,hsl(var(--primary)/0.08),hsl(var(--background)),hsl(var(--muted)/0.55))] p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">
              Routing
            </p>
            <h3
              id={directionTitleId}
              className="mt-1 text-base font-semibold text-foreground"
            >
              Direction mix
            </h3>
            <p id={directionSummaryId} className="text-xs text-muted-foreground">
              Inbound and outbound call composition by count and share of
              routed calls.
            </p>
          </div>
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border bg-background/80 text-center text-xs shadow-sm backdrop-blur sm:min-w-56">
            <div className="border-r border-border/70 px-3 py-2.5">
              <p className="font-semibold tabular-nums text-sky-600 dark:text-sky-300">
                {inboundPct}%
              </p>
              <p className="text-muted-foreground">inbound</p>
            </div>
            <div className="px-3 py-2.5">
              <p className="font-semibold tabular-nums text-amber-600 dark:text-amber-300">
                {outboundPct}%
              </p>
              <p className="text-muted-foreground">outbound</p>
            </div>
          </div>
        </div>
        {directionData.length ? (
          <div
            className="space-y-5 p-5"
            role="group"
            aria-label="Inbound and outbound direction mix chart"
            aria-describedby={directionSummaryId}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-sky-500/25 bg-sky-500/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Inbound calls
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-sky-600 tabular-nums dark:text-sky-300">
                      {inbound}
                    </p>
                  </div>
                  <span className="rounded-full bg-background/70 px-2.5 py-1 text-xs font-semibold text-sky-600 shadow-xs dark:text-sky-300">
                    {inboundPct}%
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-background/70">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${inboundPct}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Outbound calls
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-amber-600 tabular-nums dark:text-amber-300">
                      {outbound}
                    </p>
                  </div>
                  <span className="rounded-full bg-background/70 px-2.5 py-1 text-xs font-semibold text-amber-600 shadow-xs dark:text-amber-300">
                    {outboundPct}%
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-background/70">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${outboundPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-background/60 p-4">
              <div className="mb-3 flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-muted-foreground">
                  Routed call share
                </span>
                <span className="font-semibold text-foreground tabular-nums">
                  {directionTotal} total
                </span>
              </div>
              <div className="flex h-4 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                {directionChartData.map((item) => (
                  <div
                    key={item.direction}
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${item.percentage}%`,
                      background: item.style.color,
                    }}
                    title={`${item.label}: ${item.percentage}%`}
                  />
                ))}
              </div>
              <div className="mt-4 grid gap-2">
                {directionChartData.map((item) => (
                  <div
                    key={item.direction}
                    className={`rounded-lg border p-3 ${item.style.surfaceClass}`}
                  >
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          aria-hidden
                          className={`size-2.5 shrink-0 rounded-full ${item.style.accentClass}`}
                        />
                        <span className="truncate text-sm font-medium text-foreground">
                          {item.label}
                        </span>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-foreground tabular-nums">
                          {item.count}
                        </p>
                        <p className={`text-xs font-medium ${item.style.textClass}`}>
                          {item.percentage}%
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      Percentage of routed calls, {item.pattern}.
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="sr-only">
              <table aria-describedby={directionSummaryId}>
                <caption>Inbound and outbound direction mix data table</caption>
                <thead>
                  <tr>
                    <th scope="col">Direction</th>
                    <th scope="col">Calls</th>
                    <th scope="col">Percentage of routed calls</th>
                    <th scope="col">Legend pattern</th>
                  </tr>
                </thead>
                <tbody>
                  {directionChartData.map((item) => (
                    <tr key={item.direction}>
                      <th scope="row">{item.label}</th>
                      <td>{item.count}</td>
                      <td>{item.percentage}%</td>
                      <td>{item.pattern}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={ArrowRight}
            title="No routing data yet"
            description="Connect a number or place a test call to see inbound and outbound routing mix."
            className="m-5 h-64 bg-background/40"
            action={
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild size="sm">
                  <Link href="/numbers">Connect a number</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/outbound">Place a test call</Link>
                </Button>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
