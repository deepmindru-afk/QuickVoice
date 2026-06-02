import { StatusCodes } from "http-status-codes";
import { authorized } from "../../middleware/authorize.middleware.js";
import { BadRequestError } from "../../common/errors/badRequest.js";
import * as toolService from "./tool.service.js";

export const listTools = authorized(async (req, res) => {
  const tools = await toolService.listTools(req.auth.activeOrganizationId);
  res.status(StatusCodes.OK).json({ success: true, message: "Tools fetched successfully", data: tools });
});

export const createTool = authorized(async (req, res) => {
  const tool = await toolService.createTool({
    ...req.body,
    organizationId: req.auth.activeOrganizationId,
    userId: req.auth.userId,
  });
  res.status(StatusCodes.CREATED).json({ success: true, message: "Tool created successfully", data: tool });
});

export const updateTool = authorized(async (req, res) => {
  const { toolId } = req.params;
  if (!toolId) throw new BadRequestError("Tool ID is required");
  const tool = await toolService.updateTool(req.auth.activeOrganizationId, toolId, req.body);
  res.status(StatusCodes.OK).json({ success: true, message: "Tool updated successfully", data: tool });
});

export const deleteTool = authorized(async (req, res) => {
  const { toolId } = req.params;
  if (!toolId) throw new BadRequestError("Tool ID is required");
  await toolService.deleteTool(req.auth.activeOrganizationId, toolId);
  res.status(StatusCodes.OK).json({ success: true, message: "Tool deleted successfully", data: null });
});

export const getAgentTools = authorized(async (req, res) => {
  const { agentId } = req.params;
  if (!agentId) throw new BadRequestError("Agent ID is required");
  const tools = await toolService.getAgentTools(req.auth.activeOrganizationId, agentId);
  res.status(StatusCodes.OK).json({ success: true, message: "Agent tools fetched successfully", data: tools });
});

export const attachTool = authorized(async (req, res) => {
  const { toolId, agentId } = req.params;
  if (!toolId || !agentId) throw new BadRequestError("Tool ID and Agent ID are required");
  await toolService.attachTool(req.auth.activeOrganizationId, agentId, toolId);
  res.status(StatusCodes.OK).json({ success: true, message: "Tool attached successfully", data: null });
});

export const detachTool = authorized(async (req, res) => {
  const { toolId, agentId } = req.params;
  if (!toolId || !agentId) throw new BadRequestError("Tool ID and Agent ID are required");
  await toolService.detachTool(req.auth.activeOrganizationId, agentId, toolId);
  res.status(StatusCodes.OK).json({ success: true, message: "Tool detached successfully", data: null });
});
