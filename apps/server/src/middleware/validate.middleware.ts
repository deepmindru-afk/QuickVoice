// ================================
// src/middlewares/validate.middleware.ts
// ================================

import { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

const validate = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };
};
export default validate;
