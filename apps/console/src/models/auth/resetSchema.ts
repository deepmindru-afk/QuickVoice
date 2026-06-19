import { z } from "zod";

// Zod schema to validate request body
export const resetSchema = z.object({
    token: z.string().min(8, "Token is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
  });
