"use client";

import { useEffect, useState } from "react";

import { authClient } from "@/src/lib/auth-client";

interface PermissionApi {
  hasPermission?: (input: {
    organizationId: string;
    permissions: Record<string, string[]>;
  }) => Promise<{
    data: boolean | { success?: boolean } | null;
    error: { message?: string } | null;
  }>;
}

export function useCanEndLiveCalls(organizationId: string) {
  const [canEnd, setCanEnd] = useState(false);

  useEffect(() => {
    let disposed = false;
    const permissionApi = authClient.organization as unknown as PermissionApi;
    if (!permissionApi.hasPermission) return;

    void permissionApi
      .hasPermission({
        organizationId,
        permissions: { callLogs: ["delete"] },
      })
      .then(({ data, error }) => {
        if (disposed || error) return;
        const permissionResult = data;
        setCanEnd(
          permissionResult === true ||
            (typeof permissionResult === "object" &&
              permissionResult?.success === true)
        );
      })
      .catch(() => {
        if (!disposed) setCanEnd(false);
      });

    return () => {
      disposed = true;
    };
  }, [organizationId]);

  return canEnd;
}
