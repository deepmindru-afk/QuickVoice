"use client";

import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useAgents } from "@/src/hooks/queries/agents";
import { useUpdateNumber } from "@/src/hooks/queries/numbers";

const UNASSIGNED = "__unassigned__";

export function AssignAgentSelect({
  phId,
  agentId,
}: {
  phId: string;
  agentId: string | null;
}) {
  const { data: agents, isLoading: agentsLoading } = useAgents();
  const update = useUpdateNumber();

  function onChange(value: string) {
    const next = value === UNASSIGNED ? null : value;
    update.mutate({ phId, input: { agentId: next } });
  }

  return (
    <Select
      value={agentId ?? UNASSIGNED}
      onValueChange={onChange}
      disabled={agentsLoading || update.isPending}
    >
      <SelectTrigger className="h-8 w-full min-w-0 text-xs sm:w-[200px]">
        <div className="flex min-w-0 items-center gap-2">
          {update.isPending ? <Loader2 className="size-3 animate-spin" /> : null}
          <SelectValue placeholder={agentsLoading ? "Loading agents..." : "Unassigned"} />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
        {(agents ?? []).map((a) => (
          <SelectItem key={a.agentId} value={a.agentId}>
            {a.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
