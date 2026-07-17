"use client";

import { useRef, useState } from "react";
import { Download, Music, Pause, Play } from "lucide-react";

import { Button } from "@/src/components/ui/button";

export function AudioPlayer({ src }: { src: string | null }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playingSrc, setPlayingSrc] = useState<string | null>(null);
    const playing = playingSrc === src;

    async function togglePlayback() {
        const audio = audioRef.current;
        if (!audio) return;

        if (playing) {
            audio.pause();
            setPlayingSrc(null);
            return;
        }

        try {
            await audio.play();
            setPlayingSrc(src);
        } catch {
            setPlayingSrc(null);
        }
    }

    if (!src) {
        return (
            <div className="rounded-2xl border bg-background p-5 text-sm text-muted-foreground shadow-sm">
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Music className="size-5" />
                </div>
                <p className="font-medium text-foreground">No recording available</p>
                <p className="mt-1 leading-relaxed">This call does not have an audio file attached.</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border bg-background p-5 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Music className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">Recording</p>
                    <p className="mt-1 text-xs text-muted-foreground">Listen to the captured call audio or download it for review.</p>
                </div>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button
                    type="button"
                    className="w-full justify-center sm:flex-1"
                    onClick={togglePlayback}
                    aria-label={playing ? "Pause recording" : "Play recording"}
                >
                    {playing ? <Pause /> : <Play />}
                    {playing ? "Pause" : "Play recording"}
                </Button>
                <Button asChild type="button" variant="outline" className="w-full justify-center sm:flex-1">
                    <a href={src} target="_blank" rel="noreferrer" download>
                        <Download />
                        Download
                    </a>
                </Button>
            </div>
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                onEnded={() => setPlayingSrc(null)}
                onPause={() => setPlayingSrc(null)}
                onPlay={() => setPlayingSrc(src)}
            />
        </div>
    );
}
