import { auth } from '@clerk/nextjs/server';
import { createApiClient } from '@scrubin/api-client';

export async function getServerApiClient() {
  const { getToken } = await auth();
  return createApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000',
    getToken: async () => (await getToken?.()) ?? undefined
  });
}
