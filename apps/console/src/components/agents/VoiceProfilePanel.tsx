"use client";

import { useMemo, useState } from "react";
import { BadgeInfo, Volume2 } from "lucide-react";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import type { Voice } from "@/src/lib/data/voices";

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "-";
}

export function VoiceProfilePanel({
  voice,
  languageLabel,
  ttsModelLabel,
}: {
  voice?: Voice;
  languageLabel: string;
  ttsModelLabel: string;
}) {
  const [speaking, setSpeaking] = useState(false);
  const canPreview =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const tags = useMemo(
    () => [...(voice?.styles ?? []), ...(voice?.useCases ?? [])].slice(0, 8),
    [voice?.styles, voice?.useCases]
  );

  function playBrowserSample() {
    if (!canPreview || !voice) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      "Hi, thanks for calling. How can I help you today?"
    );
    utterance.lang = voice.locale || voice.languages[0] || "en-US";
    utterance.rate = 0.96;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  if (!voice) {
    return (
      <div className="border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
        Select a compatible voice to view profile details.
      </div>
    );
  }

  return (
    <div className="border bg-muted/20 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{voice.name}</h3>
            <Badge variant="outline">{voice.provider}</Badge>
            <Badge variant="secondary">{ttsModelLabel}</Badge>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Gender</p>
              <p className="mt-1 font-medium">{titleCase(voice.gender)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Locale</p>
              <p className="mt-1 font-medium">{voice.locale || languageLabel}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Accent</p>
              <p className="mt-1 font-medium">{voice.accent || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Languages</p>
              <p className="mt-1 font-medium tabular-nums">
                {voice.languages.length}
              </p>
            </div>
          </div>
          {tags.length ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2 lg:w-52">
          <Button
            type="button"
            variant="outline"
            onClick={playBrowserSample}
            disabled={!canPreview || speaking}
          >
            <Volume2 className="size-4" />
            {speaking ? "Playing" : "Browser sample"}
          </Button>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <BadgeInfo className="mt-0.5 size-3.5 shrink-0" />
            Local browser speech is only a pacing sample.
          </div>
        </div>
      </div>
    </div>
  );
}
