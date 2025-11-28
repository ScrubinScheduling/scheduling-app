import React from 'react';
import { Dimensions } from 'react-native';
import { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

type Shift = {
	day: string;
	role: string;
	tag: string;
	time: string;
	location: string;
};

const dummyShifts = {
	shifts: [
		{
			day: 'Monday',
			role: 'Vet Tech',
			tag: 'Morning',
			time: '8am - 4pm',
			location: '3315 Fairlight Drive'
		},
		{
			day: 'Wednesday',
			role: 'Groomer',
			tag: 'Stay Late',
			time: '10am - 8pm',
			location: 'Circle Drive South'
		}
	]
};

const ShiftCard = ({
	shift,
	isSelected,
	onPress
}: {
	shift: Shift;
	isSelected: boolean;
	onPress: () => void;
}) => (
	<TouchableOpacity onPress={onPress}>
		<View style={[styles.shiftContainer, isSelected && { backgroundColor: '#f72485' }]}>
			<Image
				style={{ height: 40, width: 40, borderRadius: '50%' }}
				source={require('assets/example-vet.png')}
			/>
			<View style={styles.shiftTextContainer}>
				<View style={styles.shiftRowTextContainer}>
					<Text style={styles.standardText}>{shift.day}</Text>
					<View style={styles.shiftButtonLeft}>
						<Text style={[styles.standardText, { fontSize: 10, fontWeight: 'normal' }]}>
							{shift.role}
						</Text>
					</View>
					<View style={styles.shiftButtonRight}>
						<Text style={[styles.standardText, { fontSize: 10, fontWeight: 'normal' }]}>
							{shift.tag}
						</Text>
					</View>
				</View>
				<View style={styles.shiftRowTextContainer}>
					<View style={styles.shiftRowTextContainer}>
						<Ionicons name="time-outline" size={12} color="#fff" />
						<Text style={[styles.standardText, { fontWeight: 'normal' }]}>{shift.time}</Text>
					</View>
					<View style={styles.shiftRowTextContainer}>
						<Ionicons name="location-outline" size={12} color="#fff" />
						<Text style={[styles.standardText, { fontWeight: 'normal' }]}>{shift.location}</Text>
					</View>
				</View>
			</View>
		</View>
	</TouchableOpacity>
);

export default function ViewShiftPage() {
	const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

	return (
		<View style={styles.background}>
			<View style={styles.header}>
				<Text style={styles.title}>Available Requests</Text>
			</View>
			<ScrollView contentContainerStyle={styles.scrollContainer}>
				{dummyShifts.shifts.map((shift, idx) => (
					<ShiftCard
						key={idx}
						shift={shift}
						isSelected={selectedShift === shift}
						onPress={() => setSelectedShift(shift)}
					/>
				))}
			</ScrollView>
			{selectedShift && (
				<View style={styles.buttonContainer}>
					<TouchableOpacity style={styles.mainButtons}>
						<Text style={styles.standardText}>Make Request</Text>
					</TouchableOpacity>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	background: {
		flex: 1,
		backgroundColor: '#3f37c9'
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingLeft: '5%',
		paddingRight: '5%',
		paddingBottom: 10
	},
	title: {
		fontSize: 25,
		fontWeight: 'bold',
		color: '#fff'
	},
	scrollContainer: {
		paddingHorizontal: '5%',
		height: '100%'
	},
	shiftContainer: {
		backgroundColor: '#ffc802',
		borderRadius: 10,
		padding: 10,
		alignItems: 'center',
		justifyContent: 'flex-start',
		flexDirection: 'row',
		marginBottom: 10,
		height: height * 0.09 // 0.0725 will make it equal to the top of home page shift container
	},
	shiftTextContainer: {
		paddingLeft: 10,
		justifyContent: 'center',
		flexDirection: 'column',
		flex: 1
	},
	shiftRowTextContainer: {
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row'
	},
	standardText: {
		fontSize: 15,
		color: '#fff',
		fontWeight: 'bold'
	},
	shiftButtonLeft: {
		backgroundColor: '#08837f',
		width: '30%',
		height: '75%',
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 3
	},
	shiftButtonRight: {
		backgroundColor: '#e63a46',
		width: '30%',
		height: '75%',
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 3
	},
	mainButtons: {
		width: '80%',
		height: '30%',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#f72485',
		borderRadius: 10
	},
	buttonContainer: {
		alignItems: 'center',
		height: '25%',
		justifyContent: 'flex-end',
		paddingBottom: '5%'
	}
});
