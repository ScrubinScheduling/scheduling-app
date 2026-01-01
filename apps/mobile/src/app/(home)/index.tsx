import { clearLastWorkspaceId, getLastWorkspaceId } from '@/src/utils/last-workspace';
import { useApiClient } from '@/src/hooks/useApiClient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
export default function Index() {
	const { isLoaded, isSignedIn, userId } = useAuth();
	const router = useRouter();
	const apiClient = useApiClient();

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

			if (!last) {
				router.replace('/workspaces');
				return;
			}

			try {
				await apiClient.getWorkspace(last);
				router.replace(`/workspaces/${last}/dashboard`);
			} catch (err: any) {
				if (err?.status === 403 || err?.status === 404) {
					await clearLastWorkspaceId(userId);
				}
				router.replace('/workspaces');
			}
		})();

		return () => {
			alive = false;
		};
	}, [isLoaded, isSignedIn, userId, router, apiClient]);

	return null;
}
