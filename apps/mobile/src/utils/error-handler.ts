export function getClerkErrorMessage(error: any): string {
	// Check for network errors first
	if (error?.code === 'network_error') {
		return 'Network error. Please check your connection and try again.';
	}

	// Handle Clerk-specific error structure
	if (error?.errors && Array.isArray(error.errors)) {
		const firstError = error.errors[0];

		// Map common Clerk error codes to user-friendly messages
		const errorMessages: Record<string, string> = {
			form_password_pwned: 'This password is too common. Please choose a more secure password.',
			form_password_length_too_short: 'Password must be at least 8 characters long.',
			form_identifier_exists: 'An account with this email already exists.',
			form_password_validation_failed: 'Password must contain uppercase, lowercase, and numbers.',
			form_param_format_invalid: 'Please enter a valid email address.',
			session_exists: 'You are already signed in.',
			form_identifier_not_found: 'No account found with this email address.',
			form_password_incorrect: 'Incorrect password. Please try again.'
		};

		if (firstError.code && errorMessages[firstError.code]) {
			return errorMessages[firstError.code];
		}

		// Fallback to the message from Clerk
		if (firstError.longMessage) {
			return firstError.longMessage;
		}

		if (firstError.message) {
			return firstError.message;
		}
	}

	// Handle generic error message
	if (error?.message) {
		return error.message;
	}

	// Default fallback
	return 'An unexpected error occurred. Please try again.';
}

export function logAuthError(context: string, err: unknown) {
	if (!__DEV__) return;
	const e = err as { code?: string; status?: number; name?: string };
	console.warn(`[auth] ${context} failed`, {
		code: e?.code,
		status: e?.status,
		name: e?.name
	});
}