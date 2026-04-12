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

import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { UnauthenticatedError } from "../common/errors/unauthenticated.js";
import { ForbiddenError } from "../common/errors/forbidden.js";

type Permissions = Record<string, string[]>;

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
