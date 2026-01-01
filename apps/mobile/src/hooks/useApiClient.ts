import { useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { createApiClient } from '@scrubin/api-client';

export function useApiClient() {
	const { getToken } = useAuth();
	const getTokenRef = useRef(getToken);

	useEffect(() => {
		getTokenRef.current = getToken;
	}, [getToken]);

	return useMemo(
		() =>
			createApiClient({
				baseUrl: process.env.EXPO_PUBLIC_API_URL,
				getToken: () => getTokenRef.current()
			}),
		[]
	);
}
