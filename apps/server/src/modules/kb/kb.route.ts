import { Router } from "express";

import authMiddleware from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/authorize.middleware.js";
import validate from "../../middleware/validate.middleware.js";
import * as kbController from "./kb.controller.js";
import { createKbApiSchema } from "./kb.schema.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  requirePermission({ knowledgeSource: ["create"] }),
  validate(createKbApiSchema),
  kbController.createKnowledgeSources
);

router.get(
  "/",
  authMiddleware,
  requirePermission({ knowledgeSource: ["read"] }),
  kbController.listKnowledgeSources
);

router.delete(
  "/:kbId",
  authMiddleware,
  requirePermission({ knowledgeSource: ["delete"] }),
  kbController.deleteKnowledgeSource
);

export default router;
