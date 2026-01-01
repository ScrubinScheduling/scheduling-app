import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CreateCard from '@/src/components/workspace/CreateWorkspaceCard';
import type { Workspace } from '@scrubin/schemas';
import { useApiClient } from '@/src/hooks/useApiClient';
import ErrorCard from '@/src/components/ErrorCard';
import WorkspaceCard from '@/src/components/workspace/WorkSpaceCard';

export default function WorkspacesList() {
	const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const apiClient = useApiClient();

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

	useEffect(() => {
		fetchWorkspaces();
	}, []);

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

				{/* Create Workspace Card */}
				<View className="mb-4">
					<CreateCard />
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
		</SafeAreaView>
	);
}
