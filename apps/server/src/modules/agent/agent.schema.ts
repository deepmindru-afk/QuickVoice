import { z } from "zod";

// Agent creation schema — organizationId and userId are NOT accepted from the
// client. They are injected server-side from req.auth by the controller so
// that clients cannot target another organization.
export const createAgentSchema = z.object({
  name: z.string().min(2, "Agent name must be at least 2 characters"),
  isActive: z.boolean(),
  templateId: z.string().uuid("Invalid template ID").nullable(),
});
export type CreateAgentInput = z.infer<typeof createAgentSchema>;

// Arguments passed into the service layer (request input + server-supplied
// organization / user context).
export type CreateAgentArgs = CreateAgentInput & {
  organizationId: string;
  userId: string;
};
