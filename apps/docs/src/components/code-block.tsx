export function CodeBlock({ code, language = "bash" }: Readonly<{ code: string; language?: string }>) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-slate-800 bg-[var(--qv-code)] shadow-sm">
      <figcaption className="border-b border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{language}</figcaption>
      <pre className="overflow-x-auto p-4 text-sm leading-7 text-slate-100"><code>{code}</code></pre>
    </figure>
  );
}
