import { z } from "zod";

export const BATCH_TEMPLATE_BASE_COLUMNS = [
  "phone_number",
  "language",
  "voice_id",
  "first_message",
  "prompt",
] as const;

export function buildBatchTemplateHeader(variableNames: string[] = []) {
  return [...BATCH_TEMPLATE_BASE_COLUMNS, ...uniqueColumns(variableNames)].join(",");
}

export function buildBatchTemplateCsv(variableNames: string[] = []) {
  return `${buildBatchTemplateHeader(variableNames)}\n`;
}

export const BATCH_TEMPLATE_HEADER = buildBatchTemplateHeader();

function uniqueColumns(values: string[]) {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

export const batchCampaignSchema = z
  .object({
    name: z.string().trim().min(1, "Campaign name is required"),
    agentId: z.string().uuid(),
    fromNumber: z.string().min(10, "From number must be at least 10 digits"),
    file: z.instanceof(File),
    scheduleMode: z.enum(["instant", "later"]),
    scheduledAt: z.string().optional(),
    timezone: z.string().default("UTC"),
    ringingTimeoutSeconds: z.coerce.number().int().min(10).max(180),
  })
  .superRefine((data, ctx) => {
    if (data.scheduleMode === "later" && !data.scheduledAt) {
      ctx.addIssue({
        path: ["scheduledAt"],
        code: z.ZodIssueCode.custom,
        message: "Schedule time is required",
      });
    }
  });

export type BatchCampaignFormInput = z.infer<typeof batchCampaignSchema>;
