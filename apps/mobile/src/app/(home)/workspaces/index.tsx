import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WorkspaceCard from '@/src/components/workspace/WorkSpaceCard';
import CreateCard from '@/src/components/workspace/CreateCard';
import type { Workspace } from "@scrubin/schemas";

export default function WorkspacesList() {
	// Sample data
	const workspaces: Workspace[] = [
		{
			id: 1,
			name: 'Main Clinic',
			adminId: 'asdjfklasfsa',
			location: 'sadfjklasjflksjfla'
		}
	];

	return (
		<SafeAreaView style={{ flex: 1 }} className="bg-slate-50">
			<ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
				{/* Header */}
				<View className="mb-6 mt-8">
					<Text className="mb-2 text-4xl font-bold text-slate-900">Workspaces</Text>
					<Text className="text-base text-slate-600">Select a workspace to get started</Text>
				</View>

				{/* Create Workspace Card */}
				<View className="mb-4">
					<CreateCard />
				</View>

				{/* Workspace Cards */}
				<View className="mb-6 gap-4">
					{workspaces.map((workspace) => (
						<WorkspaceCard key={workspace.id} workspace={workspace} />
					))}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
