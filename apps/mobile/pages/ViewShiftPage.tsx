import React, { use } from 'react';
import { Dimensions, experimental_LayoutConformance } from 'react-native';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApiClient } from '@/hooks/useApiClient';

// Temporarily here until workspaces are implemented on mobile
import { useAuth } from '@clerk/clerk-expo';

const months = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
];
const { height } = Dimensions.get('window');

type Shift = {
	id: number;
	startTime: string
	endTime: string;
	userId: string;
	breakDuration: number;
	workspaceId: number;
	user?: {
		id: string;
		firstName: string | null;
		lastName: string | null;
	};
	timesheet?: any;
	workspace?: {
		id: number;
		name: string;
		location: string;
		adminId: string;
	};
};

type FormattedShift = {
	day: string;
	role: string;
	tag: string;
	time: string;
	location: string;
	date: Date;
};
type WeekData = {
	week: string;
	shifts: FormattedShift[];
};

const ShiftCard = ({ shift }: { shift: FormattedShift }) => (
	<View style={styles.shiftContainer}>
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
);

// format shift time to "hh:mm am/pm - hh:mm am/pm"
const formatShiftTime = (startTime: string, endTime: string): string => {
	const start = new Date(startTime);
	const end = new Date(endTime);

	const formatTime = (date: Date) => {
		return date
			.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true
			})
			.toLowerCase();
	};
	return `${formatTime(start)} - ${formatTime(end)}`;
};

// get the shift tag given the shift start time
const getShiftTag = (startTime: string): string => {
	const hour = new Date(startTime).getHours();
	if (hour < 12) return 'Morning';
	if (hour < 17) return 'Afternoon';
	return 'Evening';
};

// format the shift data into month -> week -> shifts structure
const formatShiftData = (shifts: Shift[]): Record<string, WeekData[]> => {
	const formattedData: Record<string, WeekData[]> = {};

	shifts.forEach((shift) => {
		const date = new Date(shift.startTime);
		const month = months[date.getMonth()];
		const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
		const weekNumber = Math.ceil(date.getDate() / 7);
		const weekKey = `Week ${weekNumber}`;

		if (!formattedData[month]) {
			formattedData[month] = [];
		}

		let weekData = formattedData[month].find((week) => week.week === weekKey);
		if (!weekData) {
			weekData = { week: weekKey, shifts: [] };
			formattedData[month].push(weekData);
		}

		const formattedShift: FormattedShift = {
			day: dayName,
			role: 'Vet Tech', // Placeholder
			tag: getShiftTag(shift.startTime),
			time: formatShiftTime(shift.startTime, shift.endTime),
			location: shift.workspace ? shift.workspace.location : 'Unknown Location',
			date: date
		};

		weekData.shifts.push(formattedShift);
	});

	// sort weeks and shifts within each month
	Object.keys(formattedData).forEach((month) => {
		formattedData[month].sort((a, b) => {
			const weekA = parseInt(a.week.replace('Week ', ''));
			const weekB = parseInt(b.week.replace('Week ', ''));
			return weekA - weekB;
		});

		formattedData[month].forEach((week) => {
			week.shifts.sort((a, b) => a.date.getTime() - b.date.getTime());
		});
	});

	return formattedData;
};

// get the start and end date of a month
const getMonthDateRange = (month: string, year: number = new Date().getFullYear()) => {
	const monthIndex = months.indexOf(month);
	const startDate = new Date(year, monthIndex, 1);
	const endDate = new Date(year, monthIndex + 1, 0);
	return { startDate, endDate };
};

export default function ViewShiftPage() {
	const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
	const [shiftsData, setShiftsDate] = useState<Record<string, WeekData[]>>({});
	const [loading, setLoading] = useState(true);
	const [workspaces, setWorkspaces] = useState([]);
	const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
	const [workspaceMap, setWorkspaceMap] = useState<Record<number, any>>({});

	const { userId } = useAuth();
	const apiClient = useApiClient();

	useEffect(() => {
		if (userId) {
			fetchWorkspaces();
		}
	}, [userId]);

	useEffect(() => {
		if (selectedWorkspaceId && userId) {
			fetchShiftsForMonth(selectedMonth);
		}
	}, [selectedMonth, selectedWorkspaceId, userId]);	

	const fetchWorkspaces = async () => {
		try {
			const workspacesData = await apiClient.getWorkspaces();
			setWorkspaces(workspacesData);

			const map: Record<number, any> = {};
			workspacesData.forEach((workspace: any) => {
				map[workspace.id] = workspace;
			});
			setWorkspaceMap(map);

			if (workspaces.length > 0) {
				setSelectedWorkspaceId(workspacesData[0].id);
			}
		} catch (err) {
			console.error('Error fetching workspaces:', err);
		}
	};

	// fetch shifts for the selected month
	const fetchShiftsForMonth = async (month: string) => {
		if (!selectedWorkspaceId || !userId) {
			console.log('Workspace ID or User ID is missing');
			return;
		}

		try {
			setLoading(true);
			console.log('Fetching shifts for:', {
				workspaceId: selectedWorkspaceId,
				userId,
				month
			});

			const { startDate, endDate } = getMonthDateRange(month);

			const response = await apiClient.getUserShifts(selectedWorkspaceId, {
				start: startDate.toISOString(),
				end: endDate.toISOString()
			});

			console.log('API response:', response);

			let shifts: Shift[] = [];
			if (Array.isArray(response)) {
				shifts = response;
			} else if (response?.shifts) {
				shifts = response.shifts;
			} else {
				shifts = [];
			}

			console.log(`Found ${shifts.length} shifts for ${month}`);

			const enhancedShifts = shifts.map((shift) => ({
				...shift,
				workspace: workspaceMap[shift.workspaceId]
			}));

			setShiftsDate(formatShiftData(enhancedShifts));
		} catch (err) {
			console.error('Error fetching shifts:', err);
		} finally {
			setLoading(false);
		}
	};

	// handle the next and previous month navigation
	const handleNext = () => {
		const currentIndex = months.indexOf(selectedMonth);
		const nextIndex = (currentIndex + 1) % months.length;
		setSelectedMonth(months[nextIndex]);
	};
	const handlePrev = () => {
		const currentIndex = months.indexOf(selectedMonth);
		const prevIndex = (currentIndex - 1 + months.length) % months.length;
		setSelectedMonth(months[prevIndex]);
	};

	const currentData = shiftsData[selectedMonth] || [];

	return (
		<View style={styles.background}>
			<View style={styles.monthHeader}>
				<TouchableOpacity onPress={handlePrev}>
					<Ionicons name="chevron-back-outline" size={24} color="#fff" />
				</TouchableOpacity>
				<Text style={styles.title}>{selectedMonth}</Text>
				<TouchableOpacity onPress={handleNext}>
					<Ionicons name="chevron-forward-outline" size={24} color="#fff" />
				</TouchableOpacity>
			</View>
			<ScrollView contentContainerStyle={styles.scrollContainer}>
				{currentData.length === 0 ? (
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyText}>No shifts scheduled for {selectedMonth}</Text>
					</View>
				) : (
					currentData.map((weekData, index) => (
						<View key={index} style={styles.weekContainer}>
							<Text style={styles.weekTitle}>{weekData.week}</Text>
							{weekData.shifts.map((shift, idx) => (
								<ShiftCard key={idx} shift={shift} />
							))}
						</View>
					))
				)}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	background: {
		flex: 1,
		backgroundColor: '#3f37c9'
	},
	monthHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 10,
		paddingTop: 0
	},
	title: {
		fontSize: 25,
		fontWeight: 'bold',
		color: '#fff'
	},
	scrollContainer: {
		paddingHorizontal: 20
	},
	weekContainer: {
		marginBottom: 20
	},
	weekTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#fff',
		marginBottom: 10
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
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 50
	},
	emptyText: {
		color: 'black',
		fontSize: 16,
		textAlign: 'center'
	}
});
