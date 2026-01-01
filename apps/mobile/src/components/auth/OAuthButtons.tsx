import { View, TouchableOpacity } from 'react-native';
import React, { useCallback, useState } from 'react';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { isClerkRuntimeError, useSSO } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import { getClerkErrorMessage, logAuthError } from '@/src/utils/error-handler';
import ErrorCard from '../ErrorCard';

export default function OAuthButtons() {
	const { startSSOFlow } = useSSO();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const startOAuth = useCallback(
		async (strategy: 'oauth_google' | 'oauth_apple' | 'oauth_microsoft') => {
			setError(null);
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
				const msg =
					isClerkRuntimeError(err) && err.code === 'network_error'
						? 'Network error. Please try again.'
						: getClerkErrorMessage(err);
				setError(msg);

				logAuthError('OAuth', err);
			} finally {
				setIsLoading(false);
			}
		},
		[startSSOFlow]
	);

	return (
		<View className="gap-3">
			<ErrorCard
				visible={error !== null}
				message={error || ''}
				type="error"
				onDismiss={() => setError(null)}
			/>
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
		</View>
	);
}
