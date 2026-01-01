import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import WorkspaceModal from './WorkspaceModal';
import { useApiClient } from '@/src/hooks/useApiClient';

export default function CreateCard() {
	const apiClient = useApiClient();
	const [isModalVisible, setIsModalVisible] = useState(false);
	const handleCreateWorkspace = async (name: string, location: string) => {
		await apiClient.createWorkspace({ name, location });
	};

	return (
		<>
			<TouchableOpacity
				onPress={() => setIsModalVisible(true)}
				className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-5 active:bg-emerald-100"
			>
				<View className="flex-row items-center justify-center gap-3">
					<View className="rounded-full bg-emerald-600 p-2">
						<MaterialIcons name="add" size={24} color="white" />
					</View>
					<Text className="text-lg font-semibold text-emerald-700">Create New Workspace</Text>
				</View>
			</TouchableOpacity>

			<WorkspaceModal
				visible={isModalVisible}
				onClose={() => setIsModalVisible(false)}
				onSubmit={handleCreateWorkspace}
			/>
		</>
	);
}
