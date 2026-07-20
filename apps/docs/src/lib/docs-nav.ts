export type DocsNavItem = {
  title: string;
  href: string;
  description?: string;
};

export type DocsNavGroup = {
  title: string;
  items: DocsNavItem[];
};

export const docsNav: DocsNavGroup[] = [
  {
    title: "Start",
    items: [
      { title: "Docs home", href: "/", description: "QuickVoice documentation entry point." },
      { title: "MCP overview", href: "/mcp", description: "What QuickVoice MCP connects and enables." },
      { title: "Quickstart", href: "/mcp/quickstart", description: "Connect an MCP client in minutes." },
      { title: "API keys", href: "/mcp/api-keys", description: "Create least-privilege keys for MCP clients." },
    ],
  },
  {
    title: "Reference",
    items: [
      { title: "Tools", href: "/mcp/tools", description: "Actions exposed by the MCP server." },
      { title: "Resources", href: "/mcp/resources", description: "Read-only MCP resources." },
      { title: "Safety", href: "/mcp/safety", description: "Permissions, risk levels, and destructive actions." },
    ],
  },
  {
    title: "Operate",
    items: [
      { title: "Troubleshooting", href: "/mcp/troubleshooting", description: "Fix common connection and session errors." },
      { title: "Self-hosting", href: "/mcp/self-hosting", description: "Run the MCP server locally or on ECS." },
      { title: "Changelog", href: "/mcp/changelog", description: "Tool and resource schema changes." },
    ],
  },
];

export function flattenedDocsNav() {
  return docsNav.flatMap((group) => group.items);
}
