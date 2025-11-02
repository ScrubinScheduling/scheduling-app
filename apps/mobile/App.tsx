import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ClerkProvider, SignedIn, SignedOut, useAuth } from '@clerk/clerk-expo';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';

const tokenCache = {
	async getToken(key: string) {
		try {
			return await SecureStore.getItemAsync(key);
		} catch (err) {
			return null;
		}
	},
	async saveToken(key: string, value: string) {
		try {
			await SecureStore.setItemAsync(key, value);
		} catch (err) {}
	}
};

function AuthDebug() {
	const { signOut } = useAuth();
	return <Button title="Sign out" onPress={() => signOut()} />;
}

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY as string;

export default function App() {
	return (
		<GluestackUIProvider mode="dark">
			<ClerkProvider publishableKey={PUBLISHABLE_KEY} tokenCache={tokenCache}>
				<View style={styles.container}>
					<SignedIn>
						<Text>Signed in</Text>
						<AuthDebug />
					</SignedIn>
					<SignedOut>
						<Text>
							You're signed out. Add <Text style={{ fontWeight: 'bold' }}>SignIn</Text> flow here.
						</Text>
					</SignedOut>
					<StatusBar style="auto" />
				</View>
			</ClerkProvider>
		</GluestackUIProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center'
	}
});
