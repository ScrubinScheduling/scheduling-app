import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { router } from 'expo-router';
import { clearLastWorkspaceId } from '../utils/last-workspace';
import { useAuth } from '@clerk/clerk-expo';

export default function WorkSpaceButton() {
	const { userId } = useAuth();
	return (
		<TouchableOpacity
			onPress={() => {
				clearLastWorkspaceId(userId);
				router.replace('/workspaces');
			}}
		>
			<Text>Workspaces</Text>
		</TouchableOpacity>
	);
}
