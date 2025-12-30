import {
	View,
	Text,
	Modal,
	Pressable,
	TouchableOpacity,
	ActivityIndicator,
	TextInput
} from 'react-native';
import React, { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useSignUp } from '@clerk/clerk-expo';
import { router } from 'expo-router';

type ModalProps = {
	email: string;
};

export default function VerificationModal({ email }: ModalProps) {
	const [isLoading, setIsLoading] = useState(false);
	const { isLoaded, signUp, setActive } = useSignUp();
	const [code, setCode] = useState('');

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
	return (
		<Modal
			//visible={visible}
			transparent={true}
			animationType="fade"
			//onRequestClose={onClose}
		>
			{/* Backdrop */}
			<Pressable
				className="flex-1 bg-black/50"
				//onPress={onClose}
			>
				{/* Modal Content */}
				<View className="flex-1 items-center justify-center px-6">
					<Pressable className="w-full max-w-md" onPress={(e) => e.stopPropagation()}>
						{/* Close Button */}
						<View className="mb-4 items-end">
							<TouchableOpacity
								//onPress={onclose}
								className="size-10 items-center justify-center rounded-full bg-white shadow-lg"
							>
								<MaterialIcons name="close" size={24} color="#475569" />
							</TouchableOpacity>
						</View>

						{/* Main Card */}
						<View className="gap-6 rounded-3xl border border-slate-200 bg-white px-8 py-8 shadow-2xl">
							{/* Icon & Header */}
							<View className="items-center gap-4">
								<View className="size-20 items-center justify-center rounded-full bg-emerald-100">
									<MaterialIcons name="mark-email-read" size={40} color="#059669" />
								</View>
								<View className="items-center gap-2">
									<Text className="text-center text-2xl font-bold text-slate-900">
										Check Your Email
									</Text>
									<Text className="text-center text-sm text-slate-600">
										We've sent a verification code to{'\n'}
										<Text className="font-semibold text-slate-900">
											{email || 'your.email@vetclinic.com'}
										</Text>
									</Text>
								</View>
							</View>

							{/* Code Input */}
							<View className="gap-2">
								<Text className="text-sm font-medium text-slate-700">Verification Code</Text>
								<View className="h-16 flex-row items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4">
									<MaterialIcons name="lock-outline" size={20} color="#94a3b8" />
									<TextInput
										className="flex-1 text-center text-2xl font-semibold tracking-widest text-slate-900"
										placeholder="000000"
										placeholderTextColor="#cbd5e1"
										value={code}
										onChangeText={setCode}
										keyboardType="number-pad"
										maxLength={6}
										autoFocus
									/>
								</View>
								<Text className="text-xs text-slate-500">
									Enter the 6-digit code sent to your email
								</Text>
							</View>

							{/* Verify Button */}
							<TouchableOpacity
								onPress={onVerifyPress}
								disabled={isLoading || code.length !== 6}
								className="h-14 flex-row items-center justify-center gap-2 rounded-lg bg-emerald-600 shadow-lg active:bg-emerald-700 disabled:opacity-50"
							>
								{isLoading ? (
									<>
										<ActivityIndicator size="small" color="white" />
										<Text className="text-base font-semibold text-white">Verifying...</Text>
									</>
								) : (
									<>
										<Text className="text-base font-semibold text-white">Verify Email</Text>
										<MaterialIcons name="check-circle" size={20} color="white" />
									</>
								)}
							</TouchableOpacity>

							{/* Resend Section */}
							<View className="flex-row items-center justify-center gap-1">
								<Text className="text-sm text-slate-600">Didn't receive the code?</Text>
								<TouchableOpacity /*onPress={handleResend}*/>
									<Text className="text-sm font-medium text-emerald-600">Resend</Text>
								</TouchableOpacity>
							</View>

							{/* Info Box */}
							<View className="gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
								<View className="flex-row gap-3">
									<MaterialIcons name="info" size={20} color="#2563eb" style={{ marginTop: 2 }} />
									<View className="flex-1">
										<Text className="text-xs leading-5 text-blue-700">
											The code will expire in 10 minutes. Check your spam folder if you don't see
											the email.
										</Text>
									</View>
								</View>
							</View>
						</View>
					</Pressable>
				</View>
			</Pressable>
		</Modal>
	);
}
