import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { getLastWorkspaceId } from '@/src/utils/last-workspace';

export default function Index() {
	const { isLoaded, isSignedIn, userId } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoaded) return;

		if (!isSignedIn || !userId) {
			router.replace('/workspaces');
			return;
		}

		let alive = true;
		(async () => {
			const last = await getLastWorkspaceId(userId);
			if (!alive) return;
			router.replace(last ? `/workspaces/${last}/dashboard` : '/workspaces');
		})();

		return () => {
			alive = false;
		};
	}, [isLoaded, isSignedIn, userId, router]);

	return null;
}
