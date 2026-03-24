"use client";

import { useEffect, useRef, useState, RefObject } from "react";
import clsx from "clsx";
import AudioPlayer from "react-h5-audio-player";

export type TranscriptLine = {
  time: number;
  speaker: "Agent" | "Customer";
  text: string;
};

export function TypingTranscript({
  audioRef,
  transcript,
  typingSpeed = 36,
  isPlaying,
}: {
  audioRef: RefObject<AudioPlayer | null>;
  transcript: TranscriptLine[];
  typingSpeed?: number;
  isPlaying: boolean;
}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [typedLines, setTypedLines] = useState<string[]>([]);
  const startedTyping = useRef<Set<number>>(new Set());
  const prevTime = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  /** Track audio time — ONLY when user is playing */
  useEffect(() => {
    const audio = audioRef.current?.audio.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (!isPlaying) return; // 🔑 FINAL GATE
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    return () => audio.removeEventListener("timeupdate", onTimeUpdate);
  }, [audioRef, isPlaying]);

  /** Handle backward seek */
  useEffect(() => {
    if (!isPlaying) return;

    if (currentTime < prevTime.current) {
      const validIndex = transcript.findLastIndex(
        (line) => line.time <= currentTime
      );

      setTypedLines((prev) => prev.slice(0, validIndex + 1));

      startedTyping.current = new Set(
        [...startedTyping.current].filter((idx) => idx <= validIndex)
      );
    }

    prevTime.current = currentTime;
  }, [currentTime, transcript, isPlaying]);

  /** Start typing lines */
  useEffect(() => {
    if (!isPlaying) return;

    transcript.forEach((line, idx) => {
      if (
        currentTime >= line.time &&
        !startedTyping.current.has(idx)
      ) {
        startedTyping.current.add(idx);

        let charIndex = 0;
        const interval = setInterval(() => {
          setTypedLines((prev) => {
            const next = [...prev];
            next[idx] = line.text.slice(0, charIndex + 1);
            return next;
          });

          charIndex++;
          if (charIndex >= line.text.length) {
            clearInterval(interval);
          }
        }, typingSpeed);

        intervalsRef.current.push(interval);
      }
    });

    return () => {
      intervalsRef.current.forEach(clearInterval);
      intervalsRef.current = [];
    };
  }, [currentTime, transcript, typingSpeed, isPlaying]);

  /** Auto-scroll */
  useEffect(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [typedLines]);

  return (
    <div
      ref={containerRef}
      className="max-h-72 overflow-y-auto space-y-3 rounded-xl border border-border bg-background p-4"
    >
      {/* Empty state */}
      {!isPlaying && typedLines.length === 0 && (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Click on{" "}
          <span className="mx-1 font-semibold text-primary">Play</span>{" "}
          button to generate transcript
        </div>
      )}

      {transcript.map((line, idx) => {
        const typedText = typedLines[idx];
        if (!typedText) return null;

        const isTyping = typedText.length < line.text.length;
        const isAgent = line.speaker === "Agent";

        return (
          <div
            key={idx}
            className={clsx(
              "flex",
              isAgent ? "justify-start" : "justify-end"
            )}
          >
            <div
              className={clsx(
                "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                isAgent
                  ? "bg-primary text-primary-foreground rounded-bl-sm"
                  : "bg-muted text-foreground rounded-br-sm"
              )}
            >
              <div
                className={clsx(
                  "mb-0.5 text-xs font-semibold",
                  isAgent
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground"
                )}
              >
                {line.speaker}
              </div>

              <span>
                {typedText}
                {isTyping && (
                  <span className="ml-0.5 animate-pulse">▍</span>
                )}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
