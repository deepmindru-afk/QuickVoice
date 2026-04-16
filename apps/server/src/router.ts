import { Router } from "express";

import agentRouter from "./modules/agent/agent.route.js";
import phoneRouter from "./modules/numbers/phone.route.js";

const router = Router();

router.use("/agents", agentRouter);
router.use("/numbers", phoneRouter);

export default router;
