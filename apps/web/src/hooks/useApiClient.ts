"use client";
import { useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { createApiClient } from "@scrubin/api-client";

export function useApiClient() {
  const { getToken } = useAuth();

  return useMemo(
    () =>
      createApiClient({
        baseUrl: "http://localhost:4000",
        getToken,
      }),
    [getToken]
  );
}
