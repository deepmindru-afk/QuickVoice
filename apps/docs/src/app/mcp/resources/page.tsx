import { ReferenceCard } from "@/components/reference-card";
import { mcpResources } from "@/generated/mcp-reference";

export default function ResourcesPage() {
  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--qv-border)] pb-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--qv-blue)]">Reference</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.035em] text-slate-950">MCP resources</h1>
          <p className="mt-3 max-w-2xl text-[var(--qv-muted)]">Read-only resources for dashboard state, call logs, agents, widgets, and operational visibility.</p>
        </div>
        <span className="rounded-full border border-[var(--qv-border)] bg-white px-4 py-2 text-sm font-semibold text-slate-700">{mcpResources.length} resources</span>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {mcpResources.map((resource) => <ReferenceCard key={resource.name} item={resource} kind="resource" />)}
      </div>
    </section>
  );
}
