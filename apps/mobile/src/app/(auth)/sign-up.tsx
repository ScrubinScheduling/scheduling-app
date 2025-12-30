import * as React from 'react';
import {
	ActivityIndicator,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	Image,
	ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignUp } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import logo from '../../../assets/logo.png';
import { useState } from 'react';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function SignUpScreen() {
	const { isLoaded, signUp, setActive } = useSignUp();
	const router = useRouter();

	const [emailAddress, setEmailAddress] = React.useState('');
	const [password, setPassword] = React.useState('');
	const [pendingVerification, setPendingVerification] = React.useState(false);
	const [code, setCode] = React.useState('');

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	// Handle submission of sign-up form
	const onSignUpPress = async () => {
		if (!isLoaded) return;

		console.log(emailAddress, password);

		// Start sign-up process using email and password provided
		try {
			await signUp.create({
				emailAddress,
				password
			});

			// Send user an email with verification code
			await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

			// Set 'pendingVerification' to true to display second form
			// and capture code
			setPendingVerification(true);
		} catch (err) {
			// See https://clerk.com/docs/guides/development/custom-flows/error-handling
			// for more info on error handling
			console.error(JSON.stringify(err, null, 2));
		}
	};

	// Handle submission of verification form
	const onVerifyPress = async () => {
		if (!isLoaded) return;

		try {
			// Use the code the user provided to attempt verification
			const signUpAttempt = await signUp.attemptEmailAddressVerification({
				code
			});

			// If verification was completed, set the session to active
			// and redirect the user
			if (signUpAttempt.status === 'complete') {
				await setActive({ session: signUpAttempt.createdSessionId });
				router.replace('/');
			} else {
				// If the status is not complete, check why. User may need to
				// complete further steps.
				console.error(JSON.stringify(signUpAttempt, null, 2));
			}
		} catch (err) {
			// See https://clerk.com/docs/guides/development/custom-flows/error-handling
			// for more info on error handling
			console.error(JSON.stringify(err, null, 2));
		}
	};

	if (pendingVerification) {
		return (
			<>
				<Text>Verify your email</Text>
				<TextInput
					value={code}
					placeholder="Enter your verification code"
					onChangeText={(code) => setCode(code)}
				/>
				<TouchableOpacity onPress={onVerifyPress}>
					<Text>Verify</Text>
				</TouchableOpacity>
			</>
		);
	}

	return (
		<SafeAreaView style={{ flex: 1 }} className="bg-slate-50">
			<ScrollView showsVerticalScrollIndicator={false}>
				<View className="mt-8 w-full flex-1 items-center px-6">
					{/* Header */}
					<View className="mb-8 flex flex-col items-center gap-4">
						<View className="rounded-2xl bg-emerald-600 p-4 shadow-lg">
							<Image source={logo} className="size-12" tintColor="white" />
						</View>
						<Text className="text-5xl font-bold text-slate-900">ScrubIn</Text>
						<Text className="text-base text-slate-600">Staff Portal Access</Text>
					</View>

					{/* Signup Card */}
					<View className="w-full max-w-md gap-5 rounded-2xl border border-slate-200 bg-white px-8 py-8 shadow-lg">
						<View className="gap-2">
							<Text className="text-3xl font-bold text-slate-900">Create Account</Text>
							<Text className="text-base text-slate-600">Sign up to get started</Text>
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
									placeholder="Create a password"
									placeholderTextColor="#94a3b8"
									value={password}
									onChangeText={setPassword}
									secureTextEntry={!showPassword}
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

						{/* Confirm Password Input */}
						<View className="gap-2">
							<Text className="text-sm font-medium text-slate-700">Confirm Password</Text>
							<View className="h-14 flex-row items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3">
								<MaterialIcons name="lock" size={20} color="#94a3b8" />
								<TextInput
									className="flex-1 text-base text-slate-900"
									placeholder="Confirm your password"
									placeholderTextColor="#94a3b8"
									value={confirmPassword}
									onChangeText={setConfirmPassword}
									secureTextEntry={!showConfirmPassword}
								/>
								<TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
									<MaterialIcons
										name={showConfirmPassword ? 'visibility-off' : 'visibility'}
										size={20}
										color="#94a3b8"
									/>
								</TouchableOpacity>
							</View>
						</View>

						{/* Sign Up Button */}
						<TouchableOpacity
							onPress={onSignUpPress}
							disabled={isLoading}
							className="h-14 flex-row items-center justify-center gap-2 rounded-lg bg-emerald-600 shadow-lg active:bg-emerald-700 disabled:opacity-50"
						>
							{isLoading ? (
								<>
									<ActivityIndicator size="small" color="white" />
									<Text className="text-base font-semibold text-white">Creating account...</Text>
								</>
							) : (
								<>
									<Text className="text-base font-semibold text-white">Create Account</Text>
									<MaterialIcons name="arrow-forward" size={20} color="white" />
								</>
							)}
						</TouchableOpacity>

						{/* Footer */}
						<View className="flex-row items-center justify-center">
							<TouchableOpacity
								onPress={() => {
									router.back();
								}}
							>
								<Text className="text-sm font-medium text-emerald-600">
									Already have an account?
								</Text>
							</TouchableOpacity>
						</View>

						{/* Divider */}
						<View className="flex-row items-center gap-4">
							<View className="h-[1px] flex-1 bg-slate-200" />
							<Text className="text-sm text-slate-500">Or continue with</Text>
							<View className="h-[1px] flex-1 bg-slate-200" />
						</View>

						{/* OAuth Buttons */}
						<View className="flex-row gap-3">
							<TouchableOpacity
								className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white active:bg-slate-50"
								//onPress={() => startOAuth('oauth_google')}
							>
								<AntDesign name="google" size={22} color="#059669" />
							</TouchableOpacity>

							<TouchableOpacity
								className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white active:bg-slate-50"
								//onPress={() => startOAuth('oauth_apple')}
							>
								<MaterialIcons name="apple" size={22} color="#059669" />
							</TouchableOpacity>

							<TouchableOpacity
								className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white active:bg-slate-50"
								//onPress={() => startOAuth('oauth_microsoft')}
							>
								<Ionicons name="logo-microsoft" size={22} color="#059669" />
							</TouchableOpacity>
						</View>
					</View>

					{/* Security Badge */}
					<View className="mt-6 flex-row items-center gap-2">
						<MaterialIcons name="shield" size={16} color="#94a3b8" />
						<Text className="text-xs text-slate-500">Secured with end-to-end encryption</Text>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
