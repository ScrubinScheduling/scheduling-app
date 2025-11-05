import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
    const iconMapping: { [key: string]: { label: string, iconName: 'airplane-outline' | 'home-outline' | 'calendar-clear-outline' | 'settings-outline' | 'swap-horizontal-sharp' } } = {
        'Home': { label: 'Home', iconName: 'home-outline' },
        'ViewShift': { label: 'Shifts', iconName: 'calendar-clear-outline'},
        'TradeShift': { label: 'Trade', iconName: 'swap-horizontal-sharp' },
        'DaysOff': { label: 'Vacation', iconName: 'airplane-outline' },
        'Settings': { label: 'Settings', iconName: 'settings-outline' },
    };

    return (
    <View style={styles.tabBar}>
        <View style={styles.tabContainer}>
        {state.routes.map((route, index) => {
          const { label, iconName } = iconMapping[route.name as keyof typeof iconMapping];
          const isFocused = state.index === index;
          
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={styles.tab}>
              <Ionicons name={iconName} size={30} color={isFocused ? '#f72485':'black' }/>
              <Text style={{ color: isFocused ? '#f72485':'black', fontSize: 10, marginTop: 1 }}>{label}</Text>
            </TouchableOpacity>
          );
        })}
        </View>
    </View>
    );
  };

export default TabBar;

const styles = StyleSheet.create({
    tabBar: {
        height: 80,
        backgroundColor: '#f8f8f8',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        justifyContent: 'flex-end',
    },
    tabContainer: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'flex-start',
      paddingTop: 8,
      height: '100%',
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
  