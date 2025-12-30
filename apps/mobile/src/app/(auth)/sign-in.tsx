import React, { useCallback, useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useSSO } from '@clerk/clerk-expo';
import {
	View,
	Button,
	Platform,
	TextInput,
	Text,
	Image,
	TouchableOpacity,
	ActivityIndicator
} from 'react-native';
import { router, Link, useRouter, Redirect } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import type { EmailCodeFactor } from '@clerk/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import logo from '../../../assets/logo.png';
import { MaterialIcons, AntDesign, Ionicons } from '@expo/vector-icons';
import OAuthButtons from '@/src/components/OAuthButtons';

// Preloads the browser for Android devices to reduce authentication load time
// See: https://docs.expo.dev/guides/authentication/#improving-user-experience
export const useWarmUpBrowser = () => {
	useEffect(() => {
		if (Platform.OS !== 'android') return;
		void WebBrowser.warmUpAsync();
		return () => {
			// Cleanup: closes browser when component unmounts
			void WebBrowser.coolDownAsync();
		};
	}, []);
};

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

export default function Page() {
	const { signIn, setActive, isLoaded } = useSignIn();
	const router = useRouter();
	const [emailAddress, setEmailAddress] = useState('');
	const [password, setPassword] = useState('');
	const [code, setCode] = useState('');
	const [showEmailCode, setShowEmailCode] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const onSignInPress = useCallback(async () => {
		if (!isLoaded) return;

		// Start the sign-in process using the email and password provided
		try {
			setIsLoading(true);
			const signInAttempt = await signIn.create({
				identifier: emailAddress,
				password
			});

			// If sign-in process is complete, set the created session as active
			// and redirect the user
			if (signInAttempt.status === 'complete') {
				await setActive({
					session: signInAttempt.createdSessionId,
					navigate: async ({ session }) => {
						if (session?.currentTask) {
							// Check for tasks and navigate to custom UI to help users resolve them
							// See https://clerk.com/docs/guides/development/custom-flows/overview#session-tasks
							console.log(session?.currentTask);
							return;
						}

						router.replace('/');
					}
				});
			} else if (signInAttempt.status === 'needs_second_factor') {
				// Check if email_code is a valid second factor
				// This is required when Client Trust is enabled and the user
				// is signing in from a new device.
				// See https://clerk.com/docs/guides/secure/client-trust
				const emailCodeFactor = signInAttempt.supportedFirstFactors?.find(
					(factor): factor is EmailCodeFactor => factor.strategy === 'email_code'
				);

				if (emailCodeFactor) {
					await signIn.prepareFirstFactor({
						strategy: 'email_code',
						emailAddressId: emailCodeFactor.emailAddressId
					});
					setShowEmailCode(true);
				}
			} else {
				// If the status is not complete, check why. User may need to
				// complete further steps.
				console.error(JSON.stringify(signInAttempt, null, 2));
			}
		} catch (err) {
			// See https://clerk.com/docs/guides/development/custom-flows/error-handling
			// for more info on error handling
			console.error(JSON.stringify(err, null, 2));
		} finally {
			setIsLoading(false);
		}
	}, [isLoaded, emailAddress, password]);

	const onVerifyPress = useCallback(async () => {
		if (!isLoaded) return;

		try {
			setIsLoading(true);
			const signInAttempt = await signIn.attemptFirstFactor({
				strategy: 'email_code',
				code
			});

			if (signInAttempt.status === 'complete') {
				await setActive({
					session: signInAttempt.createdSessionId,
					navigate: async ({ session }) => {
						if (session?.currentTask) {
							console.log(session?.currentTask);
							return;
						}

						router.replace('/');
					}
				});
			} else {
				console.error(JSON.stringify(signInAttempt, null, 2));
			}
		} catch (err) {
			console.error(JSON.stringify(err, null, 2));
		} finally {
			setIsLoading(false);
		}
	}, [isLoaded, code]);

	useWarmUpBrowser();

	if (showEmailCode) {
		return (
			<SafeAreaView>
				<View>
					<Text>Verify your email</Text>
					<Text>A verification code has been sent to your email.</Text>
					<TextInput
						value={code}
						placeholder="Enter verification code"
						placeholderTextColor="#666666"
						onChangeText={(code) => setCode(code)}
					/>
					<Button title="Verify" onPress={onVerifyPress} />
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={{ flex: 1 }} className="bg-slate-50">
			<View className="mt-8 w-full flex-1 items-center px-6">
				{/* Header */}
				<View className="mb-8 flex flex-col items-center gap-4">
					<View className="rounded-2xl bg-emerald-600 p-4 shadow-lg">
						<Image source={logo} className="size-12" tintColor="white" />
					</View>
					<Text className="text-5xl font-bold text-slate-900">ScrubIn</Text>
					<Text className="text-base text-slate-600">Staff Portal Access</Text>
				</View>

				{/* Login Card */}
				<View className="w-full max-w-md gap-5 rounded-2xl border border-slate-200 bg-white px-8 py-8 shadow-lg">
					<View className="gap-2">
						<Text className="text-3xl font-bold text-slate-900">Welcome Back</Text>
						<Text className="text-base text-slate-600">Sign in to access your schedule</Text>
					</View>

					{/* Email Input */}
					<View className="gap-2">
						<Text className="text-sm font-medium text-slate-700">Email Address</Text>
						<View className="h-14 flex-row items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3">
							<MaterialIcons name="email" size={20} color="#94a3b8" />
							<TextInput
								className="flex-1 text-base text-slate-900"
								placeholder="your.email@vetclinic.com"
								placeholderTextColor="#94a3b8"
								value={emailAddress}
								onChangeText={setEmailAddress}
								keyboardType="email-address"
								autoCapitalize="none"
							/>
						</View>
					</View>

					{/* Password Input */}
					<View className="gap-2">
						<Text className="text-sm font-medium text-slate-700">Password</Text>
						<View className="h-14 flex-row items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3">
							<MaterialIcons name="lock" size={20} color="#94a3b8" />
							<TextInput
								className="flex-1 text-base text-slate-900"
								placeholder="Enter your password"
								placeholderTextColor="#94a3b8"
								value={password}
								onChangeText={setPassword}
								secureTextEntry={!showPassword}
								autoCapitalize="none"
							/>
							<TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
								<MaterialIcons
									name={showPassword ? 'visibility-off' : 'visibility'}
									size={20}
									color="#94a3b8"
								/>
							</TouchableOpacity>
						</View>
					</View>

					{/* Remember Me & Forgot Password */}
					<View className="flex-row items-center justify-between">
						<View className="flex-row items-center gap-2"></View>
						<TouchableOpacity
							onPress={() => {
								router.push('/sign-up');
							}}
						>
							<Text className="text-sm font-medium text-emerald-600">Dont have an account?</Text>
						</TouchableOpacity>
					</View>

					{/* Login Button */}
					<TouchableOpacity
						onPress={onSignInPress}
						disabled={isLoading}
						className="h-14 flex-row items-center justify-center gap-2 rounded-lg bg-emerald-600 shadow-lg active:bg-emerald-700 disabled:opacity-50"
					>
						{isLoading ? (
							<>
								<ActivityIndicator size="small" color="white" />
								<Text className="text-base font-semibold text-white">Signing in...</Text>
							</>
						) : (
							<>
								<Text className="text-base font-semibold text-white">Sign In</Text>
								<MaterialIcons name="arrow-forward" size={20} color="white" />
							</>
						)}
					</TouchableOpacity>

					{/* Divider */}
					<View className="flex-row items-center gap-4">
						<View className="h-[1px] flex-1 bg-slate-200" />
						<Text className="text-sm text-slate-500">Or continue with</Text>
						<View className="h-[1px] flex-1 bg-slate-200" />
					</View>

					{/* OAuth Buttons */}
					<OAuthButtons />
				</View>

				{/* Security Badge */}
				<View className="mt-6 flex-row items-center gap-2">
					<MaterialIcons name="shield" size={16} color="#94a3b8" />
					<Text className="text-xs text-slate-500">Secured with end-to-end encryption</Text>
				</View>
			</View>
		</SafeAreaView>
	);
}
