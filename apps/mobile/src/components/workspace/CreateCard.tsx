import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CreateCard() {
	const router = useRouter();

	return (
		<TouchableOpacity
			onPress={() => router.push('/workspaces/create')}
			className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-5 active:bg-emerald-100"
		>
			<View className="flex-row items-center justify-center gap-3">
				<View className="rounded-full bg-emerald-600 p-2">
					<MaterialIcons name="add" size={24} color="white" />
				</View>
				<Text className="text-lg font-semibold text-emerald-700">Create New Workspace</Text>
			</View>
		</TouchableOpacity>
	);
}
