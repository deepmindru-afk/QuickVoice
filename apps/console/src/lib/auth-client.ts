import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";
import { apiKeyClient } from "@better-auth/api-key/client";
import { organizationClient } from "better-auth/client/plugins";
import { stripeClient } from "@better-auth/stripe/client";
import { API_VERSION, SERVER_URL } from "@/src/lib/links";
import type { auth } from "../../../server/src/lib/auth";

export const authClient = createAuthClient({
  baseURL: SERVER_URL,
  basePath: `/api/${API_VERSION}/auth`,
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
