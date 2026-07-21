"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function McpCopyButton({ value, label = "Copy" }: Readonly<{ value: string; label?: string }>) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copyValue}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/70"
      aria-live="polite"
    >
      {copied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}
