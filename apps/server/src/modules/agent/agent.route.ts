import { Router } from "express";

import authMiddleware from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/authorize.middleware.js";
import validate from "../../middleware/validate.middleware.js";
import * as agentController from "./agent.controller.js";
import { createAgentSchema } from "./agent.schema.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  requirePermission({ agent: ["create"] }),
  validate(createAgentSchema),
  agentController.createAgent
);

export default router;
