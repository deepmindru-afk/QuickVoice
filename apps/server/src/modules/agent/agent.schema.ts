import { z } from "zod";

// Agent creation schema
export const createAgentSchema = z.object({
  name: z.string().min(2, "Agent name must be at least 2 characters"),
  isActive: z.boolean(),
  organizationId: z.string().min(10,"Invalid organization ID"),
  userId: z.string().min(10,"Invalid user ID"),
  templateId: z.string().uuid("Invalid template ID").nullable(),
});
export type CreateAgentArgs = z.infer<typeof createAgentSchema>;