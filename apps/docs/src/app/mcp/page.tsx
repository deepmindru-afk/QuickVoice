import { DocCard } from "@/components/doc-card";
import { mcpReferenceStats } from "@/generated/mcp-reference";

export default function McpOverviewPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <section className="rounded-3xl border border-[var(--qv-border)] bg-white p-8 shadow-sm sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--qv-blue)]">QuickVoice MCP</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl">Connect agents, calls, widgets, and operations to AI clients.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--qv-muted)]">The MCP server is a thin authenticated HTTP layer over verified QuickVoice APIs. It exposes safe read resources and clearly named tools for actions such as creating agents, managing phone numbers, launching calls, and inspecting widget sessions.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Stat label="Tools" value={mcpReferenceStats.toolCount} />
          <Stat label="Resources" value={mcpReferenceStats.resourceCount} />
          <Stat label="Excluded APIs" value={mcpReferenceStats.excludedCount} />
        </div>
      </section>
      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DocCard title="Quickstart" description="Configure a client, add the remote HTTP endpoint, and verify the MCP handshake." href="/mcp/quickstart" />
        <DocCard title="Tools reference" description="Review every action exposed to model clients, including auth and risk level." href="/mcp/tools" />
        <DocCard title="Resources reference" description="Browse read-only data available through MCP resource URIs." href="/mcp/resources" />
        <DocCard title="API keys" description="Create and rotate server tokens without exposing console session cookies." href="/mcp/api-keys" />
        <DocCard title="Safety model" description="Understand cost actions, write actions, destructive actions, and excluded APIs." href="/mcp/safety" />
        <DocCard title="Self-hosting" description="Run the MCP server beside QuickVoice on ECS or as a separate service." href="/mcp/self-hosting" />
      </section>
    </div>
  );
}

function Stat({ label, value }: Readonly<{ label: string; value: number }>) {
  return <div className="rounded-2xl border border-[var(--qv-border)] bg-[var(--qv-bg-muted)] p-4"><p className="text-3xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-sm font-medium text-[var(--qv-muted)]">{label}</p></div>;
}
