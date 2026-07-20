import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "QuickVoice Docs",
    template: "%s · QuickVoice Docs",
  },
  description: "Documentation for QuickVoice product APIs, MCP server, agents, widgets, calls, and deployment.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
