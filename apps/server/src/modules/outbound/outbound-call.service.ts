import { CallStatus, OutboundCallMode, TelephonyProvider } from "../../../prisma/generated/prisma/client.js";
import {
  LIVEKIT_AGENT_NAME,
  LIVEKIT_SIP_OUTBOUND_TRUNK_TELNYX_ID,
  LIVEKIT_SIP_OUTBOUND_TRUNK_TWILIO_ID,
  livekitAgentDispatchClient,
  livekitSipClient,
} from "../../config/livekit.js";
import { BadRequestError } from "../../common/errors/badRequest.js";
import type { QuickOutboundCallArgs } from "./outbound-call.schema.js";
import * as outboundCallRepository from "./outbound-call.repository.js";

type OutboundCallRepository = {
  createQuickCall: typeof outboundCallRepository.createQuickCall;
  markInProgress: typeof outboundCallRepository.markInProgress;
  markFailed: typeof outboundCallRepository.markFailed;
};

type SipClientLike = {
  createSipParticipant: (
    sipTrunkId: string,
    number: string,
    roomName: string,
    opts?: Record<string, unknown>
  ) => Promise<unknown>;
};

type AgentDispatchClientLike = {
  createDispatch: (
    roomName: string,
    agentName: string,
    options?: { metadata?: string }
  ) => Promise<unknown>;
};

type OutboundTrunks = Record<TelephonyProvider, string>;

type CreateQuickOutboundCallDeps = {
  repository?: OutboundCallRepository;
  sipClient?: SipClientLike;
  dispatchClient?: AgentDispatchClientLike;
  outboundTrunks?: OutboundTrunks;
  agentName?: string;
};

const defaultOutboundTrunks: OutboundTrunks = {
  [TelephonyProvider.TWILIO]: LIVEKIT_SIP_OUTBOUND_TRUNK_TWILIO_ID,
  [TelephonyProvider.TELNYX]: LIVEKIT_SIP_OUTBOUND_TRUNK_TELNYX_ID,
};

export async function createQuickOutboundCall(
  args: QuickOutboundCallArgs,
  deps: CreateQuickOutboundCallDeps = {}
) {
  const repository = deps.repository ?? outboundCallRepository;
  const sipClient = deps.sipClient ?? livekitSipClient;
  const dispatchClient = deps.dispatchClient ?? livekitAgentDispatchClient;
  const outboundTrunks = deps.outboundTrunks ?? defaultOutboundTrunks;
  const agentName = deps.agentName ?? LIVEKIT_AGENT_NAME;
  const trunkId = outboundTrunks[args.provider];

  if (!trunkId) {
    throw new BadRequestError(`LiveKit outbound trunk is not configured for ${args.provider}`);
  }

  const outbound = await repository.createQuickCall({
    ...args,
    status: CallStatus.SCHEDULED,
    mode: OutboundCallMode.quick,
    optionalData: {
      username: args.username ?? null,
      sid: args.sid,
    },
  });

  try {
    const roomName = `outbound_${outbound.outboundId}`;
    const metadata = buildOutboundMetadata(args, outbound.outboundId);
    const metadataJson = JSON.stringify(metadata);
    const agentDispatch = await dispatchClient.createDispatch(roomName, agentName, {
      metadata: metadataJson,
    });
    const livekitParticipant = await sipClient.createSipParticipant(
      trunkId,
      args.phoneNumber,
      roomName,
      {
        fromNumber: args.fromNumber,
        participantIdentity: `outbound-${outbound.outboundId}`,
        participantName: args.username,
        participantMetadata: metadataJson,
        waitUntilAnswered: false,
      }
    );

    const updated = await repository.markInProgress(
      outbound.outboundId,
      {
        username: args.username ?? null,
        sid: args.sid,
        livekitParticipant,
        agentDispatch,
      }
    );

    return { outbound: updated, livekitParticipant, agentDispatch };
  } catch (error) {
    await repository.markFailed(
      outbound.outboundId,
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}

function buildOutboundMetadata(args: QuickOutboundCallArgs, outboundId: string) {
  return {
    agent_id: args.agentId,
    outbound_id: outboundId,
    direction: "outbound",
    from_number: args.fromNumber,
    to_number: args.phoneNumber,
    provider: args.provider,
    first_message: args.firstMessage ?? null,
    system_prompt: args.systemPrompt ?? null,
    username: args.username ?? null,
  };
}
