import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { createErrorEnvelope, getRequestId } from "./error-envelope.js";

const notFoundMiddleware = (req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json(
    createErrorEnvelope({
      code: "NOT_FOUND",
      message: "Route not found",
      requestId: getRequestId(req),
    })
  );
};

export default notFoundMiddleware;
