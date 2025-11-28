// Returns a memoized, authenticated API client (Clerk token injected per request)
"use client";
import { useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { createApiClient } from "@scrubin/api-client";

export function useApiClient() {
  const { getToken } = useAuth();

  return useMemo(
    () =>
      createApiClient({
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL as string,
        getToken,
      }),
    [getToken]
  );
}
