"use client";

import { forwardRef } from "react";
import AudioPlayer from "react-h5-audio-player";
import "@/styles/audioPlayer.scss" ;

export interface PlayerProps {
  src: string;
 autoPlay?: boolean;
}

export const Player = forwardRef<AudioPlayer, PlayerProps>(
  ({ src, autoPlay = true }, ref) => {
    return (
      <AudioPlayer
        ref={ref}
        className="rounded-lg w-full py-20 border border-border"
        src={src}
        autoPlay={autoPlay}
        layout="horizontal-reverse"
        customVolumeControls={[]}
        customAdditionalControls={[]}
      />
    );
  }
);

Player.displayName = "Player";