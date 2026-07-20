export default function DocsHomePage() {
  return (
    <main className="min-h-screen qv-grid-bg">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#002FA7]">QuickVoice Docs</p>
        <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-slate-950 md:text-7xl">
          Build, operate, and connect AI voice agents.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          Technical documentation for QuickVoice agents, website widgets, call workflows, APIs, and the QuickVoice MCP server.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <a className="border border-[#002FA7] bg-[#002FA7] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#001f70]" href="/mcp">
            Start with MCP
          </a>
          <a className="border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-950" href="/api-reference">
            API reference
          </a>
          <a className="border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-950" href="/mcp/tools">
            View tools
          </a>
        </div>
      </section>
    </main>
  );
}
