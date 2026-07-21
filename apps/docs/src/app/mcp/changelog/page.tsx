import { mcpReferenceStats } from "@/generated/mcp-reference";

export default function ChangelogPage() {
  return (
    <article className="prose prose-qv max-w-4xl">
      <h1>Changelog</h1>
      <h2>July 2026</h2>
      <ul>
        <li>Generated MCP reference from the verified server registry.</li>
        <li>Documented {mcpReferenceStats.toolCount} tools and {mcpReferenceStats.resourceCount} resources.</li>
        <li>Listed {mcpReferenceStats.excludedCount} excluded APIs for follow-up before exposure.</li>
      </ul>
      <p>Future changes should update the MCP API registry first, then regenerate this documentation.</p>
    </article>
  );
}
