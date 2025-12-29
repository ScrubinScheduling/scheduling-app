import React, { useCallback, useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useSSO } from '@clerk/clerk-expo';
import { View, Button, Platform, TextInput, Text } from 'react-native';
import { router, Link, useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import type { EmailCodeFactor } from '@clerk/types';

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

	const onSignInPress = useCallback(async () => {
		if (!isLoaded) return;

		// Start the sign-in process using the email and password provided
		try {
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
		}
	}, [isLoaded, emailAddress, password]);

	const onVerifyPress = useCallback(async () => {
		if (!isLoaded) return;

		try {
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
		}
	}, [isLoaded, code]);

	useWarmUpBrowser();

	// Use the `useSSO()` hook to access the `startSSOFlow()` method
	const { startSSOFlow } = useSSO();

	const onPress = useCallback(async () => {
		try {
			// Start the authentication process by calling `startSSOFlow()`
			const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
				strategy: 'oauth_google',
				// For web, defaults to current path
				// For native, you must pass a scheme, like AuthSession.makeRedirectUri({ scheme, path })
				// For more info, see https://docs.expo.dev/versions/latest/sdk/auth-session/#authsessionmakeredirecturioptions
				redirectUrl: AuthSession.makeRedirectUri()
			});

			// If sign in was successful, set the active session
			if (createdSessionId) {
				setActive!({
					session: createdSessionId,
					// Check for session tasks and navigate to custom UI to help users resolve them
					// See https://clerk.com/docs/guides/development/custom-flows/overview#session-tasks
					navigate: async ({ session }) => {
						if (session?.currentTask) {
							console.log(session?.currentTask);
							router.push('/sign-in/tasks');
							return;
						}

						router.push('/');
					}
				});
			} else {
				// If there is no `createdSessionId`,
				// there are missing requirements, such as MFA
				// See https://clerk.com/docs/guides/development/custom-flows/authentication/oauth-connections#handle-missing-requirements
			}
		} catch (err) {
			// See https://clerk.com/docs/guides/development/custom-flows/error-handling
			// for more info on error handling
			console.error(JSON.stringify(err, null, 2));
		}
	}, []);

	if (showEmailCode) {
		return (
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
		);
	}

	return (
		<View>
			<View>
				<Text>Sign in</Text>
				<TextInput
					autoCapitalize="none"
					value={emailAddress}
					placeholder="Enter email"
					placeholderTextColor="#666666"
					onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
				/>
				<TextInput
					value={password}
					placeholder="Enter password"
					placeholderTextColor="#666666"
					secureTextEntry={true}
					onChangeText={(password) => setPassword(password)}
				/>
				<Button title="Sign in" onPress={onSignInPress} />
				<View style={{ flexDirection: 'row', gap: 4 }}>
					<Text>Don't have an account?</Text>
					<Link href="/sign-up">
						<Text>Sign up</Text>
					</Link>
				</View>
			</View>

			<View>
				<Button title="Sign in with Google" onPress={onPress} />
			</View>
		</View>
	);
}
