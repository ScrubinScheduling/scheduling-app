import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomePage from '@/pages/HomePage';
import ViewShiftPage from '@/pages/ViewShiftPage';
import TradeShiftPage from '@/pages/TradeShiftPage';
import DaysOffPage from '@/pages/DaysOffPage';
import SettingsPage from '@/pages/SettingsPage';
import TabBar from '@/components/MainTabs';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
	return (
		<Tab.Navigator tabBar={(props) => <TabBar {...props} />}>
			<Tab.Screen
				name="Home"
				component={HomePage}
				options={{
					title: '',
					headerTitleAlign: 'center',
					headerStyle: {
						backgroundColor: '#3f37c9',
						shadowColor: 'transparent',
						borderBottomWidth: 0
					},
					headerTintColor: '#fff',
					headerTitleStyle: { fontWeight: 'bold', fontSize: 30 }
				}}
			/>
			<Tab.Screen
				name="ViewShift"
				component={ViewShiftPage}
				options={{
					title: '',
					headerTitleAlign: 'center',
					headerStyle: {
						backgroundColor: '#3f37c9',
						shadowColor: 'transparent',
						borderBottomWidth: 0
					},
					headerTintColor: '#fff',
					headerTitleStyle: { fontWeight: 'bold', fontSize: 30 }
				}}
			/>
			<Tab.Screen
				name="TradeShift"
				component={TradeShiftPage}
				options={{
					title: '',
					headerTitleAlign: 'center',
					headerStyle: {
						backgroundColor: '#3f37c9',
						shadowColor: 'transparent',
						borderBottomWidth: 0
					},
					headerTintColor: '#fff',
					headerTitleStyle: { fontWeight: 'bold', fontSize: 30 }
				}}
			/>
			<Tab.Screen
				name="DaysOff"
				component={DaysOffPage}
				options={{
					title: 'Days Off',
					headerTitleAlign: 'center',
					headerStyle: {
						backgroundColor: '#3f37c9',
						shadowColor: 'transparent',
						borderBottomWidth: 0
					},
					headerTintColor: '#fff',
					headerTitleStyle: { fontWeight: 'bold', fontSize: 30 }
				}}
			/>
			<Tab.Screen
				name="Settings"
				component={SettingsPage}
				options={{
					title: 'Settings',
					headerTitleAlign: 'center',
					headerStyle: {
						backgroundColor: '#3f37c9',
						shadowColor: 'transparent',
						borderBottomWidth: 0
					},
					headerTintColor: '#fff',
					headerTitleStyle: { fontWeight: 'bold', fontSize: 30 }
				}}
			/>
		</Tab.Navigator>
	);
}
