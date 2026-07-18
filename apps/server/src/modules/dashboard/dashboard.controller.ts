import { authorized } from "../../middleware/authorize.middleware.js";
import { dashboardRangeSchema } from "./dashboard.schema.js";
import * as dashboardService from "./dashboard.service.js";

export const getDashboardSummary = authorized(async (req, res) => {
  const query = dashboardRangeSchema.parse(req.query);
  const summary = await dashboardService.getDashboardSummary({
    organizationId: req.auth.activeOrganizationId,
    range: query.range,
    from: query.from,
    to: query.to,
  });

  res.status(200).json({
    success: true,
    message: "Dashboard summary fetched successfully",
    data: summary,
  });
});
