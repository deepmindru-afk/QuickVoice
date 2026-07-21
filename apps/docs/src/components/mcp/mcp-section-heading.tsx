export function McpSectionHeading({ eyebrow, title, description }: Readonly<{ eyebrow?: string; title: string; description: string }>) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--qv-blue)]">{eyebrow}</p> : null}
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-[var(--qv-muted)]">{description}</p>
    </div>
  );
}
