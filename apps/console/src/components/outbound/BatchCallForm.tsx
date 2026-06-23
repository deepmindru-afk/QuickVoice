"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Copy,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/src/components/common/EmptyState";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useAgents } from "@/src/hooks/queries/agents";
import { useNumbers } from "@/src/hooks/queries/numbers";
import {
  useBatchCampaigns,
  useCreateBatchCampaign,
} from "@/src/hooks/queries/outbound";
import { outboundApi } from "@/src/lib/api/resources/outbound";
import type { Agent, PhoneNumber } from "@/src/lib/api/types";
import {
  BATCH_TEMPLATE_HEADER,
  batchCampaignSchema,
} from "@/src/models/outbound/campaign";

const ACCEPT_STRING = ".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function asDialableAgents(agents: Agent[], numbers: PhoneNumber[]) {
  return agents
    .filter((agent) => agent.isActive && agent.isConfigured)
    .map((agent) => ({
      ...agent,
      numbers: numbers.filter((number) => number.agentId === agent.agentId),
    }))
    .filter((agent) => agent.numbers.length > 0);
}

function contentTypeFor(file: File) {
  if (file.type) return file.type;
  if (file.name.toLowerCase().endsWith(".csv")) return "text/csv";
  if (file.name.toLowerCase().endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  return "application/octet-stream";
}

function formatDate(value: string | null) {
  if (!value) return "Instant";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function BatchCallForm() {
  const { data: agents = [], isLoading: agentsLoading, refetch: refetchAgents } = useAgents();
  const { data: numbers = [], isLoading: numbersLoading, refetch: refetchNumbers } = useNumbers();
  const createBatch = useCreateBatchCampaign();
  const { data: campaigns = [], isLoading: campaignsLoading } = useBatchCampaigns();
  const dialableAgents = useMemo(
    () => asDialableAgents(agents, numbers),
    [agents, numbers]
  );

  const fileRef = useRef<HTMLInputElement>(null);
  const [requestedAgentId, setRequestedAgentId] = useState("");
  const [requestedFromNumber, setRequestedFromNumber] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [scheduleMode, setScheduleMode] = useState<"instant" | "later">("instant");
  const [scheduledAt, setScheduledAt] = useState("");
  const [ringingTimeoutSeconds, setRingingTimeoutSeconds] = useState(60);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdCampaignName, setCreatedCampaignName] = useState<string | null>(null);

  const agentId = dialableAgents.some((agent) => agent.agentId === requestedAgentId)
    ? requestedAgentId
    : dialableAgents[0]?.agentId ?? "";
  const selectedAgent = dialableAgents.find((agent) => agent.agentId === agentId);
  const fromNumber = selectedAgent?.numbers.some(
    (number) => number.number === requestedFromNumber
  )
    ? requestedFromNumber
    : selectedAgent?.numbers[0]?.number ?? "";

  const isLoading = agentsLoading || numbersLoading;
  const isBusy = createBatch.isPending;
  const canSubmit =
    Boolean(agentId) &&
    Boolean(fromNumber) &&
    Boolean(name.trim()) &&
    Boolean(file) &&
    !isBusy;

  function refresh() {
    refetchAgents();
    refetchNumbers();
  }

  function selectAgent(nextAgentId: string) {
    setRequestedAgentId(nextAgentId);
    const nextAgent = dialableAgents.find((agent) => agent.agentId === nextAgentId);
    setRequestedFromNumber(nextAgent?.numbers[0]?.number ?? "");
  }

  function resetFileInput() {
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function copyHeader() {
    await navigator.clipboard.writeText(BATCH_TEMPLATE_HEADER);
    toast.success("Template header copied");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setCreatedCampaignName(null);

    const parsed = batchCampaignSchema.safeParse({
      name,
      agentId,
      fromNumber,
      file,
      scheduleMode,
      scheduledAt,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      ringingTimeoutSeconds,
    });

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Check the batch details");
      return;
    }

    try {
      const upload = await outboundApi.getBatchUploadUrl(
        parsed.data.file.name,
        contentTypeFor(parsed.data.file)
      );
      const uploadRes = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentTypeFor(parsed.data.file) },
        body: parsed.data.file,
      });
      if (!uploadRes.ok) {
        throw new Error(`File upload failed: ${uploadRes.status}`);
      }

      const campaign = await createBatch.mutateAsync({
        name: parsed.data.name,
        agentId: parsed.data.agentId,
        fromNumber: parsed.data.fromNumber,
        sourceFileKey: upload.s3Key,
        sourceFileName: parsed.data.file.name,
        scheduledAt:
          parsed.data.scheduleMode === "later" && parsed.data.scheduledAt
            ? new Date(parsed.data.scheduledAt).toISOString()
            : null,
        timezone: parsed.data.timezone,
        ringingTimeoutSeconds: parsed.data.ringingTimeoutSeconds,
      });

      setCreatedCampaignName(campaign.name);
      setName("");
      setScheduleMode("instant");
      setScheduledAt("");
      setRingingTimeoutSeconds(60);
      resetFileInput();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not create batch");
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="h-[620px] animate-pulse border bg-card" />
        <div className="h-80 animate-pulse border bg-card" />
      </div>
    );
  }

  if (dialableAgents.length === 0) {
    return (
      <EmptyState
        icon={FileSpreadsheet}
        title="No outbound-ready agents"
        description="Configure an active agent and assign a phone number before creating a batch."
        action={
          <Button variant="outline" onClick={refresh}>
            <RefreshCw /> Refresh
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 pb-20 xl:grid-cols-[minmax(0,1fr)_360px] xl:pb-0">
      <form onSubmit={onSubmit} className="border bg-card">
        <div className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-foreground">Batch calls</h2>
          <Badge variant="outline">CSV, XLS, XLSX</Badge>
        </div>

        <div className="grid gap-5 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="batchName">Campaign</Label>
              <Input
                id="batchName"
                placeholder="June renewals"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ringTimeout">Ring timeout</Label>
              <Input
                id="ringTimeout"
                type="number"
                min={10}
                max={180}
                value={ringingTimeoutSeconds}
                onChange={(event) => setRingingTimeoutSeconds(Number(event.target.value))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="batchAgent">Agent</Label>
              <Select value={agentId} onValueChange={selectAgent}>
                <SelectTrigger id="batchAgent" className="w-full">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {dialableAgents.map((agent) => (
                    <SelectItem key={agent.agentId} value={agent.agentId}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="batchFromNumber">From</Label>
              <Select value={fromNumber} onValueChange={setRequestedFromNumber}>
                <SelectTrigger id="batchFromNumber" className="w-full">
                  <SelectValue placeholder="Select caller ID" />
                </SelectTrigger>
                <SelectContent>
                  {(selectedAgent?.numbers ?? []).map((number) => (
                    <SelectItem key={number.phId} value={number.number}>
                      {number.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Recipient file</Label>
              <Button type="button" variant="ghost" size="sm" onClick={copyHeader}>
                <Copy /> Copy header
              </Button>
            </div>
            <button
              type="button"
              className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 border border-dashed bg-background px-4 py-6 text-center transition-colors hover:border-primary/60 hover:bg-muted/30"
              onClick={() => fileRef.current?.click()}
            >
              <UploadCloud className="size-8 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {file ? file.name : "Select recipient file"}
              </span>
              <span className="max-w-full break-all font-mono text-xs text-muted-foreground">
                {BATCH_TEMPLATE_HEADER}
              </span>
              <span className="text-xs text-muted-foreground">
                language and voice_id can be blank to use the agent defaults
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT_STRING}
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>

          <div className="grid gap-3">
            <Label>Schedule</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={scheduleMode === "instant" ? "default" : "outline"}
                onClick={() => setScheduleMode("instant")}
              >
                <Clock /> Instant
              </Button>
              <Button
                type="button"
                variant={scheduleMode === "later" ? "default" : "outline"}
                onClick={() => setScheduleMode("later")}
              >
                <CalendarClock /> Later
              </Button>
            </div>
            {scheduleMode === "later" ? (
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
            ) : null}
          </div>

          {formError ? (
            <p className="text-sm text-destructive">{formError}</p>
          ) : null}

          {createdCampaignName ? (
            <div
              aria-live="polite"
              className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
            >
              Queued {createdCampaignName}.
            </div>
          ) : null}

          <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={refresh}>
              <RefreshCw /> Refresh
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isBusy ? <Loader2 className="animate-spin" /> : <UploadCloud />}
              Queue batch
            </Button>
          </div>
        </div>
      </form>

      <aside className="border bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CheckCircle2 className="size-4 text-emerald-500" />
          Batch queue
        </div>
        <div className="mt-4 space-y-3">
          {campaignsLoading ? (
            <div className="h-24 animate-pulse border bg-background" />
          ) : campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No batch campaigns yet.</p>
          ) : (
            campaigns.slice(0, 8).map((campaign) => (
              <div key={campaign.campaignId} className="border-b pb-3 last:border-0 last:pb-0">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {campaign.name}
                  </p>
                  <Badge variant="secondary">{campaign.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {campaign.validRecipients}/{campaign.totalRecipients} valid
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(campaign.scheduledAt)}
                </p>
                {campaign.sourceFileName ? (
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {campaign.sourceFileName}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
