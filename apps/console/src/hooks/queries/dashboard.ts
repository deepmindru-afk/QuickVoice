"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getDashboardSummary,
  type DashboardSummaryParams,
} from "@/src/lib/api/resources/dashboard";
import { queryKeys } from "@/src/lib/query-keys";

export function useDashboardSummary(params: DashboardSummaryParams) {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(params),
    queryFn: () => getDashboardSummary(params),
  });
}
