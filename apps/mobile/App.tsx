import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { ClerkProvider, SignedIn, SignedOut, useAuth } from '@clerk/clerk-expo';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';

import EntryPage from './pages/EntryPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import HomePage from './pages/HomePage';
import TabNavigator from '@/navigation/TabNavigator';

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
					<SignedIn>
						<Stack.Navigator>
							<Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
						</Stack.Navigator>
					</SignedIn>

					<SignedOut>
						<Stack.Navigator screenOptions={{ headerShown: false }}>
							<Stack.Screen name="Entry" component={EntryPage} />
							<Stack.Screen name="SignIn" component={SignInPage} />
							<Stack.Screen name="SignUp" component={SignUpPage} />
						</Stack.Navigator>
					</SignedOut>

					<StatusBar style="auto" />
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
