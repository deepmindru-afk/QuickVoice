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
    neutral: "text-slate-600 bg-slate-100",
    success: "text-emerald-700 bg-emerald-50",
    warning: "text-amber-700 bg-amber-50",
    danger: "text-red-700 bg-red-50",
    info: "text-[#002FA7] bg-blue-50",
  }[tone];

  return (
    <div className="group min-w-0 border-t border-border/70 px-5 py-4 transition-colors hover:bg-muted/35 lg:border-l lg:border-t-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {detail}
          </p>
        </div>
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-md ${toneClass}`}
        >
          <Icon className="size-4" />
        </span>
      </div>
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
  const successAngle = Math.max(0, Math.min(100, successPct)) * 3.6;

  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative min-w-0 p-6 sm:p-7">
          <div
            className="absolute inset-x-0 top-0 h-1 bg-[#002FA7]"
            aria-hidden
          />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_176px] xl:items-start">
            <div className="min-w-0">
              <div className="inline-flex h-8 items-center gap-2 rounded-md border bg-background px-3 text-xs font-medium text-muted-foreground">
                <Activity className="size-3.5 text-[#002FA7]" />
                {RANGE_LABELS[range]}
              </div>
              <h2 className="mt-5 max-w-4xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {loading
                  ? "Loading call performance"
                  : hasCalls
                    ? `${formatCompactNumber(
                        calls
                      )} calls, ${successPct}% completed`
                    : "No call activity in this range yet"}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Track volume, reliability, exceptions, and agent load without
                jumping between reports.
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Button
                  asChild
                  className="h-10 justify-between gap-3 rounded-md bg-[#002FA7] hover:bg-[#002FA7]/90"
                >
                  <Link href="/outbound">
                    Start outbound call <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-10 justify-between gap-3 rounded-md bg-background"
                >
                  <Link href="/calls">
                    Review call logs <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="rounded-lg border bg-background p-4">
              <div
                className="mx-auto grid size-32 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(#002FA7 ${successAngle}deg, hsl(var(--muted)) 0deg)`,
                }}
                aria-label={`${successPct}% success rate`}
              >
                <div className="grid size-24 place-items-center rounded-full bg-card text-center shadow-sm">
                  <div>
                    <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                      {successPct}%
                    </p>
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                      Success
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
                Completed calls out of total activity in this range.
              </p>
            </div>
          </div>
        </div>

        <aside className="border-t bg-muted/20 p-6 lg:border-l lg:border-t-0">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground">
            Routing capacity
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-md bg-background px-4 py-3 shadow-xs">
              <span className="text-sm text-muted-foreground">Minutes used</span>
              <span className="text-lg font-semibold tabular-nums text-foreground">
                {formatCompactNumber(minutes)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-background px-4 py-3 shadow-xs">
              <span className="text-sm text-muted-foreground">Active agents</span>
              <span className="text-lg font-semibold tabular-nums text-foreground">
                {formatCompactNumber(activeAgents)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-background px-4 py-3 shadow-xs">
              <span className="text-sm text-muted-foreground">Missed calls</span>
              <span className="text-lg font-semibold tabular-nums text-foreground">
                {formatCompactNumber(totals?.missedCalls ?? 0)}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-md border bg-background px-3 py-3 text-xs text-muted-foreground">
            <Clock3 className="mt-0.5 size-3.5 shrink-0 text-[#002FA7]" />
            <span>
              Use the range control to compare short-term spikes against longer
              campaign trends.
            </span>
          </div>
        </aside>
      </div>

      <div className="grid border-t bg-background/80 lg:grid-cols-4">
        <DashboardSignal
          label="Calls"
          value={formatCompactNumber(calls)}
          detail="Inbound and outbound records"
          icon={PhoneCall}
          tone="info"
        />
        <DashboardSignal
          label="Success"
          value={`${successPct}%`}
          detail="Completed calls"
          icon={CheckCircle2}
          tone="success"
        />
        <DashboardSignal
          label="Exceptions"
          value={formatCompactNumber(exceptionCalls)}
          detail="Failed and missed calls"
          icon={ShieldAlert}
          tone={exceptionCalls ? "danger" : "neutral"}
        />
        <DashboardSignal
          label="Avg duration"
          value={avgDuration}
          detail="Connected call length"
          icon={Timer}
          tone="warning"
        />
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
