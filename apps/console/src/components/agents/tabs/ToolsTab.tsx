"use client";

import { useState } from "react";
import { Wrench, Plus, Unlink, Loader2 } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { EmptyState } from "@/src/components/common/EmptyState";
import { ToolPickerDialog } from "@/src/components/tools/ToolPickerDialog";
import { useAgentTools, useDetachTool } from "@/src/hooks/queries/tools";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-300",
  POST: "bg-blue-500/10 text-blue-600 border-blue-500/25 dark:text-blue-300",
  PUT: "bg-amber-500/10 text-amber-600 border-amber-500/25 dark:text-amber-300",
  PATCH: "bg-violet-500/10 text-violet-600 border-violet-500/25 dark:text-violet-300",
  DELETE: "bg-rose-500/10 text-rose-600 border-rose-500/25 dark:text-rose-300",
};

export function ToolsTab({ agentId }: { agentId: string }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { data: tools = [], isLoading } = useAgentTools(agentId);
  const detachTool = useDetachTool(agentId);

  const addButton = (
    <Button size="sm" onClick={() => setPickerOpen(true)}>
      <Plus className="size-4" />
      Add tool
    </Button>
  );

  return (
    <div className="border bg-card">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div>
          <p className="text-sm font-semibold">Attached tools</p>
          <p className="text-xs text-muted-foreground">HTTP tools this agent can call mid-conversation</p>
        </div>
        {addButton}
      </div>

      {isLoading ? (
        <div className="space-y-px">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3">
              <Skeleton className="size-8" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-64" />
              </div>
            </div>
          ))}
        </div>
      ) : !tools.length ? (
        <div className="px-5 py-8">
          <EmptyState
            icon={Wrench}
            title="No tools attached"
            description="Add tools from your organization's tool library to let this agent call external APIs."
            action={addButton}
          />
        </div>
      ) : (
        <div className="divide-y">
          {tools.map((tool) => (
            <div key={tool.toolId} className="flex items-center gap-4 px-5 py-3">
              <div className="flex size-8 shrink-0 items-center justify-center border bg-primary/10 text-primary">
                <Wrench className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-medium">{tool.name}</p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold ${METHOD_COLORS[tool.api_method] ?? ""}`}
                  >
                    {tool.api_method}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{tool.api_url}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {tool.force_pre_tool_speech && (
                  <span className="hidden sm:inline">Pre-speech</span>
                )}
                {tool.response_timeout_secs && (
                  <span className="hidden sm:inline">{tool.response_timeout_secs}s timeout</span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => detachTool.mutate(tool.toolId)}
                  disabled={detachTool.isPending && detachTool.variables === tool.toolId}
                >
                  {detachTool.isPending && detachTool.variables === tool.toolId ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Unlink className="size-3.5" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ToolPickerDialog
        agentId={agentId}
        attachedTools={tools}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
      />
    </div>
  );
}
