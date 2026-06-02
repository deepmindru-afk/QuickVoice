import { StatusCodes } from "http-status-codes";
import { authorized } from "../../middleware/authorize.middleware.js";
import { BadRequestError } from "../../common/errors/badRequest.js";
import * as toolService from "./tool.service.js";

const getStringParam = (value: string | string[] | undefined, name: string) => {
  if (!value || Array.isArray(value)) {
    throw new BadRequestError(`${name} is required`);
  }
  return value;
};

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
  const toolId = getStringParam(req.params.toolId, "Tool ID");
  const tool = await toolService.updateTool(req.auth.activeOrganizationId, toolId, req.body);
  res.status(StatusCodes.OK).json({ success: true, message: "Tool updated successfully", data: tool });
});

export const deleteTool = authorized(async (req, res) => {
  const toolId = getStringParam(req.params.toolId, "Tool ID");
  await toolService.deleteTool(req.auth.activeOrganizationId, toolId);
  res.status(StatusCodes.OK).json({ success: true, message: "Tool deleted successfully", data: null });
});

export const getAgentTools = authorized(async (req, res) => {
  const agentId = getStringParam(req.params.agentId, "Agent ID");
  const tools = await toolService.getAgentTools(req.auth.activeOrganizationId, agentId);
  res.status(StatusCodes.OK).json({ success: true, message: "Agent tools fetched successfully", data: tools });
});

export const attachTool = authorized(async (req, res) => {
  const toolId = getStringParam(req.params.toolId, "Tool ID");
  const agentId = getStringParam(req.params.agentId, "Agent ID");
  await toolService.attachTool(req.auth.activeOrganizationId, agentId, toolId);
  res.status(StatusCodes.OK).json({ success: true, message: "Tool attached successfully", data: null });
});

export const detachTool = authorized(async (req, res) => {
  const toolId = getStringParam(req.params.toolId, "Tool ID");
  const agentId = getStringParam(req.params.agentId, "Agent ID");
  await toolService.detachTool(req.auth.activeOrganizationId, agentId, toolId);
  res.status(StatusCodes.OK).json({ success: true, message: "Tool detached successfully", data: null });
});
