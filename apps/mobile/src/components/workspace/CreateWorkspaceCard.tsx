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
				className="rounded-xl bg-emerald-600 p-4 shadow-lg shadow-emerald-900/30 active:bg-emerald-700"
				style={{
					shadowColor: '#064e3b',
					shadowOffset: { width: 0, height: 4 },
					shadowOpacity: 0.3,
					shadowRadius: 8,
					elevation: 8
				}}
			>
				<View className="flex-row items-center justify-center gap-3">
					<View className="rounded-full bg-white p-2 shadow-sm">
						<MaterialIcons name="add" size={24} color="#059669" />
					</View>
					<Text className="text-lg font-semibold text-white">Create New Workspace</Text>
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
