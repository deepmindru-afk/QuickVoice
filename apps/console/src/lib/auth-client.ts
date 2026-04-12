import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins"
import { apiKeyClient } from "@better-auth/api-key/client"
import { organizationClient } from "better-auth/client/plugins"
import { stripeClient } from "@better-auth/stripe/client"

import { auth } from "../../../server/src/lib/auth";
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
  basePath: `/api/${process.env.NEXT_PUBLIC_API_VERSION! || "v1"}/auth`,
  plugins: [inferAdditionalFields<typeof auth>(), adminClient(), apiKeyClient(), organizationClient({
    dynamicAccessControl: {
      enabled: true,
    }
  }), stripeClient({
    subscription: true //if you want to enable subscription management
  })],
});

export const { signIn, signUp, signOut, useSession } = authClient;

