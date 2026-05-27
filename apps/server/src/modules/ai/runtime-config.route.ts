import { Router } from "express";
import type { NextFunction, Request, Response } from "express";

import { resolveAgentRuntimeConfig } from "./runtime-config.service.js";

type RuntimeConfigResolver = typeof resolveAgentRuntimeConfig;

type RuntimeConfigRouterDeps = {
  resolveAgentRuntimeConfig?: RuntimeConfigResolver;
};

export function createRuntimeConfigRouter(deps: RuntimeConfigRouterDeps = {}) {
  const router = Router();
  const resolveRuntimeConfig =
    deps.resolveAgentRuntimeConfig ?? resolveAgentRuntimeConfig;

  router.get(
    "/runtime-config",
    requireInternalApiKey,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await resolveRuntimeConfig({
          agentId: getQueryString(req.query.agentId),
          phoneNumber: getQueryString(req.query.phoneNumber),
        });

        res.status(200).json({
          success: true,
          message: "Agent runtime configuration fetched successfully",
          data,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

function requireInternalApiKey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const expected = process.env.INTERNAL_API_KEY;
  const bearer = getBearerToken(req.headers.authorization);

  if (!expected || bearer !== expected) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  return next();
}

function getBearerToken(value: string | undefined) {
  const match = value?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

function getQueryString(value: unknown) {
  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value)) return getQueryString(value[0]);
  return null;
}

export default createRuntimeConfigRouter();
