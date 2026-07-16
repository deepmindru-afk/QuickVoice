"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  PhoneCall,
  ShieldAlert,
  Timer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  ErrorState,
  OfflineState,
  PermissionState,
} from "@/src/components/common/EmptyState";
import { PageHeader } from "@/src/components/common/PageHeader";
import { RetryButton } from "@/src/components/common/RetryButton";
import { RangeSwitcher } from "@/src/components/dashboard/RangeSwitcher";
import { KpiCards } from "@/src/components/dashboard/KpiCards";
import { VolumeChart } from "@/src/components/dashboard/VolumeChart";
import { BreakdownCharts } from "@/src/components/dashboard/BreakdownCharts";
import { RecentCallsTable } from "@/src/components/dashboard/RecentCallsTable";
import { AgentActivityList } from "@/src/components/dashboard/AgentActivityList";
import { DashboardFreshness } from "@/src/components/dashboard/DashboardFreshness";
import { useDashboardSummary } from "@/src/hooks/queries/dashboard";
import type {
  DashboardRange,
  DashboardSummary,
} from "@/src/lib/api/resources/dashboard";
import {
  apiErrorStatus,
  getApiErrorStateCopy,
} from "@/src/lib/api-error-state";

const MISSING_SECTION_FORMAT = new Intl.ListFormat("en-US", {
  style: "long",
  type: "conjunction",
});

function resolveRange(param: string | null): DashboardRange {
  if (param === "24h" || param === "7d" || param === "30d") return param;
  return "7d";
}

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    function syncOnlineState() {
      setIsOnline(navigator.onLine);
    }

    syncOnlineState();
    window.addEventListener("online", syncOnlineState);
    window.addEventListener("offline", syncOnlineState);

    return () => {
      window.removeEventListener("online", syncOnlineState);
      window.removeEventListener("offline", syncOnlineState);
    };
  }, []);

  return isOnline;
}

function collectionSize(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

const RANGE_LABELS: Record<DashboardRange, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

function formatDashboardDuration(seconds: number) {
  const wholeSeconds = Math.max(0, Math.round(seconds));
  if (!wholeSeconds) return "0s";
  const minutes = Math.floor(wholeSeconds / 60);
  const remainingSeconds = wholeSeconds % 60;
  if (!minutes) return `${remainingSeconds}s`;
  if (!remainingSeconds) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatCompactNumber(value: number) {
  return value.toLocaleString("en-US");
}

function DashboardSignal({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const toneClass = {
    neutral: "border-border bg-muted/30 text-foreground",
    success:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning:
      "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    danger: "border-destructive/25 bg-destructive/10 text-destructive",
    info: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  }[tone];

  return (
    <div className="group relative overflow-hidden border bg-background p-4 transition-colors hover:border-primary/35">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-foreground">
            {value}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {detail}
          </p>
        </div>
        <span
          className={`flex size-9 shrink-0 items-center justify-center border ${toneClass}`}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
      />
    </div>
  );
}

function DashboardCommandCenter({
  summary,
  range,
  loading,
  successPct,
  exceptionCalls,
}: {
  summary?: DashboardSummary;
  range: DashboardRange;
  loading?: boolean;
  successPct: number;
  exceptionCalls: number;
}) {
  const totals = summary?.totals;
  const calls = totals?.calls ?? 0;
  const minutes = totals?.minutes ?? 0;
  const activeAgents = summary?.topAgents.length ?? 0;
  const avgDuration = formatDashboardDuration(totals?.avgDurationSeconds ?? 0);
  const hasCalls = calls > 0;

  return (
    <section className="overflow-hidden border bg-card shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative p-5 sm:p-6">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,hsl(var(--primary)),#10b981,#f59e0b,#ef4444)]"
          />
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Activity className="size-3.5" />
                {RANGE_LABELS[range]} operations
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {loading
                  ? "Loading call performance"
                  : hasCalls
                    ? `${formatCompactNumber(
                        calls
                      )} calls with ${successPct}% success`
                    : "No call activity in this range yet"}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Monitor demand, completion quality, agent load, and exceptions
                from one dashboard.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
              <Button asChild className="justify-between gap-3">
                <Link href="/outbound">
                  Start outbound call <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="justify-between gap-3 bg-background"
              >
                <Link href="/calls">
                  Review call logs <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardSignal
              label="Calls"
              value={formatCompactNumber(calls)}
              detail="All inbound and outbound records"
              icon={PhoneCall}
              tone="info"
            />
            <DashboardSignal
              label="Success"
              value={`${successPct}%`}
              detail="Completed calls out of total"
              icon={CheckCircle2}
              tone="success"
            />
            <DashboardSignal
              label="Exceptions"
              value={formatCompactNumber(exceptionCalls)}
              detail="Failed and missed calls to inspect"
              icon={ShieldAlert}
              tone={exceptionCalls ? "danger" : "neutral"}
            />
            <DashboardSignal
              label="Avg duration"
              value={avgDuration}
              detail="Average connected call length"
              icon={Timer}
              tone="warning"
            />
          </div>
        </div>

        <aside className="border-t bg-muted/20 p-5 lg:border-l lg:border-t-0 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Routing capacity
          </p>
          <div className="mt-4 grid gap-3">
            <div className="flex items-center justify-between border bg-background px-4 py-3">
              <span className="text-sm text-muted-foreground">
                Minutes used
              </span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatCompactNumber(minutes)}
              </span>
            </div>
            <div className="flex items-center justify-between border bg-background px-4 py-3">
              <span className="text-sm text-muted-foreground">
                Active agents
              </span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatCompactNumber(activeAgents)}
              </span>
            </div>
            <div className="flex items-center justify-between border bg-background px-4 py-3">
              <span className="text-sm text-muted-foreground">
                Missed calls
              </span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatCompactNumber(totals?.missedCalls ?? 0)}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 border border-border bg-background px-3 py-3 text-xs text-muted-foreground">
            <Clock3 className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Use the range control to compare short-term spikes against longer
              campaign trends.
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}

function isPermissionError(error: unknown) {
  const status = apiErrorStatus(error);
  return status === 401 || status === 403;
}

function getMissingDashboardSections(summary?: DashboardSummary) {
  if (!summary || (summary.totals?.calls ?? 0) === 0) return [];

  const missingSections: string[] = [];
  if (collectionSize(summary.series) === 0) {
    missingSections.push("traffic timeline");
  }
  if (collectionSize(summary.statusBreakdown) === 0) {
    missingSections.push("outcome breakdown");
  }
  if (collectionSize(summary.directionBreakdown) === 0) {
    missingSections.push("routing mix");
  }
  if (collectionSize(summary.topAgents) === 0) {
    missingSections.push("agent activity");
  }
  if (collectionSize(summary.recent) === 0) {
    missingSections.push("recent calls");
  }
  return missingSections;
}

function DashboardPartialDataNotice({ sections }: { sections: string[] }) {
  if (!sections.length) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col gap-3 border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">Partial dashboard data</p>
          <p className="mt-1">
            The summary loaded, but {MISSING_SECTION_FORMAT.format(sections)}{" "}
            {sections.length === 1 ? "is" : "are"} not available yet. Refresh or
            review call logs while the remaining data catches up.
          </p>
        </div>
      </div>
      <Button asChild variant="outline" size="sm" className="shrink-0 bg-card">
        <Link href="/calls">Review call logs</Link>
      </Button>
    </div>
  );
}

export default function DashboardPage() {
  const params = useSearchParams();
  const range = resolveRange(params.get("range"));
  const isOnline = useOnlineStatus();
  const {
    data,
    dataUpdatedAt,
    error,
    isLoading,
    isError,
    isFetching,
    isStale,
    refetch,
  } = useDashboardSummary(range);
  const successPct = Math.round((data?.totals.successRate ?? 0) * 100);
  const exceptionCalls =
    (data?.totals.failedCalls ?? 0) + (data?.totals.missedCalls ?? 0);
  const showBlockingError = isError && !data;
  const dashboardHasPermissionError =
    showBlockingError && isPermissionError(error);
  const dashboardErrorState = showBlockingError
    ? getApiErrorStateCopy(error, {
        resourceName: "dashboard",
        isOnline,
        overrides: {
          forbidden: {
            title: "Dashboard access required",
            description:
              "You need dashboard and call reporting permission to view this operations summary. Ask a workspace owner to update your role.",
          },
        },
      })
    : null;
  const missingDashboardSections = getMissingDashboardSections(data);
  const dashboardRetryAction = (
    <RetryButton
      onClick={() => refetch()}
      isRetrying={isFetching}
      disabled={dashboardErrorState?.kind === "offline" && !isOnline}
    >
      Retry
    </RetryButton>
  );
  const dashboardErrorAction =
    dashboardErrorState?.reason === "forbidden" ? (
      <Button asChild variant="outline">
        <Link href="/settings/roles">Review role settings</Link>
      </Button>
    ) : dashboardErrorState?.reason === "unauthorized" ? (
      <Button asChild variant="outline">
        <Link href="/login">Sign in</Link>
      </Button>
    ) : (
      dashboardRetryAction
    );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="A compact view of call volume, outcomes, routing, and agent performance."
        actions={<RangeSwitcher current={range} loading={isFetching} />}
      />
      <DashboardFreshness
        summary={data}
        loading={isLoading}
        dataUpdatedAt={dataUpdatedAt}
        isFetching={isFetching}
        isStale={isStale}
        onRefresh={() => refetch()}
      />
      {dashboardErrorState?.kind === "offline" ? (
        <OfflineState
          title={dashboardErrorState.title}
          description={dashboardErrorState.description}
          action={dashboardErrorAction}
        />
      ) : dashboardErrorState?.kind === "permission" ||
        dashboardHasPermissionError ? (
        <PermissionState
          title={dashboardErrorState?.title}
          description={dashboardErrorState?.description}
          action={dashboardErrorAction}
        />
      ) : dashboardErrorState ? (
        <ErrorState
          title={dashboardErrorState.title}
          description={dashboardErrorState.description}
          action={dashboardErrorAction}
        />
      ) : (
        <>
          <DashboardPartialDataNotice sections={missingDashboardSections} />
          <DashboardCommandCenter
            summary={data}
            range={range}
            loading={isLoading}
            successPct={successPct}
            exceptionCalls={exceptionCalls}
          />
          <KpiCards summary={data} range={range} loading={isLoading} />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <VolumeChart summary={data} range={range} loading={isLoading} />
            </div>
            <AgentActivityList
              summary={data}
              range={range}
              loading={isLoading}
            />
          </div>
          <BreakdownCharts summary={data} range={range} loading={isLoading} />
          <RecentCallsTable summary={data} loading={isLoading} />
        </>
      )}
    </div>
  );
}
