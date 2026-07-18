import { StatusCodes } from "http-status-codes";

import { BadRequestError } from "../../common/errors/badRequest.js";
import { authorized } from "../../middleware/authorize.middleware.js";
import * as secretService from "./secret.service.js";

const getStringParam = (value: string | string[] | undefined, name: string) => {
  if (!value || Array.isArray(value)) {
    throw new BadRequestError(`${name} is required`);
  }
  return value;
};

export const listSecrets = authorized(async (req, res) => {
  const secrets = await secretService.listSecrets(req.auth.activeOrganizationId);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Secrets fetched successfully",
    data: secrets,
  });
});

export const createSecret = authorized(async (req, res) => {
  const secret = await secretService.createSecret({
    ...req.body,
    organizationId: req.auth.activeOrganizationId,
    userId: req.auth.userId,
  });
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Secret created successfully",
    data: secret,
  });
});

export const deleteSecret = authorized(async (req, res) => {
  const secretId = getStringParam(req.params.secretId, "Secret ID");
  await secretService.deleteSecret(req.auth.activeOrganizationId, secretId);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Secret deleted successfully",
    data: null,
  });
});
