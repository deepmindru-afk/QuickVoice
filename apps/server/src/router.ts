import { Router } from "express";

import agentRouter from "./modules/agent/agent.route.js";
import calllogRouter from "./modules/calllogs/calllog.route.js";
import dashboardRouter from "./modules/dashboard/dashboard.route.js";
import kbRouter from "./modules/kb/kb.route.js";
import phoneRouter from "./modules/numbers/phone.route.js";
import outboundCallRouter from "./modules/outbound/outbound-call.route.js";
import toolRouter from "./modules/tools/tool.route.js";
import mcpRouter from "./modules/mcp/mcp.route.js";
import secretRouter from "./modules/secrets/secret.route.js";

const router = Router();

router.use("/agents", agentRouter);
router.use("/numbers", phoneRouter);
router.use("/calls", calllogRouter);
router.use("/dashboard", dashboardRouter);
router.use("/kb", kbRouter);
router.use("/outbound-calls", outboundCallRouter);
router.use("/tools", toolRouter);
router.use("/mcp", mcpRouter);
router.use("/secrets", secretRouter);

export default router;
