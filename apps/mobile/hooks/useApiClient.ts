// Returns a memoized, authenticated API client (Clerk token injected per request)
'use client';
import { useMemo } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { createApiClient } from '@scrubin/api-client';

export function useApiClient() {
	const { getToken } = useAuth();

	return useMemo(
		() =>
			createApiClient({
				baseUrl: 'http://localhost:4000',
				getToken
			}),
		[getToken]
	);
}
