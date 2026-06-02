"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/src/components/ui/sheet";
import { AudioPlayer } from "@/src/components/calls/AudioPlayer";
import { Transcript } from "@/src/components/calls/Transcript";
import type { CallLog } from "@/src/lib/api/types";

interface Props {
  call: CallLog | null;
  onClose: () => void;
}

export function CallTranscriptSheet({ call, onClose }: Props) {
  return (
    <Sheet open={!!call} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b p-5">
          <SheetTitle>{call?.callerId ?? "Unknown caller"}</SheetTitle>
          <SheetDescription>Recording &amp; transcript</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <AudioPlayer src={call?.audioRecordingPath ?? null} />
          <div>
            <p className="mb-3 text-sm font-semibold">Transcript</p>
            {call ? <Transcript callId={call.callId} /> : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
