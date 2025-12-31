import { ActivityIndicator } from 'react-native';
import React from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';
export default function ProtectedRoutesLayout() {
	const { isSignedIn, isLoaded } = useAuth();

	if (!isLoaded) return <ActivityIndicator />;
	if (!isSignedIn) return <Redirect href={'/(auth)/sign-in'} />;
	return <Stack screenOptions={{headerShown: false}}/>;
}
