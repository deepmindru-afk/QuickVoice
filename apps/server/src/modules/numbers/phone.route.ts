import { Router } from "express";

import authMiddleware from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/authorize.middleware.js";
import validate from "../../middleware/validate.middleware.js";
import * as phoneController from "./phone.controller.js";
import { buyNumberSchema, updateNumberSchema } from "./phone.schema.js";

const router = Router();

// Search is proxied to the provider and does not write. Gated on `create`
// since search is only useful when preceding a purchase.
router.get(
  "/search",
  authMiddleware,
  requirePermission({ phoneNumber: ["create"] }),
  phoneController.searchNumbers
);

router.get(
  "/",
  authMiddleware,
  requirePermission({ phoneNumber: ["read"] }),
  phoneController.listNumbers
);

router.post(
  "/",
  authMiddleware,
  requirePermission({ phoneNumber: ["create"] }),
  validate(buyNumberSchema),
  phoneController.buyNumber
);

router.patch(
  "/:phId",
  authMiddleware,
  requirePermission({ phoneNumber: ["update"] }),
  validate(updateNumberSchema),
  phoneController.updateNumber
);

// router.delete(
//   "/:phId",
//   authMiddleware,
//   requirePermission({ phoneNumber: ["delete"] }),
//   phoneController.deleteNumber
// );

export default router;
