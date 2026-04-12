import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import * as agentService from "./agent.service.js";
import { ForbiddenError } from "../../common/errors/forbidden.js";

export const createAgent = async (req: Request, res: Response) => {
  if (!req.auth?.activeOrganizationId) {
    throw new ForbiddenError("No active organization for this request");
  }
  console.log(req.auth);
  const agent = await agentService.createAgent({
    ...req.body,
    organizationId: req.auth.activeOrganizationId,
    userId: req.auth.userId,
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Agent created successfully",
    data: agent,
  });
};
