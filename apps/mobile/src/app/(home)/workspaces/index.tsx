import { SignOutButton } from '@/src/components/auth/SignOutButton';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-expo';
import { Link, Redirect } from 'expo-router';
import { Text, View } from 'react-native';

export default function Page() {
	const { user } = useUser();

	return (
		<View>
			<SignedIn>
				<Text>Hello {user?.emailAddresses[0].emailAddress}</Text>
				<SignOutButton />
			</SignedIn>
			<SignedOut>
				<Redirect href={'/(auth)/sign-in'} />
			</SignedOut>
		</View>
	);
}
