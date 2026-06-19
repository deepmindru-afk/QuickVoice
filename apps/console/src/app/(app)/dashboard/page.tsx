"use client";

import { useSearchParams } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/common/EmptyState";
import { PageHeader } from "@/src/components/common/PageHeader";
import { RangeSwitcher } from "@/src/components/dashboard/RangeSwitcher";
import { KpiCards } from "@/src/components/dashboard/KpiCards";
import { VolumeChart } from "@/src/components/dashboard/VolumeChart";
import { BreakdownCharts } from "@/src/components/dashboard/BreakdownCharts";
import { RecentCallsTable } from "@/src/components/dashboard/RecentCallsTable";
import { AgentActivityList } from "@/src/components/dashboard/AgentActivityList";
import { useDashboardSummary } from "@/src/hooks/queries/dashboard";
import type { DashboardRange } from "@/src/lib/api/resources/dashboard";

function resolveRange(param: string | null): DashboardRange {
  if (param === "24h" || param === "7d" || param === "30d") return param;
  return "7d";
}

export default function DashboardPage() {
  const params = useSearchParams();
  const range = resolveRange(params.get("range"));
  const { data, isLoading, isError, isFetching, refetch } = useDashboardSummary(range);
  const successPct = Math.round((data?.totals.successRate ?? 0) * 100);
  const exceptionCalls =
    (data?.totals.failedCalls ?? 0) + (data?.totals.missedCalls ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="A compact view of call volume, outcomes, routing, and agent performance."
        actions={<RangeSwitcher current={range} />}
      />
      {isError ? (
        <EmptyState
          icon={AlertCircle}
          title="Could not load dashboard"
          description="Refresh the summary or try again after checking your connection."
          action={
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={isFetching ? "animate-spin" : undefined} />
              Retry
            </Button>
          }
        />
      ) : (
      <>
      <div className="grid gap-4 border bg-card p-5 lg:grid-cols-[1fr_340px] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Operations snapshot
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
            {isLoading
              ? "Loading call performance"
              : `${data?.totals.calls ?? 0} calls at ${successPct}% success`}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Monitor traffic shape, service quality, and agent load from one place.
          </p>
        </div>
        <div className="grid grid-cols-3 border bg-background text-center text-xs">
          <div className="border-r px-3 py-3">
            <p className="text-lg font-semibold text-foreground">
              {data?.totals.minutes ?? 0}
            </p>
            <p className="text-muted-foreground">minutes</p>
          </div>
          <div className="border-r px-3 py-3">
            <p className="text-lg font-semibold text-foreground">
              {exceptionCalls}
            </p>
            <p className="text-muted-foreground">exceptions</p>
          </div>
          <div className="px-3 py-3">
            <p className="text-lg font-semibold text-foreground">
              {data?.topAgents.length ?? 0}
            </p>
            <p className="text-muted-foreground">agents</p>
          </div>
        </div>
      </div>
      <KpiCards summary={data} loading={isLoading} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <VolumeChart summary={data} range={range} loading={isLoading} />
        </div>
        <AgentActivityList summary={data} loading={isLoading} />
      </div>
      <BreakdownCharts summary={data} loading={isLoading} />
      <RecentCallsTable summary={data} loading={isLoading} />
      </>
      )}
    </div>
  );
}
