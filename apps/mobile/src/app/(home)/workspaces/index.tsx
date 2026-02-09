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
import { useFocusEffect } from 'expo-router';

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

	
	useFocusEffect( 
		useCallback(() => {
			let isAlive = true; // Makes sure that the current page is still rendered
			let es: EventSource;

			const connect = async () => {
				try {
					// Check if your signed in or loaded before you fetch the token
					if (!isSignedIn || !isLoaded) return;
					const token = await getToken();
					if (!isAlive) return;

					es = new EventSource(`${MOBILE_BASE_URL}/events/stream`, {
						headers: {
							Authorization: `Bearer ${token}`
						}
					});

					const eventListener: EventSourceListener = (event) => {
						try {
							if (!event) return;

							if (event.type === 'open') {
								console.log('Established Connection');
								fetchWorkspaces();
							}

							if (event.type === 'message') {
								if (!event.data) return;
								const message = JSON.parse(event.data);
								if (message.type === 'workspace-created') {
									fetchWorkspaces();
								}
							}

							if (event.type === 'error') {
								console.log('Connection failed', event.message);
							}

							if (event.type === 'exception') {
								console.error('Internal Server Error:', event.message, event.error);
								es.removeAllEventListeners();
								es.close();
							}

							if (event.type === 'close') {
								console.log('Connection Closed');
								es.removeAllEventListeners();
								es.close();
							}
						} catch (error) {
							console.log('Internal SSE Error: ', error);
						}
					};

					es.addEventListener('open', eventListener);
					es.addEventListener('message', eventListener);
					es.addEventListener('error', eventListener);
					es.addEventListener('close', eventListener);
				} catch (error) {
					setError('Live Connection Failed');
					console.log(error);
				}
			};

			connect();

			return () => {
				isAlive = false;
				console.log('Connection Closed');
				if (es) es.close();
			};
		}, [isSignedIn, isLoaded])
	);

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
