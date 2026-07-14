"use client";

import { useMemo, useState } from "react";
import { Clock, Loader2, PhoneCall, PhoneOff, Radio, Users, X } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { useEndLiveCall, useLiveCalls } from "@/src/hooks/queries/calls";
import type { LiveCallRoom } from "@/src/lib/api/resources/calls";

function formatStartedAt(value: string | null) {
  if (!value) return "Started just now";
  const started = new Date(value).getTime();
  if (!Number.isFinite(started)) return "Started just now";
  const minutes = Math.max(0, Math.floor((Date.now() - started) / 60000));
  if (minutes < 1) return "Started under 1 min ago";
  if (minutes === 1) return "Started 1 min ago";
  return `Started ${minutes} min ago`;
}

function directionLabel(direction: LiveCallRoom["direction"]) {
  if (direction === "outbound") return "Outbound";
  if (direction === "inbound") return "Inbound";
  return "Live";
}

export function LiveCallsDock() {
  const [open, setOpen] = useState(false);
  const [endTarget, setEndTarget] = useState<LiveCallRoom | null>(null);
  const { data: calls = [], isFetching, isError } = useLiveCalls();
  const endLiveCall = useEndLiveCall();

  const sortedCalls = useMemo(
    () =>
      [...calls].sort((a, b) =>
        (b.startedAt ?? "").localeCompare(a.startedAt ?? "")
      ),
    [calls]
  );
  const activeCount = sortedCalls.length;

  async function confirmEndCall() {
    if (!endTarget) return;
    await endLiveCall.mutateAsync(endTarget.roomName);
    setEndTarget(null);
  }

  return (
    <>
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
        {open && (
          <section className="w-[min(420px,calc(100vw-2rem))] overflow-hidden border bg-popover shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b px-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <Radio className="size-4 text-emerald-600" />
                  <p className="text-sm font-semibold">Live calls</p>
                  <Badge variant={activeCount ? "default" : "secondary"}>
                    {activeCount}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Active LiveKit rooms for this organization.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setOpen(false)}
                aria-label="Close live calls"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="max-h-[420px] overflow-y-auto p-3">
              {isError ? (
                <div className="border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm text-destructive">
                  Live calls are unavailable.
                </div>
              ) : activeCount === 0 ? (
                <div className="flex flex-col items-center justify-center border border-dashed px-4 py-8 text-center">
                  <PhoneCall className="mb-2 size-5 text-muted-foreground" />
                  <p className="text-sm font-medium">No active calls</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    New LiveKit rooms appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedCalls.map((call) => (
                    <article key={call.roomName} className="border bg-card p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{directionLabel(call.direction)}</Badge>
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="size-3" />
                              {call.participantCount}
                            </span>
                          </div>
                          <p className="mt-2 truncate font-mono text-xs" title={call.roomName}>
                            {call.roomName}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            {formatStartedAt(call.startedAt)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          onClick={() => setEndTarget(call)}
                          disabled={endLiveCall.isPending}
                        >
                          <PhoneOff className="size-4" />
                          End
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <Button
          type="button"
          className="h-11 gap-2 shadow-lg"
          variant={activeCount ? "default" : "outline"}
          onClick={() => setOpen((value) => !value)}
          aria-label={`Open live calls (${activeCount} active)`}
        >
          {isFetching ? <Loader2 className="size-4 animate-spin" /> : <Radio className="size-4" />}
          <span>Live</span>
          <Badge variant={activeCount ? "secondary" : "outline"}>{activeCount}</Badge>
        </Button>
      </div>

      <AlertDialog open={!!endTarget} onOpenChange={(value) => !value && setEndTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this live call?</AlertDialogTitle>
            <AlertDialogDescription>
              This closes the LiveKit room {endTarget?.roomName}. The caller and agent will be disconnected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={endLiveCall.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEndCall} disabled={endLiveCall.isPending}>
              {endLiveCall.isPending && <Loader2 className="size-4 animate-spin" />}
              End call
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
