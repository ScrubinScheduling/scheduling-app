import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
	Entry: undefined;
	SignIn: undefined;
	SignUp: undefined;
	Home: undefined;
};

type EntryPageNavigationProp = StackNavigationProp<RootStackParamList, 'Entry'>;

type Props = {
	navigation: EntryPageNavigationProp;
};

export default function EntryPage({ navigation }: Props) {
	return (
		<View style={styles.container}>
			<View style={styles.topContainer}>
				<Text style={[styles.title, { color: '#fff', fontSize: 56 }]}>Scrubez</Text>
			</View>
			<View style={styles.bottomContainer}>
				<View style={styles.topBottomContainer}>
					<Text style={styles.title}>Welcome</Text>
					<Text style={styles.subtitle}>
						An all in one scheduling app, easy and simple, specifically designed for vet clinics
					</Text>
				</View>

				<View style={styles.bottomBottomContainer}>
					<TouchableOpacity style={styles.button} onPress={() => navigation.navigate('SignIn')}>
						<Text style={styles.buttonText}>Get Started</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'flex-end',
		alignItems: 'center',
		backgroundColor: '#3f37c9'
	},
	topContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
		height: '60%'
	},
	bottomContainer: {
		width: '100%',
		height: '40%',
		justifyContent: 'flex-start',
		alignItems: 'center',
		padding: 20,
		backgroundColor: '#fff'
	},
	topBottomContainer: {
		height: '50%',
		width: '100%',
		paddingTop: 20,
		justifyContent: 'flex-start',
		alignItems: 'flex-start'
	},
	bottomBottomContainer: {
		height: '50%',
		width: '100%',
		paddingBottom: 20,
		justifyContent: 'flex-end',
		alignItems: 'flex-end'
	},
	title: {
		fontSize: 32,
		fontWeight: 'bold',
		color: 'black',
		marginBottom: 10
	},
	subtitle: {
		fontSize: 16,
		color: '#b3b3b3',
		marginBottom: 40,
		textAlign: 'left'
	},
	button: {
		backgroundColor: '#f72485',
		paddingHorizontal: 30,
		paddingVertical: 15,
		borderRadius: 10
	},
	buttonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '600'
	}
});
