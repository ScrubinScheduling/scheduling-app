import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { ClerkProvider, SignedIn, SignedOut, useAuth } from '@clerk/clerk-expo';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

const Stack = createNativeStackNavigator();

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
				<NavigationContainer>
				<View style={styles.container}>
					<SignedIn>
						<Stack.Navigator>
							<Stack.Screen name="Home" component={HomePage} />
							<Text>Signed in</Text>
							<AuthDebug />
						</Stack.Navigator>
					</SignedIn>
					<SignedOut>
						<Stack.Navigator>
							<Stack.Screen name="Login" component={LoginPage} />
							<Text>
								You're signed out. Add <Text style={{ fontWeight: 'bold' }}>SignIn</Text> flow here.
							</Text>
						</Stack.Navigator>
					</SignedOut>
					<StatusBar style="auto" />
				</View>
				</NavigationContainer>
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
