const apiVersion = process.env.API_VERSION || "v1";
const basePath = `/api/${apiVersion}`;

const userAuthSecurity = [
  { sessionCookie: [] },
  { apiKey: [] },
];

const internalAuthSecurity: never[] = [];

const errorResponse = {
  type: "object",
  properties: {
    success: { type: "boolean", example: false },
    message: { type: "string" },
  },
};

export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "QuickVoice Server API",
    version: apiVersion,
    description: "Interactive API documentation for the QuickVoice Express server.",
  },
  servers: [
    {
      url: basePath,
      description: "Current server",
    },
  ],
  tags: [
    { name: "System" },
    { name: "Auth" },
    { name: "Dashboard" },
    { name: "Agents" },
    { name: "Numbers" },
    { name: "Calls" },
    { name: "Knowledge Base" },
  ],
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "better-auth.session_token",
        description:
          "Better Auth session cookie from the console app. In Swagger UI, this is normally sent automatically when you are logged in on the same API origin.",
      },
      apiKey: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description:
          "Organization-scoped QuickVoice API key. Send the raw key in the x-api-key header; do not use Authorization: Bearer for external API keys.",
      },
    },
    schemas: {
      ErrorResponse: errorResponse,
      CreateAgentRequest: {
        type: "object",
        required: ["name", "isActive", "templateId"],
        properties: {
          name: { type: "string", minLength: 2, example: "Reception Agent" },
          isActive: { type: "boolean", example: true },
          templateId: {
            type: "string",
            format: "uuid",
            nullable: true,
            example: null,
          },
        },
      },
      UpdateAgentRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          name: { type: "string", minLength: 2 },
          isActive: { type: "boolean" },
          templateId: { type: "string", format: "uuid", nullable: true },
        },
      },
      ConfigureAgentRequest: {
        type: "object",
        required: [
          "agent_language",
          "firstMessage",
          "systemPrompt",
          "llmModel",
          "sttModel",
          "ttsModel",
          "use_rag",
          "voiceId",
          "data_needed",
          "data_evaluation",
          "initiation_webhook",
          "post_call_webhook",
          "preemptive_generation",
          "timezone",
        ],
        properties: {
          agent_language: { type: "string", example: "en-US" },
          firstMessage: { type: "string", example: "Hello, how can I help you today?" },
          systemPrompt: {
            type: "string",
            example: "You are a friendly, reliable voice assistant.",
          },
          llmModel: { type: "string", example: "google/gemini-2.5-flash" },
          sttModel: { type: "string", example: "nova-3" },
          ttsModel: { type: "string", example: "aura-2" },
          use_rag: { type: "boolean", example: false },
          voiceId: { type: "string", example: "athena" },
          data_needed: {
            type: "array",
            items: { $ref: "#/components/schemas/DataItem" },
          },
          data_evaluation: {
            type: "array",
            items: { $ref: "#/components/schemas/DataEvaluation" },
          },
          initiation_webhook: {
            nullable: true,
            example: null,
            allOf: [{ $ref: "#/components/schemas/InitiationWebhook" }],
          },
          post_call_webhook: {
            nullable: true,
            example: null,
            allOf: [{ $ref: "#/components/schemas/PostCallWebhook" }],
          },
          variables: { $ref: "#/components/schemas/AgentVariables" },
          preemptive_generation: { type: "boolean", example: true },
          timezone: { type: "string", example: "Asia/Calcutta" },
        },
        example: {
          agent_language: "en-US",
          firstMessage: "Hello, how can I help you today?",
          systemPrompt: "You are a friendly, reliable voice assistant for handling customer calls.",
          llmModel: "google/gemini-2.5-flash",
          sttModel: "nova-3",
          ttsModel: "aura-2",
          use_rag: false,
          voiceId: "athena",
          data_needed: [],
          data_evaluation: [],
          initiation_webhook: null,
          post_call_webhook: null,
          variables: {
            firstMessage: [],
            systemPrompt: [],
            placeholders: {},
          },
          preemptive_generation: true,
          timezone: "Asia/Calcutta",
        },
      },
      DataItem: {
        type: "object",
        required: ["id", "type", "name", "description"],
        properties: {
          id: { type: "string" },
          type: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
        },
      },
      DataEvaluation: {
        type: "object",
        required: ["id", "name", "criteria"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          criteria: { type: "string" },
        },
      },
      SecretValueMap: {
        type: "object",
        additionalProperties: {
          type: "object",
          required: ["value", "type"],
          properties: {
            value: { type: "string" },
            type: { type: "string", enum: ["Value", "Secret"] },
          },
        },
      },
      InitiationWebhook: {
        type: "object",
        required: ["webhook_url", "method"],
        properties: {
          webhook_url: {
            type: "string",
            format: "uri",
            example: "https://example.com/api/voice/initiation",
          },
          method: { type: "string", enum: ["POST", "GET"], example: "POST" },
          dynamic_variables: {
            type: "object",
            additionalProperties: { type: "string" },
            example: {},
          },
          headers: { $ref: "#/components/schemas/SecretValueMap" },
          body: { $ref: "#/components/schemas/SecretValueMap" },
        },
      },
      PostCallWebhook: {
        type: "object",
        required: ["webhook_url", "method", "transcript", "audio_url"],
        properties: {
          webhook_url: {
            type: "string",
            format: "uri",
            example: "https://example.com/api/voice/post-call",
          },
          method: { type: "string", enum: ["POST"], example: "POST" },
          headers: { $ref: "#/components/schemas/SecretValueMap" },
          transcript: { type: "boolean", example: true },
          audio_url: { type: "boolean", example: true },
        },
      },
      AgentVariables: {
        type: "object",
        properties: {
          firstMessage: { type: "array", items: { type: "string" } },
          systemPrompt: { type: "array", items: { type: "string" } },
          placeholders: {
            type: "object",
            additionalProperties: { type: "string" },
          },
        },
      },
      BuyNumberRequest: {
        type: "object",
        required: ["provider", "phoneNumber"],
        properties: {
          provider: { type: "string", enum: ["TWILIO", "TELNYX"] },
          phoneNumber: { type: "string", example: "+14155551234" },
        },
      },
      UpdateNumberRequest: {
        type: "object",
        required: ["agentId"],
        properties: {
          agentId: { type: "string", format: "uuid", nullable: true },
        },
      },
      CreateKbRequest: {
        type: "object",
        required: ["agentId", "documents"],
        properties: {
          agentId: { type: "string", format: "uuid" },
          documents: {
            type: "array",
            minItems: 1,
            items: { $ref: "#/components/schemas/KbDocument" },
          },
        },
      },
      KbDocument: {
        type: "object",
        required: ["name", "sourceType"],
        properties: {
          name: { type: "string", example: "Pricing FAQ" },
          sourceType: { type: "string", enum: ["PDF", "TXT", "CSV", "DOCX", "URL"] },
          url: { type: "string", format: "uri", nullable: true },
          s3Key: { type: "string", nullable: true },
          originalFileName: { type: "string", nullable: true },
        },
      },
      CallLogRequest: {
        type: "object",
        required: [
          "organizationId",
          "agentId",
          "callId",
          "startTime",
          "endTime",
          "direction",
          "durationSeconds",
          "status",
          "recordingSid",
          "transcripts",
          "toNumber",
          "fromNumber",
          "provider",
        ],
        properties: {
          organizationId: { type: "string" },
          userId: { type: "string" },
          agentId: { type: "string", format: "uuid" },
          callId: { type: "string" },
          startTime: { type: "string", format: "date-time" },
          endTime: { type: "string", format: "date-time" },
          direction: { type: "string", enum: ["inbound", "outbound"] },
          durationSeconds: { type: "number" },
          status: {
            type: "string",
            description: "CallStatus enum from Prisma.",
          },
          metadata: {
            type: "object",
            properties: {
              summary: { type: "string" },
              intent: { type: "string" },
              outboundId: { type: "string", format: "uuid", nullable: true },
            },
          },
          recordingSid: { type: "string" },
          transcripts: {
            type: "array",
            items: { $ref: "#/components/schemas/Transcript" },
          },
          toNumber: { type: "string" },
          fromNumber: { type: "string" },
          provider: { type: "string", enum: ["TWILIO", "TELNYX"] },
          extractedData: {
            type: "array",
            items: { $ref: "#/components/schemas/ExtractedData" },
          },
          evaluatedData: {
            type: "array",
            items: { $ref: "#/components/schemas/EvaluatedData" },
          },
        },
      },
      Transcript: {
        type: "object",
        required: ["messageId", "role", "message", "timestamp"],
        properties: {
          messageId: { type: "string" },
          role: { type: "string", enum: ["user", "agent"] },
          message: { type: "string" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
      ExtractedData: {
        type: "object",
        required: ["type", "name", "description", "value"],
        properties: {
          type: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          value: { nullable: true },
        },
      },
      EvaluatedData: {
        type: "object",
        required: ["identifier", "description", "value"],
        properties: {
          identifier: { type: "string" },
          description: { type: "string" },
          value: { nullable: true },
        },
      },
      DashboardSummary: {
        type: "object",
        properties: {
          range: { type: "string", enum: ["24h", "7d", "30d"] },
          period: {
            type: "object",
            properties: {
              from: { type: "string", format: "date-time" },
              to: { type: "string", format: "date-time" },
              previousFrom: { type: "string", format: "date-time" },
              previousTo: { type: "string", format: "date-time" },
            },
          },
          totals: {
            type: "object",
            properties: {
              calls: { type: "number" },
              minutes: { type: "number" },
              avgDurationSeconds: { type: "number" },
              successRate: { type: "number" },
              failedCalls: { type: "number" },
              missedCalls: { type: "number" },
            },
          },
          deltas: {
            type: "object",
            additionalProperties: { type: "number" },
          },
          series: { type: "array", items: { type: "object" } },
          statusBreakdown: { type: "array", items: { type: "object" } },
          directionBreakdown: { type: "array", items: { type: "object" } },
          topAgents: { type: "array", items: { type: "object" } },
          recent: { type: "array", items: { type: "object" } },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: "Unauthorized",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
        },
      },
      Forbidden: {
        description: "Forbidden",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
        },
      },
      NotFound: {
        description: "Not found",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        responses: {
          200: { description: "Server is running" },
        },
      },
    },
    "/me": {
      get: {
        tags: ["Auth"],
        summary: "Verify authenticated access",
        security: userAuthSecurity,
        responses: {
          200: { description: "Authenticated user can access the API" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/dashboard/summary": {
      get: {
        tags: ["Dashboard"],
        summary: "Get dashboard analytics summary",
        security: userAuthSecurity,
        parameters: [
          {
            name: "range",
            in: "query",
            schema: { type: "string", enum: ["24h", "7d", "30d"], default: "7d" },
          },
        ],
        responses: {
          200: {
            description: "Dashboard analytics summary",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DashboardSummary" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/agents": {
      get: {
        tags: ["Agents"],
        summary: "List agents",
        security: userAuthSecurity,
        responses: {
          200: { description: "Agent list" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
      post: {
        tags: ["Agents"],
        summary: "Create an agent",
        security: userAuthSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateAgentRequest" },
            },
          },
        },
        responses: {
          201: { description: "Agent created" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/agents/{id}": {
      patch: {
        tags: ["Agents"],
        summary: "Update an agent",
        security: userAuthSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateAgentRequest" },
            },
          },
        },
        responses: {
          200: { description: "Agent updated" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/agents/{agentId}/config": {
      get: {
        tags: ["Agents"],
        summary: "Get agent configuration",
        security: userAuthSecurity,
        parameters: [{ name: "agentId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Agent configuration" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
      post: {
        tags: ["Agents"],
        summary: "Create or update agent configuration",
        security: userAuthSecurity,
        parameters: [{ name: "agentId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ConfigureAgentRequest" },
              example: {
                agent_language: "en-US",
                firstMessage: "Hello, how can I help you today?",
                systemPrompt:
                  "You are a friendly, reliable voice assistant for handling customer calls.",
                llmModel: "google/gemini-2.5-flash",
                sttModel: "nova-3",
                ttsModel: "aura-2",
                use_rag: false,
                voiceId: "athena",
                data_needed: [],
                data_evaluation: [],
                initiation_webhook: null,
                post_call_webhook: null,
                variables: {
                  firstMessage: [],
                  systemPrompt: [],
                  placeholders: {},
                },
                preemptive_generation: true,
                timezone: "Asia/Calcutta",
              },
            },
          },
        },
        responses: {
          200: { description: "Agent configuration saved" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/numbers/search": {
      get: {
        tags: ["Numbers"],
        summary: "Search available phone numbers",
        security: userAuthSecurity,
        parameters: [
          { name: "provider", in: "query", required: true, schema: { type: "string", enum: ["TWILIO", "TELNYX"] } },
          { name: "country", in: "query", required: true, schema: { type: "string", example: "US" } },
          { name: "areaCode", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer", maximum: 50 } },
        ],
        responses: {
          200: { description: "Available numbers" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/numbers": {
      get: {
        tags: ["Numbers"],
        summary: "List owned phone numbers",
        security: userAuthSecurity,
        responses: {
          200: { description: "Phone number list" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
      post: {
        tags: ["Numbers"],
        summary: "Buy a phone number",
        security: userAuthSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BuyNumberRequest" },
            },
          },
        },
        responses: {
          201: { description: "Phone number purchased" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/numbers/{phId}": {
      patch: {
        tags: ["Numbers"],
        summary: "Assign or unassign a phone number",
        security: userAuthSecurity,
        parameters: [{ name: "phId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateNumberRequest" },
            },
          },
        },
        responses: {
          200: { description: "Phone number updated" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/calls": {
      get: {
        tags: ["Calls"],
        summary: "List call logs",
        security: userAuthSecurity,
        parameters: [
          { name: "agentId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "direction", in: "query", schema: { type: "string", enum: ["inbound", "outbound"] } },
          { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "limit", in: "query", schema: { type: "integer", maximum: 100, default: 20 } },
          { name: "cursor", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Call log list" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
      post: {
        tags: ["Calls"],
        summary: "Ingest a completed call log",
        description: "Internal-only endpoint for trusted server-to-server call ingestion.",
        security: internalAuthSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CallLogRequest" },
            },
          },
        },
        responses: {
          201: { description: "Call log ingested" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/calls/{callId}": {
      get: {
        tags: ["Calls"],
        summary: "Get a call log",
        security: userAuthSecurity,
        parameters: [{ name: "callId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Call log" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Calls"],
        summary: "Delete a call log",
        security: userAuthSecurity,
        parameters: [{ name: "callId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Call log deleted" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/calls/{callId}/transcripts": {
      get: {
        tags: ["Calls"],
        summary: "List call transcripts",
        security: userAuthSecurity,
        parameters: [
          { name: "callId", in: "path", required: true, schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", maximum: 100, default: 50 } },
          { name: "cursor", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Transcript list" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/kb": {
      get: {
        tags: ["Knowledge Base"],
        summary: "List knowledge sources",
        security: userAuthSecurity,
        parameters: [
          { name: "agentId", in: "query", schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: { description: "Knowledge source list" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
      post: {
        tags: ["Knowledge Base"],
        summary: "Create knowledge sources",
        security: userAuthSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateKbRequest" },
            },
          },
        },
        responses: {
          201: { description: "Knowledge sources created" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/kb/{kbId}": {
      delete: {
        tags: ["Knowledge Base"],
        summary: "Delete a knowledge source",
        security: userAuthSecurity,
        parameters: [{ name: "kbId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Knowledge source deleted" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
  },
};
