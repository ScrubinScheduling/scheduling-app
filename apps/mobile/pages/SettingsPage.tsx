import { View, Text, Button } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

export default function HomePage() {
	const { signOut } = useAuth();
	return (
		<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
			<Text>Settings!</Text>
			<Button title="Sign out" onPress={() => signOut()} />
		</View>
	);
}
