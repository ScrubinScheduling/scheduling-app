import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Workspace } from '@scrubin/schemas';

interface WorkspaceCardProps {
	workspace: Workspace;
}

export default function WorkspaceCard({ workspace }: WorkspaceCardProps) {
	const router = useRouter();

	return (
		<TouchableOpacity
			onPress={() => router.push(`/workspaces/${workspace.id}/dashboard`)}
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
