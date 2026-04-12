import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import * as agentService from "./agent.service.js";
import { ForbiddenError } from "../../common/errors/forbidden.js";
import { BadRequestError } from "../../common/errors/badRequest.js";

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

export const getAgents = async (req: Request, res: Response) => {
  if (!req.auth?.activeOrganizationId) {
    throw new ForbiddenError("No active organization for this request");
  }
  const agents = await agentService.getAgents(req.auth.activeOrganizationId);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Agents fetched successfully",
    data: agents,
  });
};

export const updateAgent = async (req: Request, res: Response) => {
  if (!req.auth?.activeOrganizationId) {
    throw new ForbiddenError("No active organization for this request");
  }
  const agentId = req.params.id;
  if (typeof agentId !== "string" || agentId.length === 0) {
    throw new BadRequestError("Agent id is required");
  }
  const agent = await agentService.updateAgent(
    req.auth.activeOrganizationId,
    agentId,
    req.body
  );
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Agent updated successfully",
    data: agent,
  });
};