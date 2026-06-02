// Hand-written mirrors of the server's Prisma types.
// Kept intentionally minimal — extend as UI needs more fields.
// The server's Prisma `generated` dir is excluded from the console tsconfig,
// so we don't import from it.

export type TelephonyProvider = "twilio" | "telnyx";

export type CallStatus =
  | "NOT_ANSWERED"
  | "SCHEDULED"
  | "PROCESSED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED";

export type KbStatus = "PROCESSING" | "ACTIVE" | "ERROR";
export type KbSourceType = "PDF" | "TXT" | "CSV" | "DOCX" | "URL";

export interface Agent {
  agentId: string;
  agentSlug: string;
  organizationId: string;
  userId: string | null;
  name: string;
  templateId: string | null;
  isActive: boolean;
  isConfigured: boolean;
  createdAt: string;
  updatedAt: string;
  callLogsCount: number;
  phoneNumbersCount: number;
  knowledgeSourcesCount: number;
  toolsCount: number;
}

export interface AgentConfiguration {
  agentConfigId: string;
  agentId: string;
  systemPrompt: string;
  firstMessage: string;
  temperature: number;
  data_needed: unknown;
  data_evaluation: unknown;
  voiceId: string;
  concurrent_calls_limit: number;
  conversation_retention_days: number;
  daily_calls_limit: number;
  enable_auth_for_agent_api: boolean;
  max_conversation_duration_seconds: number;
  optimize_streaming_latency: boolean;
  silence_end_call_timeout_seconds: number;
  store_call_audio: boolean;
  tokenLimit: number;
  tts_output_format: string;
  turn_timeout_seconds: number;
  use_flash_call: boolean;
  use_rag: boolean;
  user_input_audio_format: string;
  voice_similarity_boost: number;
  voice_speed: number;
  voice_stability: number;
  zero_pii_retention: boolean;
  llmModel: string;
  sttModel: string;
  ttsModel: string;
  agent_language: string;
  initiation_webhook: WebhookConfig | null;
  post_call_webhook: WebhookConfig | null;
  variables: Record<string, unknown> | null;
  preemptive_generation: boolean;
  timezone: string;
}

export interface WebhookConfig {
  webhook_url: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  dynamic_variables?: Record<string, string>;
  transcript?: boolean;
  audio_url?: boolean;
}

export interface PhoneNumber {
  phId: string;
  number: string;
  organizationId: string;
  userId: string | null;
  agentId: string | null;
  sid: string;
  friendlyName: string;
  provider: TelephonyProvider;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  locality?: string;
  region?: string;
  isoCountry: string;
}

export interface CallLog {
  callId: string;
  organizationId: string;
  agentId: string | null;
  userId: string | null;
  startTime: string | null;
  endTime: string | null;
  durationSeconds: number | null;
  status: CallStatus;
  audioRecordingPath: string | null;
  callerId: string | null;
  metadata: Record<string, unknown> | null;
  sessionId: string | null;
  direction: string | null;
  dataExtracted: unknown;
  dataEvaluation: unknown;
  callCostCents: number | null;
  deleted: boolean;
}

export interface CallTranscript {
  callTransId: string;
  callLogId: string;
  speaker: string;
  messageText: string;
  timestamp: string;
  confidenceScore: number | null;
  isPiiRedacted: boolean;
  sentimentScore: number | null;
}

export interface KnowledgeSource {
  kbId: string;
  organizationId: string;
  agentId: string | null;
  userId: string | null;
  name: string;
  originalFileName: string | null;
  storagePath: string;
  sourceType: KbSourceType;
  status: KbStatus;
  metadata: Record<string, unknown> | null;
  lastIndexedAt: string | null;
  uploadedAt: string;
}

export interface KVPair {
  key: string;
  value: string;
}

export interface ToolParam {
  name: string;
  type: "String" | "Number" | "Boolean";
  valueType: "LLM Prompt" | "Static Value" | "Dynamic Variable";
  description: string;
  allowedValues: string[];
  required: boolean;
}

export interface Tool {
  toolId: string;
  organizationId: string;
  name: string;
  description: string;
  api_url: string;
  api_method: string;
  api_headers: KVPair[] | null;
  api_body: ToolParam[] | null;
  api_query_params: ToolParam[] | null;
  api_path_params: ToolParam[] | null;
  response_timeout_secs: number | null;
  dynamic_variables: KVPair[] | null;
  disable_interruptions: boolean;
  force_pre_tool_speech: boolean;
  createdAt: string;
  updatedAt: string;
  agent: { agentId: string; name: string }[];
}

export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  nextCursor?: string | null;
}
