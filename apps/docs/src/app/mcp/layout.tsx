import type { Metadata } from "next";
import { DocsShell } from "@/components/docs-shell";

export const metadata: Metadata = {
  title: "MCP",
  description: "QuickVoice MCP server documentation, reference, and operations guide.",
};

export default function McpLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <DocsShell>{children}</DocsShell>;
}
