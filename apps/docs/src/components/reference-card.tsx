type ReferenceItem = {
  name: string;
  method: string;
  path: string;
  auth: string;
  description: string;
  file: string;
  mappingReason?: string;
  risk?: string;
  uri?: string;
};

const riskLabel: Record<string, string> = {
  "external-cost": "Cost action",
  destructive: "Destructive",
  write: "Write",
  read: "Read",
};

export function ReferenceCard({ item, kind }: Readonly<{ item: ReferenceItem; kind: "tool" | "resource" }>) {
  const risk = item.risk ?? (kind === "resource" ? "read" : "write");
  return (
    <article className="rounded-2xl border border-[var(--qv-border)] bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--qv-blue)]">{kind}</p>
          <h3 className="mt-2 font-mono text-lg font-semibold tracking-tight text-slate-950">{item.name}</h3>
        </div>
        <span className="rounded-full border border-[var(--qv-border)] bg-[var(--qv-bg-muted)] px-3 py-1 text-xs font-semibold text-slate-700">{riskLabel[risk] ?? risk}</span>
      </div>
      <p className="mt-4 text-sm leading-6 text-[var(--qv-muted)]">{item.description}</p>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <Meta label="Endpoint" value={`${item.method} ${item.path}`} />
        <Meta label="Auth" value={item.auth} />
        {item.uri ? <Meta label="Resource URI" value={item.uri} /> : null}
        <Meta label="Source" value={item.file} />
      </dl>
      {item.mappingReason ? <p className="mt-4 border-t border-[var(--qv-border)] pt-4 text-xs leading-5 text-slate-500">{item.mappingReason}</p> : null}
    </article>
  );
}

function Meta({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="min-w-0 rounded-xl bg-[var(--qv-bg-muted)] px-3 py-2">
      <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</dt>
      <dd className="mt-1 truncate font-mono text-xs text-slate-800" title={value}>{value}</dd>
    </div>
  );
}
