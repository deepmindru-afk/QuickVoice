// Authentication middleware.
//
// Three supported caller types:
//   1. Frontend (cookie)          — better-auth session cookie
//   2. External API (api key)     — "x-api-key" header, mocked into a session
//                                    by apiKey({ enableSessionForAPIKeys: true })
//   3. Internal server-to-server  — "Authorization: Bearer $INTERNAL_API_KEY"
//      TRUST BOUNDARY: internal callers bypass BOTH authentication and
//      authorization. They must pass organizationId explicitly in the request
//      body. Use only for trusted server-to-server calls (webhooks, cron).
//
// On success, attaches `req.auth` with userId / activeOrganizationId /
// authMethod / session so downstream middleware and handlers do not need to
// re-query.

import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { UnauthenticatedError } from "../common/errors/unauthenticated.js";

const API_KEY_HEADER = "x-api-key";

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Internal server-to-server bypass
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const [scheme, token] = authHeader.split(" ");
      if (
        scheme === "Bearer" &&
        token &&
        token === process.env.INTERNAL_API_KEY
      ) {
        // Internal callers must assert who they are acting on behalf of by
        // passing userId and organizationId in the request body. We fail fast
        // here so a malformed call gets a clear 401 instead of a downstream
        // Prisma error caused by an undefined userId.
        const internalUserId = req?.body?.userId || req?.query?.userId;
        const internalOrgId = req?.body?.organizationId || req?.query?.organizationId;

        if (
          typeof internalUserId !== "string" ||
          internalUserId.length === 0 ||
          typeof internalOrgId !== "string" ||
          internalOrgId.length === 0
        ) {
          throw new UnauthenticatedError(
            "Internal calls must provide userId and organizationId in the request body"
          );
        }

        req.auth = {
          userId: internalUserId,
          activeOrganizationId: internalOrgId,
          authMethod: "internal",
          session: null,
        };
        return next();
      }
      // Any other Authorization scheme falls through to getSession(), which
      // handles cookie-based sessions and any alternate schemes better-auth
      // understands.
    }

    // 2. Session auth (cookie OR x-api-key — both routed through getSession)
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      throw new UnauthenticatedError("Unauthorized");
    }

    // 3. Resolve active organization + auth method
    const apiKeyHeaderValue =
      (req.headers[API_KEY_HEADER] as string | undefined) ?? undefined;

    let activeOrganizationId: string | null = null;
    let authMethod: "session" | "apiKey" = "session";

    if (apiKeyHeaderValue) {
      authMethod = "apiKey";
      // Look up the key's metadata to find the org it is scoped to. An API
      // key is permanently bound to one organization via metadata at creation
      // time, so a leaked key cannot cross tenants.
      const verified = await auth.api.verifyApiKey({
        body: { key: apiKeyHeaderValue },
      });

      if (!verified?.valid || !verified.key) {
        throw new UnauthenticatedError("Invalid API key");
      }

      const rawMetadata = (verified.key as { metadata?: unknown }).metadata;
      const metadata =
        typeof rawMetadata === "string"
          ? safeJsonParse(rawMetadata)
          : (rawMetadata as Record<string, unknown> | null | undefined);

      const orgId =
        metadata && typeof metadata === "object"
          ? (metadata as Record<string, unknown>).organizationId
          : undefined;

      activeOrganizationId = typeof orgId === "string" ? orgId : null;
    } else {
      // Cookie / standard session path — use the org the user picked in the UI.
      const sess = (session as { session?: { activeOrganizationId?: string | null } })
        .session;
      activeOrganizationId = sess?.activeOrganizationId ?? null;
    }

    req.auth = {
      userId: (session as { user: { id: string } }).user.id,
      activeOrganizationId,
      authMethod,
      session,
    };

    return next();
  } catch (error) {
    next(error);
  }
};

function safeJsonParse(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export default authMiddleware;
