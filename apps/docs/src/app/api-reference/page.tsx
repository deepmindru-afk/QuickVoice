import type { Metadata } from "next";
import { ApiReference } from "@/components/api/api-reference";

export const metadata: Metadata = {
  title: "API Reference",
  description: "QuickVoice REST API reference for agents, calls, numbers, widgets, tools, MCP integrations, and operations.",
};

export default function ApiReferencePage() {
  return <ApiReference />;
}
