import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	Alert,
	Image,
	TouchableWithoutFeedback,
	Keyboard
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSignUp, useSSO } from '@clerk/clerk-expo';
import { ActivityIndicator } from 'react-native-paper';

// used ai to implement sign up

type RootStackParamList = {
	Entry: undefined;
	SignIn: undefined;
	SignUp: undefined;
	Home: undefined;
};

type SignUpPageNavigationProp = StackNavigationProp<RootStackParamList, 'SignUp'>;

type Props = {
	navigation: SignUpPageNavigationProp;
};

export default function SignUpPage({ navigation }: Props) {
	const { isLoaded, signUp, setActive } = useSignUp();
	const { startSSOFlow } = useSSO();
	const [emailAddress, setEmailAddress] = useState('');
	const [password, setPassword] = useState('');
	const [firstName, setFirstName] = useState('');
	const [role, setRole] = useState('');
	const [code, setCode] = useState('');
	const [loading, setLoading] = useState<string | null>(null);

	const onSignUpPress = async () => {
		if (!isLoaded) return;

		try {
			const signUpAttempt = await signUp.create({
				emailAddress,
				password,
				firstName
			});

			if (signUpAttempt.status === 'complete') {
				await setActive({ session: signUpAttempt.createdSessionId });
			} else {
				console.error(JSON.stringify(signUpAttempt, null, 2));
				Alert.alert('Error', 'Sign up failed. Please try again.');
			}
		} catch (err) {
			console.error(JSON.stringify(err, null, 2));
			Alert.alert('Error', err.errors?.[0]?.message || 'Something went wrong');
		}
	};

	const onSocialSignUp = async (strategy: 'oauth_google') => {
		if (!isLoaded) return;

		setLoading(strategy);
		try {
			const { createdSessionId, setActive } = await startSSOFlow({
				strategy
			});

			if (createdSessionId) {
				await setActive!({ session: createdSessionId });
			}
		} catch (err) {
			console.error(JSON.stringify(err, null, 2));
			Alert.alert('Error', err.errors?.[0]?.message || `Failed to sign up with ${strategy}`);
		} finally {
			setLoading(null);
		}
	};

	const availableProviders = [{ id: 'oauth_google', name: 'Google' }];

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			<View style={styles.container}>
				<View style={styles.imageContainer}>
					<Image
						style={{ height: '67.5%', width: '29%', transform: [{ scaleX: -1 }] }}
						source={require('assets/signup-page.png')}
					/>
				</View>
				<View style={styles.signUpContainer}>
					<Text style={styles.title}>Sign Up</Text>
					<TextInput
						style={styles.input}
						placeholder="Full Name"
						placeholderTextColor="#b3b3b3"
						value={firstName}
						onChangeText={setFirstName}
						autoCapitalize="words"
					/>
					<TextInput
						style={styles.input}
						placeholder="Role"
						placeholderTextColor="#b3b3b3"
						value={role}
						onChangeText={setRole}
					/>
					<TextInput
						style={styles.input}
						placeholder="Email"
						placeholderTextColor="#b3b3b3"
						value={emailAddress}
						onChangeText={setEmailAddress}
						autoCapitalize="none"
						keyboardType="email-address"
					/>
					<TextInput
						style={styles.input}
						placeholder="Password"
						placeholderTextColor="#b3b3b3"
						value={password}
						onChangeText={setPassword}
						secureTextEntry
					/>

					<TouchableOpacity style={styles.primaryButton} onPress={onSignUpPress}>
						<Text style={styles.primaryButtonText}>Register</Text>
					</TouchableOpacity>

					<View style={styles.socialContainer}>
						<Text style={styles.socialText}>Or sign up with</Text>

						{availableProviders.map((provider) => (
							<TouchableOpacity
								style={styles.socialButton}
								key={provider.id}
								onPress={() => onSocialSignUp('oauth_google')}
								disabled={!!loading}
							>
								{loading === provider.id ? (
									<ActivityIndicator color="#fff" />
								) : (
									<Text style={styles.socialButtonText}>{provider.name}</Text>
								)}
							</TouchableOpacity>
						))}
					</View>

					<View style={styles.footer}>
						<Text style={styles.footerText}>Have an account already? </Text>
						<TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
							<Text style={styles.footerLink}>Sign In</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</TouchableWithoutFeedback>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'flex-end',
		backgroundColor: '#3f37c9'
	},
	imageContainer: {
		height: '19%',
		alignItems: 'center',
		justifyContent: 'flex-end'
	},
	signUpContainer: {
		height: '81%',
		backgroundColor: '#fff',
		padding: 20,
		paddingTop: 40,
		borderTopLeftRadius: 30,
		borderTopRightRadius: 30
	},
	title: {
		fontSize: 32,
		fontWeight: 'bold',
		color: 'black',
		marginBottom: 30,
		textAlign: 'center'
	},
	input: {
		backgroundColor: '#fff',
		color: 'black',
		borderColor: '#b3b3b3',
		borderWidth: 1,
		padding: 15,
		borderRadius: 10,
		marginBottom: 15,
		fontSize: 16
	},
	primaryButton: {
		backgroundColor: '#f72485',
		padding: 15,
		borderRadius: 10,
		alignItems: 'center',
		marginBottom: 30
	},
	primaryButtonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '600'
	},
	socialContainer: {
		alignItems: 'center',
		marginBottom: 30
	},
	socialText: {
		color: '#b3b3b3',
		marginBottom: 15
	},
	socialButton: {
		backgroundColor: '#333',
		padding: 12,
		borderRadius: 10,
		width: '100%',
		alignItems: 'center',
		marginBottom: 10
	},
	socialButtonText: {
		color: '#fff',
		fontSize: 16
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'center'
	},
	footerText: {
		color: 'black'
	},
	footerLink: {
		color: '#f72485',
		fontWeight: '600'
	},
	subtitle: {
		fontSize: 16,
		color: '#888',
		marginBottom: 20,
		textAlign: 'center'
	}
});
