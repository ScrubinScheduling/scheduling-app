import { Text } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

export default function DashBoard() {
	const { id } = useLocalSearchParams<{ id?: string | string[] }>();
	if (!id) return null;
	return (
		<SafeAreaView className="flex-1">
			<Text>User Side Page {id}</Text>
		</SafeAreaView>
	);
}
