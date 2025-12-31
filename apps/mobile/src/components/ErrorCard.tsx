import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ErrorCardProps {
	visible: boolean;
	message: string;
	type?: 'error' | 'warning' | 'info';
	onDismiss?: () => void;
	dismissible?: boolean;
}

export default function ErrorCard({
	visible,
	message,
	type = 'error',
	onDismiss,
	dismissible = true
}: ErrorCardProps) {
	const fadeAnim = React.useRef(new Animated.Value(0)).current;

	React.useEffect(() => {
		if (visible) {
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true
			}).start();
		} else {
			Animated.timing(fadeAnim, {
				toValue: 0,
				duration: 200,
				useNativeDriver: true
			}).start();
		}
	}, [visible, fadeAnim]);

	if (!visible) return null;

	const styles = {
		error: {
			container: 'border-red-200 bg-red-50',
			icon: '#dc2626',
			iconName: 'error-outline' as const,
			textColor: 'text-red-900',
			buttonColor: 'text-red-600'
		},
		warning: {
			container: 'border-amber-200 bg-amber-50',
			icon: '#d97706',
			iconName: 'warning-amber' as const,
			textColor: 'text-amber-900',
			buttonColor: 'text-amber-600'
		},
		info: {
			container: 'border-blue-200 bg-blue-50',
			icon: '#2563eb',
			iconName: 'info-outline' as const,
			textColor: 'text-blue-900',
			buttonColor: 'text-blue-600'
		}
	};

	const currentStyle = styles[type];

	return (
		<Animated.View
			style={{
				opacity: fadeAnim,
				transform: [
					{
						translateY: fadeAnim.interpolate({
							inputRange: [0, 1],
							outputRange: [-20, 0]
						})
					}
				]
			}}
			className={`mb-4 flex-row items-start gap-3 rounded-xl border p-4 shadow-sm ${currentStyle.container}`}
		>
			<MaterialIcons
				name={currentStyle.iconName}
				size={20}
				color={currentStyle.icon}
				style={{ marginTop: 2 }}
			/>

			<View className="flex-1">
				<Text className={`text-sm leading-5 ${currentStyle.textColor}`}>{message}</Text>
			</View>

			{dismissible && onDismiss && (
				<TouchableOpacity onPress={onDismiss} className="ml-2">
					<MaterialIcons name="close" size={18} color={currentStyle.icon} />
				</TouchableOpacity>
			)}
		</Animated.View>
	);
}
