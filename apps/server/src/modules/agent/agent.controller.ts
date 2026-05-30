import { StatusCodes } from "http-status-codes";

import * as agentService from "./agent.service.js";
import { BadRequestError } from "../../common/errors/badRequest.js";
import { authorized } from "../../middleware/authorize.middleware.js";

export const createAgent = authorized(async (req, res) => {
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
});

export const getAgents = authorized(async (req, res) => {
  const agents = await agentService.getAgents(req.auth.activeOrganizationId);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Agents fetched successfully",
    data: agents,
  });
});

export const updateAgent = authorized(async (req, res) => {
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
});


export const configureAgent = authorized(async (req, res) => {
  const agentId = req.params.agentId;
  if (typeof agentId !== "string" || agentId.length === 0) {
    throw new BadRequestError("Agent id is required");
  }

  const configuration = await agentService.configureAgent({
    ...req.body,
    agentId,
    organizationId: req.auth.activeOrganizationId,
    userId: req.auth.userId,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Agent configured successfully",
    data: configuration,
  });
});

export const getAgentConfig = authorized(async (req, res) => {
  const agentId = req.params.agentId;
  if (typeof agentId !== "string" || agentId.length === 0) {
    throw new BadRequestError("Agent id is required");
  }

  const configuration = await agentService.getAgentConfig(
    req.auth.activeOrganizationId,
    agentId
  );

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Agent configuration fetched successfully",
    data: configuration,
  });
});

export const getAgentConfigByNumber = authorized(async (req, res) => {
  const phoneNumber = req.params.phoneNumber;
  if (typeof phoneNumber !== "string" || phoneNumber.length === 0) {
    throw new BadRequestError("Phone number is required");
  }

  const configuration = await agentService.getAgentConfigByNumber(phoneNumber);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Agent configuration fetched successfully",
    data: configuration,
  });
});
