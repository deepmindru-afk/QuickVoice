import type { Server as HttpServer } from "node:http";
import { fromNodeHeaders } from "better-auth/node";
import type { Redis } from "ioredis";
import { Server as SocketIOServer } from "socket.io";

import { redisConnection } from "../config/redis.js";
import { trustedOrigins } from "../config/origins.js";
import { auth } from "../lib/auth.js";
import { hasSessionPermission } from "../middleware/authorize.middleware.js";
import {
  LIVE_TRANSCRIPT_CHANNEL,
  parseWatchCallRequest,
  type ClientToServerEvents,
  type ServerToClientEvents,
  type SocketCommandError,
  type SocketData,
  type UnwatchCallAck,
  type WatchCallAck,
} from "./live-transcript.contract.js";
import {
  LiveTranscriptStore,
  parsePublishedEvent,
} from "./live-transcript.store.js";
import { liveTranscriptStore } from "./live-transcript.runtime.js";

type LiveSocketServer = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export class LiveTranscriptGateway {
  readonly io: LiveSocketServer;
  private started = false;
  private closed = false;

  constructor(
    httpServer: HttpServer,
    private readonly store: LiveTranscriptStore = liveTranscriptStore,
    private readonly subscriber: Redis = redisConnection.duplicate()
  ) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: trustedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
      },
    });
    this.io.use(async (socket, next) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(socket.request.headers),
        });
        if (!session) {
          return next(socketError("UNAUTHENTICATED", "Authentication required"));
        }

        const typedSession = session as {
          user: { id: string };
          session?: { activeOrganizationId?: string | null };
        };
        const organizationId =
          typedSession.session?.activeOrganizationId ?? null;
        if (!organizationId) {
          return next(
            socketError("FORBIDDEN", "An active organization is required")
          );
        }
        const permitted = await hasSessionPermission(
          socket.request.headers,
          organizationId,
          { callLogs: ["read"] }
        );
        if (!permitted) {
          return next(socketError("FORBIDDEN", "Insufficient permissions"));
        }

        socket.data.userId = typedSession.user.id;
        socket.data.organizationId = organizationId;
        return next();
      } catch (error) {
        console.warn("[live-transcript] socket authentication failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        return next(socketError("UNAVAILABLE", "Authentication is unavailable"));
      }
    });

    this.io.on("connection", (socket) => {
      const organizationId = socket.data.organizationId;
      void socket.join(organizationRoom(organizationId));

      socket.on("live-call:watch", async (payload, acknowledge) => {
        const request = parseWatchCallRequest(payload);
        if (!request) {
          return acknowledge?.(
            commandFailure("BAD_REQUEST", "A valid callId is required")
          );
        }

        const callRoomName = callRoom(organizationId, request.callId);
        try {
          const access = await this.store.getCallAccess(
            organizationId,
            request.callId
          );
          if (!access) {
            return acknowledge?.(
              commandFailure("NOT_FOUND", "Live call not found")
            );
          }

          // Join before reading the stream. An event published during replay
          // reaches the joined socket and is also present in the acknowledgement;
          // clients deduplicate both paths by eventId/messageId.
          await socket.join(callRoomName);
          const messages = await this.store.readTranscriptHistory(
            organizationId,
            request.callId
          );
          const response: WatchCallAck = {
            ok: true,
            callId: request.callId,
            messages,
            status: access.status,
          };
          return acknowledge?.(response);
        } catch (error) {
          await socket.leave(callRoomName);
          console.warn("[live-transcript] failed to watch call", {
            organizationId,
            callId: request.callId,
            error: error instanceof Error ? error.message : String(error),
          });
          return acknowledge?.(
            commandFailure(
              "UNAVAILABLE",
              "Live transcript is temporarily unavailable"
            )
          );
        }
      });

      socket.on("live-call:unwatch", async (payload, acknowledge) => {
        const request = parseWatchCallRequest(payload);
        if (!request) {
          return acknowledge?.(
            commandFailure("BAD_REQUEST", "A valid callId is required")
          );
        }
        await socket.leave(callRoom(organizationId, request.callId));
        const response: UnwatchCallAck = {
          ok: true,
          callId: request.callId,
        };
        return acknowledge?.(response);
      });
    });
  }

  async start(): Promise<void> {
    if (this.started || this.closed) return;
    this.started = true;
    this.subscriber.on("message", this.onRedisMessage);
    this.subscriber.on("error", this.onRedisError);
    await this.subscriber.subscribe(LIVE_TRANSCRIPT_CHANNEL);
    console.log("[live-transcript] subscribed to Redis events");
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    this.subscriber.off("message", this.onRedisMessage);
    this.subscriber.off("error", this.onRedisError);
    if (this.started) {
      await this.subscriber
        .unsubscribe(LIVE_TRANSCRIPT_CHANNEL)
        .catch(() => undefined);
    }
    await this.subscriber.quit().catch(() => undefined);
    await new Promise<void>((resolve) => this.io.close(() => resolve()));
  }

  private readonly onRedisMessage = (channel: string, raw: string) => {
    if (channel !== LIVE_TRANSCRIPT_CHANNEL) return;
    const event = parsePublishedEvent(raw);
    if (!event) {
      console.warn("[live-transcript] discarded malformed Redis event");
      return;
    }

    if (event.type === "call.started") {
      this.io
        .to(organizationRoom(event.organizationId))
        .emit("live-call:started", event);
      return;
    }
    if (event.type === "call.ended") {
      this.io
        .to(organizationRoom(event.organizationId))
        .emit("live-call:ended", event);
      return;
    }
    this.io
      .to(callRoom(event.organizationId, event.callId))
      .emit("live-transcript:message", event);
  };

  private readonly onRedisError = (error: Error) => {
    console.warn("[live-transcript] Redis subscriber error", {
      error: error.message,
    });
  };
}

export const organizationRoom = (organizationId: string) =>
  `org:${organizationId}`;

export const callRoom = (organizationId: string, callId: string) =>
  `org:${organizationId}:call:${callId}`;

function commandFailure(
  code: SocketCommandError["code"],
  message: string
): { ok: false; error: SocketCommandError } {
  return { ok: false, error: { code, message } };
}

function socketError(code: string, message: string) {
  const error = new Error(message) as Error & {
    data?: { code: string };
  };
  error.data = { code };
  return error;
}
