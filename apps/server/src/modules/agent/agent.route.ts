import { Router } from "express";

import authMiddleware from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/authorize.middleware.js";
import validate from "../../middleware/validate.middleware.js";
import * as agentController from "./agent.controller.js";
import { createAgentSchema, updateAgentSchema } from "./agent.schema.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  requirePermission({ agent: ["create"] }),
  validate(createAgentSchema),
  agentController.createAgent
);

router.get(
  "/",
  authMiddleware,
  requirePermission({ agent: ["read"] }),
  agentController.getAgents
);

router.patch(
  "/:id",
  authMiddleware,
  requirePermission({ agent: ["update"] }),
  validate(updateAgentSchema),
  agentController.updateAgent
);

export default router;
