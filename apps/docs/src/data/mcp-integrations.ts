import type { LucideIcon } from "lucide-react";
import { Bot, Braces, Code2, Github, Hand, MousePointer2, Sparkles, SquareCode, Terminal, Waves } from "lucide-react";

export type McpIntegration = {
  name: string;
  description: string;
  icon: LucideIcon;
};

export const mcpIntegrations: McpIntegration[] = [
  { name: "Cursor", description: "AI code editor", icon: MousePointer2 },
  { name: "Windsurf", description: "AI code editor", icon: Waves },
  { name: "Claude Desktop", description: "Desktop MCP client", icon: Sparkles },
  { name: "Claude Code", description: "CLI assistant", icon: Terminal },
  { name: "Codex", description: "OpenAI coding agent", icon: Bot },
  { name: "VS Code", description: "Editor clients", icon: Code2 },
  { name: "GitHub Copilot", description: "IDE assistant", icon: Github },
  { name: "JetBrains", description: "IDE clients", icon: SquareCode },
  { name: "OpenHands", description: "Development agent", icon: Hand },
  { name: "Other MCP clients", description: "Streamable HTTP", icon: Braces },
];
