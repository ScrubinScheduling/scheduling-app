import React from 'react';
import { Dimensions } from 'react-native';
import { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Image, TouchableOpacity} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];
const { height } = Dimensions.get('window');

type Shift = {
  day: string;
  role: string;
  tag: string;
  time: string;
  location: string;
};
type WeekData = {
  week: string;
  shifts: Shift[];
};
// generated using ai
const dummyShifts: Record<string, WeekData[]> = {
  October: [
    {
      week: 'Week 1',
      shifts: [
        { day: 'Monday', role: 'Vet Tech', tag: 'Morning', time: '8am - 4pm', location: '3315 Fairlight Drive' },
        { day: 'Wednesday', role: 'Groomer', tag: 'Stay Late', time: '10am - 8pm', location: 'Circle Drive South' },
      ]
    },
    {
      week: 'Week 2',
      shifts: [
        { day: 'Tuesday', role: 'Assistant', tag: 'Morning', time: '9am - 5pm', location: '22nd Street' },
        { day: 'Friday', role: 'Vet Tech', tag: 'Stay Late', time: '11am - 9pm', location: 'Confederation Drive' },
      ]
    },
    {
      week: 'Week 3',
      shifts: [
        { day: 'Monday', role: 'Vet Tech', tag: 'Morning', time: '8am - 4pm', location: '8th Street' },
        { day: 'Thursday', role: 'Receptionist', tag: 'Afternoon', time: '12pm - 8pm', location: 'Fairhaven Blvd' },
      ]
    },
    {
      week: 'Week 4',
      shifts: [
        { day: 'Wednesday', role: 'Groomer', tag: 'Morning', time: '8am - 2pm', location: 'Stonebridge Blvd' },
      ]
    }
  ],
};

const ShiftCard = ({ shift }: { shift: any }) => (
  <View style={styles.shiftContainer}>
    <Image style={{height: 40, width: 40, borderRadius: '50%'}} source={require('assets/example-vet.png')}/>
    <View style={styles.shiftTextContainer}>
      <View style={styles.shiftRowTextContainer}>
        <Text style={styles.standardText}>{shift.day}</Text>
        <View style={styles.shiftButtonLeft}>
          <Text style={[styles.standardText, {fontSize: 10, fontWeight: 'normal'}]}>{shift.role}</Text>
        </View>
        <View style={styles.shiftButtonRight}>
          <Text style={[styles.standardText, {fontSize: 10, fontWeight: 'normal'}]}>{shift.tag}</Text>
        </View>
      </View>
      <View style={styles.shiftRowTextContainer}>
        <View style={styles.shiftRowTextContainer}>
          <Ionicons name="time-outline" size={12} color="#fff" />
          <Text style={[styles.standardText, {fontWeight: 'normal'}]}>{shift.time}</Text>
        </View>
        <View style={styles.shiftRowTextContainer}>
          <Ionicons name="location-outline" size={12} color="#fff" />
          <Text style={[styles.standardText, {fontWeight: 'normal'}]}>{shift.location}</Text>
        </View>
      </View>
    </View>
  </View>
);

export default function ViewShiftPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>('October');
  const handleNext = () => {
    const nextIndex = (months.indexOf(selectedMonth) + 1) % months.length;
    setSelectedMonth(months[nextIndex]);
  };
  const handlePrev = () => {
    const prevIndex = (months.indexOf(selectedMonth) - 1 + months.length) % months.length;
    setSelectedMonth(months[prevIndex]);
  }
  const currentData = dummyShifts[selectedMonth] || [];

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
        {currentData.map((weekData: any, index: number) => (
          <View key={index} style={styles.weekContainer}>
            <Text style={styles.weekTitle}>{weekData.week}</Text>
            {weekData.shifts.map((shift: any, idx: number) => (
              <ShiftCard key={idx} shift={shift} />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#3f37c9',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    paddingTop: 0,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContainer: {
    paddingHorizontal: 20,
  },
  weekContainer: {
    marginBottom: 20,
  },
  weekTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  
  shiftContainer: {
    backgroundColor: '#ffc802',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    marginBottom: 10,
    height: height * 0.09, // 0.0725 will make it equal to the top of home page shift container
  },
  shiftTextContainer: {
    paddingLeft: 10,
    justifyContent: 'center',
    flexDirection: 'column',
    flex: 1,
  },
  shiftRowTextContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  standardText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: 'bold',
  },
  shiftButtonLeft: {
    backgroundColor: '#08837f',
    width: '30%',
    height: '75%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3,
  },
  shiftButtonRight: {
    backgroundColor: '#e63a46',
    width: '30%',
    height: '75%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3,
  },
});