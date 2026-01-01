import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Workspace } from '@scrubin/schemas';
import { useAuth } from '@clerk/clerk-expo';
import { setLastWorkspaceId } from '@/src/utils/last-workspace';
interface WorkspaceCardProps {
	workspace: Workspace;
}

export default function WorkspaceCard({ workspace }: WorkspaceCardProps) {
	const router = useRouter();
	const { userId } = useAuth();

	const onPress = async () => {
		if (userId) {
			try {
				await setLastWorkspaceId(userId, String(workspace.id));
			} catch (error) {
				console.warn('Failed to persist last workspace id', error);
			}
		}
		router.push(`/workspaces/${workspace.id}/dashboard`);
	};

	return (
		<TouchableOpacity
			onPress={onPress}
			className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm active:bg-slate-50"
		>
			<View className="flex-row items-center justify-between">
				<View className="flex-1">
					<Text className="text-xl font-bold text-slate-900">{workspace.name}</Text>
				</View>
				<MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
			</View>
		</TouchableOpacity>
	);
}
