import type { InngestFunction } from "inngest";

import { inngest } from "../config/inngest.js";
import { runRetention } from "../modules/retention/retention.service.js";

export const dataRetention: InngestFunction.Any = inngest.createFunction(
  {
    id: "data-retention",
    retries: 1,
    triggers: { cron: "TZ=UTC 0 3 * * *" },
  },
  async ({ step }) => {
    return step.run("apply-retention-policies", () => runRetention());
  }
);
