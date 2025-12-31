import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useCallback, useState } from 'react';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSSO } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import * as AuthSession from 'expo-auth-session';

export default function OAuthButtons() {
	// Use the `useSSO()` hook to access the `startSSOFlow()` method
	const { startSSOFlow } = useSSO();
	const [isLoading, setIsLoading] = useState(false);

	const startOAuth = useCallback(
		async (strategy: 'oauth_google' | 'oauth_apple' | 'oauth_microsoft') => {
			try {
				setIsLoading(true);
				const { createdSessionId, setActive } = await startSSOFlow({
					strategy,
					redirectUrl: AuthSession.makeRedirectUri()
				});

				if (createdSessionId) {
					setActive!({
						session: createdSessionId,
						navigate: async () => router.push('/')
					});
				}
			} catch (err) {
				console.error(JSON.stringify(err, null, 2));
			} finally {
				setIsLoading(false);
			}
		},
		[startSSOFlow]
	);

	return (
		<View className="flex-row gap-3">
			<TouchableOpacity
				className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white active:bg-slate-50"
				onPress={() => startOAuth('oauth_google')}
				disabled={isLoading}
			>
				<AntDesign name="google" size={22} color="#059669" />
			</TouchableOpacity>

			<TouchableOpacity
				className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white active:bg-slate-50"
				onPress={() => startOAuth('oauth_apple')}
				disabled={isLoading}
			>
				<MaterialIcons name="apple" size={22} color="#059669" />
			</TouchableOpacity>

			<TouchableOpacity
				className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white active:bg-slate-50"
				onPress={() => startOAuth('oauth_microsoft')}
				disabled={isLoading}
			>
				<Ionicons name="logo-microsoft" size={22} color="#059669" />
			</TouchableOpacity>
		</View>
	);
}
