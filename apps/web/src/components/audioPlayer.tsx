"use client";

import { forwardRef } from "react";
import AudioPlayer from "react-h5-audio-player";
import "@/styles/audioPlayer.scss";

export interface PlayerProps {
  src: string;
  autoPlay?: boolean;
}

export const Player = forwardRef<AudioPlayer, PlayerProps>(
  ({ src, autoPlay = false }, ref) => {
    return (
      <AudioPlayer
        ref={ref}
        className="rounded-lg w-full py-20 border border-border"
        src={src}
        autoPlay={autoPlay}        // ✅ now false by default
        preload="metadata"         // ✅ ensures duration loads
        layout="horizontal-reverse"
        customVolumeControls={[]}
        customAdditionalControls={[]}
      />
    );
  }
);

Player.displayName = "Player";