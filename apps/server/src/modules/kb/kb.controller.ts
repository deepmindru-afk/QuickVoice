import { StatusCodes } from "http-status-codes";

import { BadRequestError } from "../../common/errors/badRequest.js";
import { authorized } from "../../middleware/authorize.middleware.js";
import * as kbService from "./kb.service.js";
import { listKbQuerySchema } from "./kb.schema.js";

export const createKnowledgeSources = authorized(async (req, res) => {
  const sources = await kbService.createKnowledgeSources(req.body);
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Knowledge sources created",
    data: sources,
  });
});

export const listKnowledgeSources = authorized(async (req, res) => {
  const query = listKbQuerySchema.parse(req.query);
  const sources = await kbService.listKnowledgeSources({
    ...query,
    organizationId: req.auth.activeOrganizationId,
  });
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Knowledge sources fetched successfully",
    data: sources,
  });
});

export const deleteKnowledgeSource = authorized(async (req, res) => {
  const kbId = req.params.kbId;
  if (typeof kbId !== "string" || kbId.length === 0) {
    throw new BadRequestError("Knowledge source id is required");
  }
  await kbService.deleteKnowledgeSource(req.auth.activeOrganizationId, kbId);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Knowledge source deleted successfully",
  });
});
