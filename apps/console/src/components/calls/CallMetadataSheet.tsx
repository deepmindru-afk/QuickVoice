"use client";

import {
  CheckCircle2,
  PhoneIncoming,
  PhoneOutgoing,
  XCircle,
  Clock,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/src/components/ui/sheet";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import type { CallLog, CallStatus } from "@/src/lib/api/types";

interface Props {
  call: CallLog | null;
  onClose: () => void;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(s: number | null) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const r = String(s % 60).padStart(2, "0");
  return `${m}:${r}`;
}

function DirectionValue({ direction }: { direction: string | null }) {
  if (direction === "outbound") {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-sky-400">
        <PhoneOutgoing className="size-4" /> Outbound
      </span>
    );
  }
  if (direction === "inbound") {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
        <PhoneIncoming className="size-4" /> Inbound
      </span>
    );
  }
  return <span className="font-semibold">—</span>;
}

function StatusValue({ status }: { status: CallStatus }) {
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
        <CheckCircle2 className="size-4" /> Completed
      </span>
    );
  }
  if (status === "FAILED" || status === "NOT_ANSWERED") {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-red-400">
        <XCircle className="size-4" /> {status === "FAILED" ? "Failed" : "Not Answered"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground">
      <Clock className="size-4" /> {status.replace("_", " ")}
    </span>
  );
}

function StatCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

// ── extracted / evaluation item types ────────────────────────────────────────

interface ExtractedItem {
  type: string;
  name: string;
  description: string;
  value: unknown;
}

interface EvalItem {
  identifier: string;
  description: string;
  value: unknown;
}

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

const PRIMARY_METADATA_KEYS = new Set([
  "summary",
  "intent",
  "reason",
  "outboundId",
  "fromNumber",
  "toNumber",
  "provider",
  "zeroPiiRetention",
  "retentionDays",
]);

function isEmptyMetadataValue(value: unknown) {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  );
}

function formatMetadataLabel(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function displayValue(v: unknown): string {
  if (v === null || v === undefined) return "N/A";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "string" && v.trim() === "") return "N/A";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

// ── component ─────────────────────────────────────────────────────────────────

export function CallMetadataSheet({ call, onClose }: Props) {
  const meta = (call?.metadata ?? {}) as Record<string, unknown>;
  const extracted = safeArray<ExtractedItem>(call?.dataExtracted);
  const evaluation = safeArray<EvalItem>(call?.dataEvaluation);
  const additionalMetadata = Object.entries(meta).filter(
    ([key, value]) => !PRIMARY_METADATA_KEYS.has(key) && !isEmptyMetadataValue(value)
  );

  return (
    <Sheet open={!!call} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b p-5">
          <SheetTitle>Call Details</SheetTitle>
          <SheetDescription>
            {call?.callId.slice(0, 8)}… · {call ? new Date(call.startTime ?? "").toLocaleString() : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">

          {/* ── Summary card ── */}
          <div className="rounded-xl bg-[#0d1f3c] p-4">
            <div className="grid grid-cols-2 gap-y-4">
              <StatCell label="Caller">
                <span className="font-semibold">{call?.callerId ?? "Unknown"}</span>
              </StatCell>
              <StatCell label="Duration">
                <span className="font-semibold">{fmtDuration(call?.durationSeconds ?? null)}</span>
              </StatCell>
              <StatCell label="Direction">
                <DirectionValue direction={call?.direction ?? null} />
              </StatCell>
              <StatCell label="Status">
                {call ? <StatusValue status={call.status} /> : null}
              </StatCell>
            </div>
          </div>

          {/* ── Call Intent ── */}
          {meta.intent ? (
            <>
              <div className="space-y-2">
                <h3 className="text-base font-bold">Call Intent</h3>
                <p className="font-mono text-sm text-muted-foreground">{String(meta.intent)}</p>
              </div>
              <Separator />
            </>
          ) : null}

          {/* ── Call Summary ── */}
          {meta.summary ? (
            <>
              <div className="space-y-2">
                <h3 className="text-base font-bold">Call Summary</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{String(meta.summary)}</p>
              </div>
              <Separator />
            </>
          ) : null}

          {/* ── Call Reason ── */}
          {meta.reason ? (
            <>
              <div className="space-y-2">
                <h3 className="text-base font-bold">Call Reason</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{String(meta.reason)}</p>
              </div>
              <Separator />
            </>
          ) : null}

          {/* ── Additional metadata ── */}
          {additionalMetadata.length > 0 ? (
            <>
              <div className="space-y-3">
                <h3 className="text-base font-bold">Additional Metadata</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {additionalMetadata.map(([key, value]) => (
                    <div key={key} className="space-y-1 rounded-lg bg-[#0d1f3c] p-4">
                      <p className="text-xs text-muted-foreground">{formatMetadataLabel(key)}</p>
                      <p className="break-words text-sm font-semibold">{displayValue(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          ) : null}

          {/* ── Extracted Data ── */}
          {extracted.length > 0 ? (
            <>
              <div className="space-y-3">
                <h3 className="text-base font-bold">Extracted Data</h3>
                {extracted.map((item, i) => (
                  <div key={i} className="space-y-1 rounded-lg bg-[#0d1f3c] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                      <Badge className="bg-blue-600 text-[10px] text-white hover:bg-blue-600">
                        {item.type}
                      </Badge>
                    </div>
                    <p className="text-sm font-bold">{displayValue(item.value)}</p>
                    {item.description ? (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    ) : null}
                  </div>
                ))}
              </div>
              <Separator />
            </>
          ) : null}

          {/* ── Evaluation ── */}
          {evaluation.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-base font-bold">Evaluation</h3>
              {evaluation.map((item, i) => (
                <div key={i} className="space-y-1 rounded-lg bg-[#0d1f3c] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{item.identifier}</span>
                    <Badge variant="secondary" className="text-[10px]">eval</Badge>
                  </div>
                  <p className="text-sm font-bold">{displayValue(item.value)}</p>
                  {item.description ? (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {/* ── Empty state ── */}
          {!meta.intent && !meta.summary && !meta.reason && additionalMetadata.length === 0 && extracted.length === 0 && evaluation.length === 0 ? (
            <p className="text-sm text-muted-foreground">No additional data recorded for this call.</p>
          ) : null}

        </div>
      </SheetContent>
    </Sheet>
  );
}
