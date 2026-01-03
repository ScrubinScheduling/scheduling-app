import React, { useCallback, useEffect, useState } from 'react';
import {
	View,
	Text,
	ScrollView,
	ActivityIndicator,
	TouchableOpacity,
	TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CreateCard from '@/src/components/workspace/CreateWorkspaceCard';
import type { Workspace } from '@scrubin/schemas';
import { useApiClient } from '@/src/hooks/useApiClient';
import ErrorCard from '@/src/components/ErrorCard';
import WorkspaceCard from '@/src/components/workspace/WorkspaceCard';

export default function WorkspacesList() {
	const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isJoining, setIsJoining] = useState(false);
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
	}, [fetchWorkspaces]);

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
					<View className="rounded-xl bg-white p-4 shadow-sm">
						<Text className="mb-3 text-sm font-semibold text-slate-700">Join via Invitation</Text>
						<View className="flex-row gap-2">
							<View className="flex-1">
								<TextInput
									//value={invitationUrl}
									//onChangeText={(text) => setInvitationUrl(text)}
									placeholder="Paste invitation URL here..."
									className="h-11 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400"
									//editable={!isJoining}
								/>
							</View>
							<TouchableOpacity
								//onPress={handleJoinWorkspace}
								//disabled={isJoining || !invitationUrl.trim()}
								className="h-11 justify-center rounded-lg bg-emerald-600 px-6 disabled:opacity-50"
							>
								{isJoining ? (
									<ActivityIndicator size="small" color="#ffffff" />
								) : (
									<Text className="font-semibold text-white">Add</Text>
								)}
							</TouchableOpacity>
						</View>
					</View>
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
			<View className='px-10 py-4'>
				<CreateCard />
			</View>
		</SafeAreaView>
	);
}
