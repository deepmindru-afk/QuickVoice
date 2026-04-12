import type { auth } from "../lib/auth.js";

type BetterAuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

export interface RequestAuth {
  userId: string;
  activeOrganizationId: string | null;
  authMethod: "session" | "apiKey" | "internal";
  session: BetterAuthSession;
}

declare module "express-serve-static-core" {
  interface Request {
    auth?: RequestAuth;
  }
}
