import { Router } from "express";

import agentRouter from "./modules/agent/agent.route.js";

const router = Router();

router.use("/agents", agentRouter);

export default router;
