import type { CallStatus } from "@/src/lib/api/types";
import type { DashboardRange } from "@/src/lib/api/resources/dashboard";

export function dashboardCallsHref({
  range,
  status,
  agentId,
  from,
  to,
}: {
  range: DashboardRange;
  status?: CallStatus;
  agentId?: string | null;
  from?: string;
  to?: string;
}) {
  const params = new URLSearchParams();
  params.set("range", range);
  if (status) params.set("status", status);
  if (agentId) params.set("agentId", agentId);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  return `/calls?${params.toString()}`;
}
