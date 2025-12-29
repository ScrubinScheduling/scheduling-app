import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import "../../global.css";

export default function RootLayout() {
	return (
		<SafeAreaProvider>
			<ClerkProvider tokenCache={tokenCache}>
				<Slot />
			</ClerkProvider>
		</SafeAreaProvider>
	);
}
