"use client";

import { useState } from "react";
import { Wrench, Search, Loader2, Check, Plus } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useTools, useAttachTool, useDetachTool } from "@/src/hooks/queries/tools";
import type { Tool } from "@/src/lib/api/types";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-300",
  POST: "bg-blue-500/10 text-blue-600 border-blue-500/25 dark:text-blue-300",
  PUT: "bg-amber-500/10 text-amber-600 border-amber-500/25 dark:text-amber-300",
  PATCH: "bg-violet-500/10 text-violet-600 border-violet-500/25 dark:text-violet-300",
  DELETE: "bg-rose-500/10 text-rose-600 border-rose-500/25 dark:text-rose-300",
};

interface ToolPickerDialogProps {
  agentId: string;
  attachedTools: Tool[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ToolPickerDialog({
  agentId,
  attachedTools,
  open,
  onOpenChange,
}: ToolPickerDialogProps) {
  const [search, setSearch] = useState("");
  const { data: allTools = [], isLoading } = useTools();
  const attachTool = useAttachTool(agentId);
  const detachTool = useDetachTool(agentId);

  const attachedIds = new Set(attachedTools.map((t) => t.toolId));
  const filtered = allTools.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (tool: Tool) => {
    if (attachedIds.has(tool.toolId)) {
      detachTool.mutate(tool.toolId);
    } else {
      attachTool.mutate(tool.toolId);
    }
  };

  const isPending = (toolId: string) =>
    (attachTool.isPending && attachTool.variables === toolId) ||
    (detachTool.isPending && detachTool.variables === toolId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add tools</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tools…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>

        <div className="max-h-80 space-y-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Wrench className="size-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">
                {allTools.length === 0 ? "No tools in your organization yet." : "No tools match your search."}
              </p>
            </div>
          ) : (
            filtered.map((tool) => {
              const attached = attachedIds.has(tool.toolId);
              const pending = isPending(tool.toolId);
              return (
                <div
                  key={tool.toolId}
                  className="flex items-center gap-3 rounded-md border bg-card px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-medium">{tool.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${METHOD_COLORS[tool.api_method] ?? ""}`}
                      >
                        {tool.api_method}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{tool.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={attached ? "outline" : "default"}
                    className="h-7 shrink-0 text-xs"
                    onClick={() => toggle(tool)}
                    disabled={pending}
                  >
                    {pending ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : attached ? (
                      <><Check className="size-3" /> Attached</>
                    ) : (
                      <><Plus className="size-3" /> Attach</>
                    )}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
