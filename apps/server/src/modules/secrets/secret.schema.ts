import { z } from "zod";

export const createSecretSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Secret name is required")
      .max(120, "Secret name must be 120 characters or less")
      .regex(
        /^[A-Za-z0-9_.:-]+$/,
        "Use letters, numbers, dots, underscores, colons, or hyphens"
      ),
    value: z.string().min(1, "Secret value is required"),
  })
  .strip();

export type CreateSecretInput = z.infer<typeof createSecretSchema>;
export type CreateSecretArgs = CreateSecretInput & {
  organizationId: string;
  userId: string | null;
};
