import { View, Text, ActivityIndicator } from 'react-native';
import React from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';
export default function _layout() {
	const { isSignedIn, isLoaded } = useAuth();

	if (!isLoaded) return <ActivityIndicator />;
	if (!isSignedIn) return <Redirect href={'/(auth)/sign-in'} />;
	return <Stack />;
}
