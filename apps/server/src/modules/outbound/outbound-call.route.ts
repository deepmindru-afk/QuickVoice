import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { BadRequestError } from "../../common/errors/badRequest.js";
import authMiddleware from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/authorize.middleware.js";
import {
  cancelOutboundCallSchema,
  listOutboundCallsQuerySchema,
  quickOutboundCallSchema,
} from "./outbound-call.schema.js";
import {
  cancelOutboundCall,
  createQuickOutboundCall,
  getOutboundCall,
  listOutboundCalls,
  retryOutboundCall,
} from "./outbound-call.service.js";

type Middleware = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
type CreateQuickOutboundCall = typeof createQuickOutboundCall;
type ListOutboundCalls = typeof listOutboundCalls;
type GetOutboundCall = typeof getOutboundCall;
type CancelOutboundCall = typeof cancelOutboundCall;
type RetryOutboundCall = typeof retryOutboundCall;

type OutboundCallRouterDeps = {
  authMiddleware?: Middleware;
  requireCreatePermission?: Middleware;
  requireReadPermission?: Middleware;
  requireDeletePermission?: Middleware;
  createQuickOutboundCall?: CreateQuickOutboundCall;
  listOutboundCalls?: ListOutboundCalls;
  getOutboundCall?: GetOutboundCall;
  cancelOutboundCall?: CancelOutboundCall;
  retryOutboundCall?: RetryOutboundCall;
};

export function createOutboundCallRouter(deps: OutboundCallRouterDeps = {}) {
  const router = Router();
  const authenticate = deps.authMiddleware ?? authMiddleware;
  const authorizeCreate =
    deps.requireCreatePermission ?? requirePermission({ outboundCalls: ["create"] });
  const authorizeRead =
    deps.requireReadPermission ?? requirePermission({ outboundCalls: ["read"] });
  const authorizeDelete =
    deps.requireDeletePermission ?? requirePermission({ outboundCalls: ["delete"] });
  const dispatchQuickCall = deps.createQuickOutboundCall ?? createQuickOutboundCall;
  const fetchOutboundCalls = deps.listOutboundCalls ?? listOutboundCalls;
  const fetchOutboundCall = deps.getOutboundCall ?? getOutboundCall;
  const cancelOutbound = deps.cancelOutboundCall ?? cancelOutboundCall;
  const retryOutbound = deps.retryOutboundCall ?? retryOutboundCall;

  router.get(
    "/",
    authenticate,
    authorizeRead,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId } = getRequiredAuth(req);
        const query = listOutboundCallsQuerySchema.parse(req.query);
        const data = await fetchOutboundCalls({
          ...query,
          organizationId,
        });

        res.status(StatusCodes.OK).json({
          success: true,
          message: "Outbound calls fetched successfully",
          data,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    "/quick",
    authenticate,
    authorizeCreate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const requestAuth = getRequiredAuth(req);

        const input = quickOutboundCallSchema.parse(req.body);
        const data = await dispatchQuickCall({
          ...input,
          organizationId: requestAuth.organizationId,
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

  router.get(
    "/:outboundId/status",
    authenticate,
    authorizeRead,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId } = getRequiredAuth(req);
        const outboundId = getOutboundId(req);
        const outbound = await fetchOutboundCall({ organizationId, outboundId });

        res.status(StatusCodes.OK).json({
          success: true,
          message: "Outbound call status fetched successfully",
          data: {
            outboundId: outbound.outboundId,
            status: outbound.status,
            failureReason: outbound.failureReason,
            updatedAt: outbound.updatedAt,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    "/:outboundId",
    authenticate,
    authorizeRead,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId } = getRequiredAuth(req);
        const outboundId = getOutboundId(req);
        const data = await fetchOutboundCall({ organizationId, outboundId });

        res.status(StatusCodes.OK).json({
          success: true,
          message: "Outbound call fetched successfully",
          data,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    "/:outboundId/cancel",
    authenticate,
    authorizeDelete,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId, userId } = getRequiredAuth(req);
        const outboundId = getOutboundId(req);
        const input = cancelOutboundCallSchema.parse(req.body ?? {});
        const data = await cancelOutbound({
          organizationId,
          userId,
          outboundId,
          reason: input.reason,
        });

        res.status(StatusCodes.OK).json({
          success: true,
          message: "Outbound call cancelled successfully",
          data,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    "/:outboundId/retry",
    authenticate,
    authorizeCreate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId, userId } = getRequiredAuth(req);
        const outboundId = getOutboundId(req);
        const data = await retryOutbound({
          organizationId,
          userId,
          outboundId,
        });

        res.status(StatusCodes.CREATED).json({
          success: true,
          message: "Outbound call retry dispatched successfully",
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

function getRequiredAuth(req: Request) {
  const requestAuth = req.auth;
  if (!requestAuth?.activeOrganizationId) {
    throw new BadRequestError("Active organization is required");
  }

  return {
    organizationId: requestAuth.activeOrganizationId,
    userId: requestAuth.userId,
  };
}

function getOutboundId(req: Request) {
  const outboundId = req.params.outboundId;
  if (typeof outboundId !== "string" || outboundId.length === 0) {
    throw new BadRequestError("Outbound call id is required");
  }
  return outboundId;
}
