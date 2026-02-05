import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { useApiClient } from '@/src/hooks/useApiClient';

export default function InvatationCard() {
	const [error, setError] = useState<string | null>(null);
	const [invatationCode, setInvatationCode] = useState<string>('');
	const [invatationURL, setInvatationURL] = useState<string>('');
	const [isJoining, setIsJoining] = useState(false);
	const [showInviteModal, setInviteModal] = useState(false);
	const apiClient = useApiClient();

	const extractCodeFromURL = () => {
		try {
			// Break grab code from URL
			// Eg. http://localhost:3000/invatations/<code>
			const url = new URL(invatationURL);
			const pathParts = url.pathname.split('/').filter(Boolean);
			const code = pathParts.pop();

			if (!code) {
				setError('No code found');
				return;
			}

			setInvatationCode(code);
		} catch (error) {
			setError('Invalid URL provided');
			console.log(error);
		}
	};

	const handleInvatation = async () => {
		try {
			if (!invatationCode) return;
			setIsJoining(true);
			extractCodeFromURL();

			const workspaceData = await apiClient.getInvitation(invatationCode);
		} catch (error) {
			console.log(error);
		} finally {
			setIsJoining(false);
		}
	};

	return (
		<View className="rounded-xl bg-white p-4 shadow-sm">
			<Text className="mb-3 text-sm font-semibold text-slate-700">Join via Invitation</Text>
			{error != null ? <Text className="text-sm font-bold color-red-500">{error}</Text> : <></>}
			<View className="flex-row gap-2">
				<View className="flex-1">
					<TextInput
						value={invatationURL}
						onChangeText={(text) => {
							setInvatationURL(text);
							setError(null);
						}}
						placeholder="Paste invitation URL here..."
						className="h-11 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400"
						editable={!isJoining}
					/>
				</View>
				<TouchableOpacity
					onPress={extractCodeFromURL}
					disabled={isJoining || !invatationURL.trim()}
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
	);
}
