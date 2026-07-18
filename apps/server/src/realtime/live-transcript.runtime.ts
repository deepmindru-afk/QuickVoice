import { redisConnection } from "../config/redis.js";
import { LiveTranscriptStore } from "./live-transcript.store.js";

export const liveTranscriptStore = new LiveTranscriptStore(redisConnection);
