import { z } from "zod";

export const quickCallSchema = z.object({
  agentId: z.string().uuid(),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  fromNumber: z.string().min(10, "From number must be at least 10 digits"),
  firstMessage: z.string().optional(),
  systemPrompt: z.string().optional(),
  username: z.string().optional(),
  dynamicVariables: z.record(z.string(), z.string()).optional(),
});

export type QuickCallInput = z.infer<typeof quickCallSchema>;
