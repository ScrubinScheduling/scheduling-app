import React, { useCallback, useEffect, useState } from 'react';
import EventSource, { EventSourceListener } from 'react-native-sse';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CreateCard from '@/src/components/workspace/CreateWorkspaceCard';
import type { Workspace } from '@scrubin/schemas';
import { useAuth } from '@clerk/clerk-expo';
import { useApiClient, MOBILE_BASE_URL } from '@/src/hooks/useApiClient';
import ErrorCard from '@/src/components/ErrorCard';
import WorkspaceCard from '@/src/components/workspace/WorkspaceCard';
import InvatationCard from '@/src/components/workspace/InvatationInput';

type MyEvent = 'workspace-created';

export default function WorkspacesList() {
	const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	//const [isJoining, setIsJoining] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const apiClient = useApiClient();
	const { getToken, isLoaded, isSignedIn } = useAuth();

	const fetchWorkspaces = useCallback(async () => {
		try {
			setIsLoading(true);
			const list = await apiClient.getWorkspaces();
			setWorkspaces(list);
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Unexpected error');
			console.log(error);
		} finally {
			setIsLoading(false);
		}
	}, [apiClient]);

	const connectSSE = async () => {
		try {
			if (!isLoaded || !isSignedIn) return;
			const token = await getToken();
			const es = new EventSource(`${MOBILE_BASE_URL}/events/stream`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			es.addEventListener('message', (event) => {
				if (!event.data) return;
				const parseData = JSON.parse(event.data);
				if (!parseData) return;

				if (parseData.status === 'open') {
					console.log('Connection Success');
					fetchWorkspaces();
				} else console.log('Connection Unsuccessful');

				if (parseData.type === 'workspace-created') {
					fetchWorkspaces();
				}
			});

			es.addEventListener('error', (event) => {
				// This is for typical HTTP request errors
				if (event.type === 'error') {
					console.log('Connection Error', event.message);
				}

				// This is for internal module errors
				if (event.type === 'exception') {
					console.error('Internal Error:', event.message, event.error);
				}
			});

			es.addEventListener('close', () => {
				es.removeAllEventListeners();
				es.close();
			});

			return () => {
				es.removeAllEventListeners();
				es.close();
			};
		} catch (error) {}
	};

	useEffect(() => {
		let isAlive = true;
		let closeSSE;

		const start = async () => {
			const cleanupFN = await connectSSE();
			if (!isAlive) {
				if (cleanupFN) cleanupFN();
				return;
			}

			closeSSE = cleanupFN;
		};

		start();

		return () => {
			isAlive = false;
			if (closeSSE) closeSSE();
		};
	}, [isSignedIn, isLoaded]);

	return (
		<SafeAreaView style={{ flex: 1 }} className="bg-slate-50">
			<ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
				{/* Header */}
				<View className="mb-6 mt-8">
					<Text className="mb-2 text-4xl font-bold text-slate-900">Workspaces</Text>
					<Text className="text-base text-slate-600">Select a workspace to get started</Text>
				</View>

				<ErrorCard
					visible={error !== null}
					message={error || ''}
					type="error"
					onDismiss={() => setError(null)}
				/>

				<View className="mb-4">
					<InvatationCard />
				</View>

				{/* Workspace Cards */}
				{isLoading ? (
					<ActivityIndicator />
				) : (
					<View className="mb-6 gap-4">
						{workspaces.map((workspace) => (
							<WorkspaceCard key={workspace.id} workspace={workspace} />
						))}
					</View>
				)}
			</ScrollView>
			<View className="px-10 py-4">
				<CreateCard />
			</View>
		</SafeAreaView>
	);
}
