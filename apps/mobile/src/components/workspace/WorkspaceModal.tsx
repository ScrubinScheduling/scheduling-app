import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	Modal,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ErrorCard from '../ErrorCard';

interface CreateWorkspaceModalProps {
	visible: boolean;
	onClose: () => void;
	onSubmit: (name: string, location: string) => void | Promise<void>;
}

export default function WorkspaceModal({ visible, onClose, onSubmit }: CreateWorkspaceModalProps) {
	const [name, setName] = useState('');
	const [location, setLocation] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleCreateWorkspace = async () => {
		if (!name.trim() || !location.trim()) return;

		try {
			setIsLoading(true);
			await onSubmit(name, location);

			setName('');
			setLocation('');
			onClose();
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Unexpected error');
			console.error('Error creating workspace:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		if (!isLoading) {
			setName('');
			setLocation('');
			onClose();
		}
	};

	const isValid = name.trim().length > 0 && location.trim().length > 0;

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={handleClose}
			statusBarTranslucent
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				className="flex-1"
			>
				{/* Backdrop */}
				<TouchableOpacity activeOpacity={1} onPress={handleClose} className="flex-1 bg-black/50">
					{/* Modal Content */}
					<View className="flex-1 items-center justify-center px-6">
						<TouchableOpacity
							activeOpacity={1}
							onPress={(e) => e.stopPropagation()}
							className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl"
						>
							<ScrollView showsVerticalScrollIndicator={false}>
								{/* Header */}
								<View className="border-b border-slate-200 px-6 py-5">
									<View className="mb-2 flex-row items-center justify-between">
										<Text className="text-2xl font-bold text-slate-900">
											Create a New Workspace
										</Text>
										<TouchableOpacity
											onPress={handleClose}
											disabled={isLoading}
											className="rounded-lg p-1 active:bg-slate-100"
										>
											<MaterialIcons name="close" size={24} color="#64748b" />
										</TouchableOpacity>
									</View>
									<Text className="text-sm text-slate-600">
										Set up a new workspace for your team.
									</Text>
								</View>

								{/* Error */}
								<View className="px-6 py-2">
									<ErrorCard
										visible={error !== null}
										message={error || ''}
										type="error"
										onDismiss={() => setError(null)}
									/>
								</View>

								{/* Form */}
								<View className="gap-4 px-6 py-4">
									{/* Workspace Name */}
									<View className="gap-2">
										<Text className="text-sm font-medium text-slate-700">Workspace Name</Text>
										<View className="h-12 flex-row items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3">
											<MaterialIcons name="business" size={20} color="#94a3b8" />
											<TextInput
												className="flex-1 text-base text-slate-900"
												placeholder="Enter workspace name"
												placeholderTextColor="#94a3b8"
												value={name}
												onChangeText={(e) => {
													setName(e);
													setError(null);
												}}
												editable={!isLoading}
											/>
										</View>
									</View>

									{/* Location */}
									<View className="gap-2">
										<Text className="text-sm font-medium text-slate-700">Location</Text>
										<View className="h-12 flex-row items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3">
											<MaterialIcons name="location-on" size={20} color="#94a3b8" />
											<TextInput
												className="flex-1 text-base text-slate-900"
												placeholder="Enter location"
												placeholderTextColor="#94a3b8"
												value={location}
												onChangeText={(e) => {
													setLocation(e);
													setError(null);
												}}
												editable={!isLoading}
											/>
										</View>
									</View>
								</View>

								{/* Footer */}
								<View className="flex-row gap-3 border-t border-slate-200 px-6 py-4">
									<TouchableOpacity
										onPress={handleClose}
										disabled={isLoading}
										className="flex-1 rounded-lg border border-slate-300 bg-white py-3 active:bg-slate-50 disabled:opacity-50"
									>
										<Text className="text-center text-base font-semibold text-slate-700">
											Cancel
										</Text>
									</TouchableOpacity>

									<TouchableOpacity
										onPress={handleCreateWorkspace}
										disabled={!isValid || isLoading}
										className="flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 shadow-lg active:bg-emerald-700 disabled:opacity-50"
									>
										{isLoading ? (
											<>
												<ActivityIndicator size="small" color="white" />
												<Text className="text-base font-semibold text-white">Creating...</Text>
											</>
										) : (
											<Text className="text-base font-semibold text-white">Create</Text>
										)}
									</TouchableOpacity>
								</View>
							</ScrollView>
						</TouchableOpacity>
					</View>
				</TouchableOpacity>
			</KeyboardAvoidingView>
		</Modal>
	);
}
