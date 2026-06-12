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
            <div className="flex items-center gap-3 border bg-card p-4 text-sm text-muted-foreground">
                <Music className="size-4" />
                No recording available for this call.
            </div>
        );
    }

    return (
        <div className="space-y-3 border bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-sm font-medium">
                    <Music className="size-4 text-muted-foreground" />
                    <span>Recording</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        size="sm"
                        onClick={togglePlayback}
                        aria-label={playing ? "Pause recording" : "Play recording"}
                    >
                        {playing ? <Pause /> : <Play />}
                        {playing ? "Pause" : "Play recording"}
                    </Button>
                    <Button asChild type="button" variant="outline" size="sm">
                        <a href={src} target="_blank" rel="noreferrer" download>
                            <Download />
                            Download
                        </a>
                    </Button>
                </div>
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
