import { useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { createApiClient } from '@scrubin/api-client';
import { Platform } from 'react-native';

export const MOBILE_BASE_URL =
	Platform.OS === 'android'
		? process.env.EXPO_PUBLIC_API_URL_ANDROID
		: Platform.OS === 'ios'
			? process.env.EXPO_PUBLIC_API_URL_IOS
			: process.env.EXPO_PUBLIC_API_URL;

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
				baseUrl : MOBILE_BASE_URL,
				// Defer token lookup so the client always uses the latest auth state.
				getToken: () => getTokenRef.current()
			}),
		[]
	);
}
