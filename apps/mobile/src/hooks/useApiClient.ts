import { useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { createApiClient } from '@scrubin/api-client';

export function useApiClient() {
	const { getToken } = useAuth();
	const getTokenRef = useRef(getToken);

	// Keep the latest getToken function without recreating the client.
	useEffect(() => {
		getTokenRef.current = getToken;
	}, [getToken]);

	return useMemo(
		() =>
			createApiClient({
				baseUrl: process.env.EXPO_PUBLIC_API_URL,
				// Defer token lookup so the client always uses the latest auth state.
				getToken: () => getTokenRef.current()
			}),
		[]
	);
}
