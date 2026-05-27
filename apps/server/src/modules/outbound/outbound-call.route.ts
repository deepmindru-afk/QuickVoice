import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { BadRequestError } from "../../common/errors/badRequest.js";
import authMiddleware from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/authorize.middleware.js";
import { quickOutboundCallSchema } from "./outbound-call.schema.js";
import { createQuickOutboundCall } from "./outbound-call.service.js";

type Middleware = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
type CreateQuickOutboundCall = typeof createQuickOutboundCall;

type OutboundCallRouterDeps = {
  authMiddleware?: Middleware;
  requireCreatePermission?: Middleware;
  createQuickOutboundCall?: CreateQuickOutboundCall;
};

export function createOutboundCallRouter(deps: OutboundCallRouterDeps = {}) {
  const router = Router();
  const authenticate = deps.authMiddleware ?? authMiddleware;
  const authorize =
    deps.requireCreatePermission ?? requirePermission({ outboundCalls: ["create"] });
  const dispatchQuickCall = deps.createQuickOutboundCall ?? createQuickOutboundCall;

  router.post(
    "/quick",
    authenticate,
    authorize,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const requestAuth = req.auth;
        if (!requestAuth?.activeOrganizationId) {
          throw new BadRequestError("Active organization is required");
        }

        const input = quickOutboundCallSchema.parse(req.body);
        const data = await dispatchQuickCall({
          ...input,
          organizationId: requestAuth.activeOrganizationId,
          userId: requestAuth.userId,
        });

        res.status(StatusCodes.CREATED).json({
          success: true,
          message: "Outbound call dispatched successfully",
          data,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

export default createOutboundCallRouter();
