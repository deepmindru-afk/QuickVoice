// Authorization middleware factory.
//
// Usage:
//   router.post(
//     "/",
//     authMiddleware,
//     requirePermission({ agent: ["create"] }),
//     validate(schema),
//     controller.handler,
//   );
//
// Evaluates permissions against the user's role in req.auth.activeOrganizationId
// via better-auth's hasPermission API. Internal callers (authMethod = "internal")
// bypass the check entirely per the trust-boundary policy in auth.middleware.ts.

import { Request, Response, NextFunction, RequestHandler } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { UnauthenticatedError } from "../common/errors/unauthenticated.js";
import { ForbiddenError } from "../common/errors/forbidden.js";
import type { RequestAuth } from "../types/express.js";

type Permissions = Record<string, string[]>;

// Request type after `requirePermission` has run: `auth` is non-optional and
// `activeOrganizationId` is guaranteed to be a string. The guarantee holds
// because:
//   - session / apiKey flow: requirePermission throws ForbiddenError if
//     activeOrganizationId is null.
//   - internal flow: auth.middleware.ts rejects the request if internalOrgId
//     is not a non-empty string before populating req.auth.
export type AuthorizedRequest = Request & {
  auth: RequestAuth & { activeOrganizationId: string };
};

type AuthorizedHandler = (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
) => Promise<unknown> | unknown;

// Wrap a handler that runs behind `requirePermission` so it sees a narrowed
// request type and doesn't need to re-check `activeOrganizationId`. Only use
// this on routes where `requirePermission` is in the middleware chain.
export const authorized =
  (handler: AuthorizedHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(handler(req as AuthorizedRequest, res, next)).catch(next);

export const requirePermission =
  (permissions: Permissions) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        throw new UnauthenticatedError("Unauthorized");
      }

      // Trusted server-to-server caller — skip authorization entirely.
      if (req.auth.authMethod === "internal") {
        return next();
      }

      if (!req.auth.activeOrganizationId) {
        throw new ForbiddenError("No active organization for this request");
      }

      const result = await auth.api.hasPermission({
        headers: fromNodeHeaders(req.headers),
        body: {
          organizationId: req.auth.activeOrganizationId,
          permissions,
        },
      });

      if (!result?.success) {
        throw new ForbiddenError("Insufficient permissions");
      }

      return next();
    } catch (error) {
      next(error);
    }
  };

export default requirePermission;
