import * as SecureStore from 'expo-secure-store';

// Namespaces the cached workspace id by user.
const key = (userId: string) => `lastWorkspaceId_${userId}`;

// Fetch the last workspace id for this user.
export async function getLastWorkspaceId(userId: string) {
	return SecureStore.getItemAsync(key(userId));
}

// Persist the last workspace id for this user.
export async function setLastWorkspaceId(userId: string, id: string) {
	return SecureStore.setItemAsync(key(userId), id);
}

// Clear the cached workspace id for this user.
export async function clearLastWorkspaceId(userId: string) {
	return SecureStore.deleteItemAsync(key(userId));
}
