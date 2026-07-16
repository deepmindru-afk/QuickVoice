"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  PhoneCall,
  Radio,
  ShieldAlert,
  Sparkles,
  Timer,
  TrendingUp,
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
import { dashboardCallsHref } from "@/src/components/dashboard/call-filter-links";
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
    neutral: "bg-muted text-muted-foreground",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    danger: "bg-destructive/10 text-destructive",
    info: "bg-primary/10 text-primary",
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

function formatDashboardDateLabel(value?: string) {
  if (!value) return "No traffic yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No traffic yet";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function DashboardActionLink({
  href,
  label,
  description,
  icon: Icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-20 items-start gap-3 rounded-lg border bg-background p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3 text-sm font-semibold text-foreground">
          {label}
          <ArrowRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
    </Link>
  );
}

function DashboardInsightCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg border bg-background/80 p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
        </div>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {detail}
      </p>
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
  const exceptionRate = calls ? Math.round((exceptionCalls / calls) * 100) : 0;
  const peakPoint = summary?.series.reduce<
    DashboardSummary["series"][number] | null
  >((peak, point) => (!peak || point.calls > peak.calls ? point : peak), null);
  const peakLabel = peakPoint?.calls
    ? `${peakPoint.calls} calls at ${formatDashboardDateLabel(peakPoint.t)}`
    : "No traffic spike yet";
  const hasCalls = calls > 0;
  const successAngle = Math.max(0, Math.min(100, successPct)) * 3.6;
  const healthLabel = !hasCalls
    ? "Ready for traffic"
    : exceptionRate >= 20
      ? "Needs attention"
      : exceptionRate >= 8
        ? "Watch closely"
        : "Healthy";
  const healthDescription = !hasCalls
    ? "Place a test call to start validating routing and agent performance."
    : exceptionRate >= 8
      ? "Exceptions are high enough to review failed and missed calls."
      : "Calls are completing cleanly in the selected reporting window.";
  const exceptionHref = exceptionCalls
    ? dashboardCallsHref({
        range,
        status: totals?.failedCalls ? "FAILED" : "NOT_ANSWERED",
      })
    : "/calls";

  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="grid xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="relative min-w-0 p-6 sm:p-7 lg:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-primary" aria-hidden />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 max-w-3xl">
              <div className="inline-flex h-8 items-center gap-2 rounded-full border bg-background px-3 text-xs font-medium text-muted-foreground shadow-xs">
                <Activity className="size-3.5 text-primary" />
                {RANGE_LABELS[range]} overview
              </div>
              <h2 className="mt-5 max-w-4xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {loading
                  ? "Loading operational health"
                  : hasCalls
                    ? `${formatCompactNumber(
                        calls
                      )} calls with ${successPct}% completion quality`
                    : "Your voice operation is ready for its first signal"}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                One view for demand, reliability, routing coverage, and the next
                action your team should take.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <Button
                asChild
                className="h-10 justify-between gap-3 rounded-md bg-primary shadow-sm hover:bg-primary/90"
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
                <Link href={exceptionHref}>
                  Review exceptions <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-3">
            <DashboardInsightCard
              label="Exception rate"
              value={`${exceptionRate}%`}
              detail={`${formatCompactNumber(exceptionCalls)} failed or missed calls need follow-up.`}
              icon={ShieldAlert}
            />
            <DashboardInsightCard
              label="Peak demand"
              value={
                peakPoint?.calls ? formatCompactNumber(peakPoint.calls) : "0"
              }
              detail={peakLabel}
              icon={TrendingUp}
            />
            <DashboardInsightCard
              label="Agent coverage"
              value={formatCompactNumber(activeAgents)}
              detail={
                activeAgents
                  ? "Agents handled traffic in this period."
                  : "Create or assign an agent to start routing calls."
              }
              icon={Bot}
            />
          </div>
        </div>

        <aside className="border-t bg-muted/20 p-6 xl:border-l xl:border-t-0 lg:p-7">
          <div className="rounded-lg border bg-background p-5 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                  Operations health
                </p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                  {healthLabel}
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="size-3 text-primary" />
                Live summary
              </span>
            </div>
            <div
              className="mx-auto mt-5 grid size-36 place-items-center rounded-full"
              style={{
                background: `conic-gradient(hsl(var(--primary)) ${successAngle}deg, hsl(var(--muted)) 0deg)`,
              }}
              aria-label={`${successPct}% success rate`}
            >
              <div className="grid size-28 place-items-center rounded-full bg-card text-center shadow-sm">
                <div>
                  <p className="text-4xl font-semibold tracking-tight text-foreground tabular-nums">
                    {successPct}%
                  </p>
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Success
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              {healthDescription}
            </p>
            <div className="mt-5 grid gap-2 text-sm">
              <div className="flex items-center justify-between rounded-md bg-muted/45 px-3 py-2">
                <span className="text-muted-foreground">Minutes used</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {formatCompactNumber(minutes)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-muted/45 px-3 py-2">
                <span className="text-muted-foreground">Missed calls</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {formatCompactNumber(totals?.missedCalls ?? 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <DashboardActionLink
              href="/agents"
              label="Tune agents"
              description="Review agent setup and routing readiness."
              icon={Bot}
            />
            <DashboardActionLink
              href="/numbers"
              label="Manage numbers"
              description="Connect phone numbers and assignment coverage."
              icon={Radio}
            />
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
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3" aria-label="Traffic and agent performance">
            <div className="xl:col-span-2">
              <VolumeChart summary={data} range={range} loading={isLoading} />
            </div>
            <AgentActivityList
              summary={data}
              range={range}
              loading={isLoading}
            />
          </section>
          <BreakdownCharts summary={data} range={range} loading={isLoading} />
          <RecentCallsTable summary={data} loading={isLoading} />
        </>
      )}
    </div>
  );
}
