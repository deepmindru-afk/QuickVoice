import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";
import { apiKeyClient } from "@better-auth/api-key/client";
import { organizationClient } from "better-auth/client/plugins";
import { stripeClient } from "@better-auth/stripe/client";
import type { auth } from "../../../server/src/lib/auth";

const authBaseUrl =
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:5000";
const apiVersion = process.env.NEXT_PUBLIC_API_VERSION ?? "v1";

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
  basePath: `/api/${apiVersion}/auth`,
  plugins: [
    inferAdditionalFields<typeof auth>(),
    adminClient(),
    apiKeyClient(),
    organizationClient({
      dynamicAccessControl: {
        enabled: true,
      },
    }),
    stripeClient({
      subscription: true,
    }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
