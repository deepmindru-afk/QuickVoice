import { Router } from "express";

import authMiddleware from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/authorize.middleware.js";
import validate from "../../middleware/validate.middleware.js";
import * as secretController from "./secret.controller.js";
import { createSecretSchema } from "./secret.schema.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requirePermission({ secrets: ["read"] }),
  secretController.listSecrets
);

router.post(
  "/",
  authMiddleware,
  requirePermission({ secrets: ["create"] }),
  validate(createSecretSchema),
  secretController.createSecret
);

router.delete(
  "/:secretId",
  authMiddleware,
  requirePermission({ secrets: ["delete"] }),
  secretController.deleteSecret
);

export default router;
