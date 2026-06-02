"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";
import { useTranscript } from "@/src/hooks/queries/calls";

export function Transcript({ callId }: { callId: string }) {
  const q = useTranscript(callId);
  const rows = q.data?.pages.flatMap((p) => p.data) ?? [];

  if (q.isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No transcript captured for this call.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((r) => {
        const isAgent = r.speaker === "agent" || r.speaker === "assistant";
        return (
          <div
            key={r.callTransId}
            className={cn("flex", isAgent ? "justify-start" : "justify-end")}
          >
            <div
              className={cn(
                "max-w-[78%] px-4 py-3",
                isAgent
                  ? "rounded-2xl rounded-tl-sm bg-[#0f2142] text-foreground"
                  : "rounded-2xl rounded-tr-sm bg-blue-600 text-white"
              )}
            >
              <p className="text-sm leading-relaxed">{r.messageText}</p>
              <p className={cn("mt-1 text-right text-[10px]", isAgent ? "text-white/40" : "text-white/60")}>
                {new Date(r.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
          </div>
        );
      })}

      {q.hasNextPage ? (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => q.fetchNextPage()}
            disabled={q.isFetchingNextPage}
          >
            {q.isFetchingNextPage ? (
              <>
                <Loader2 className="animate-spin" /> Loading…
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
