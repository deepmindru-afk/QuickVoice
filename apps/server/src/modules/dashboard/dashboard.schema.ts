import { z } from "zod";

const MAX_CUSTOM_RANGE_DAYS = 90;

export const dashboardRangeSchema = z
  .object({
    range: z.enum(["24h", "7d", "30d", "custom"]).default("7d"),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.range !== "custom") return;

    if (!value.from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["from"],
        message: "Custom dashboard range requires a from date",
      });
    }

    if (!value.to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message: "Custom dashboard range requires a to date",
      });
    }

    if (!value.from || !value.to) return;

    if (value.to < value.from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message: "Custom dashboard range to date must be after from date",
      });
    }

    const days = Math.ceil(
      (value.to.getTime() - value.from.getTime()) / (24 * 60 * 60 * 1000)
    ) + 1;

    if (days > MAX_CUSTOM_RANGE_DAYS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message: `Custom dashboard range cannot exceed ${MAX_CUSTOM_RANGE_DAYS} days`,
      });
    }
  });

export type DashboardSummaryQuery = z.infer<typeof dashboardRangeSchema>;
export type DashboardRange = DashboardSummaryQuery["range"];
export type DashboardSummaryArgs = {
  organizationId: string;
  range: DashboardRange;
  from?: Date;
  to?: Date;
};
