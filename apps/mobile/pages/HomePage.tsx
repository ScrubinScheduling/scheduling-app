import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { IconButton } from 'react-native-paper';

export default function HomePage() {
  const { signOut } = useAuth();
  return (
    <View style={styles.background}>
      <View style={styles.topContainer}>
        <View style={styles.topTopContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Good morning, Terry!</Text>
            <TouchableOpacity>
            <IconButton iconColor="#ffc802" icon="bell" mode="contained" containerColor='#fff' size={20} />
            </TouchableOpacity>
          </View>
          <View style={styles.shiftContainer}>
          </View>
        </View>
        <View style={styles.bottomTopContainer}>
          <Text style={styles.clockText}>00:00</Text>
          <TouchableOpacity style={styles.mainButtons} onPress={() => signOut()}>
            <Text style={[styles.title, {fontSize: 20}]}>Clock In</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.bottomContainer}>
        <Text style={[styles.title, {color: 'black'}]}>Upcoming</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#3f37c9',
  },
  topContainer: {
    paddingLeft: '5%',
    paddingRight: '5%',
    flex: 0.45,
    backgroundColor: '#3f37c9',
  },
  bottomContainer: {
    padding: '5%',
    flex: 0.55,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#fff'
  },
  topTopContainer: {
    flex: 0.4,
    alignContent: 'center',
    justifyContent: 'flex-start',
    paddingBottom: '2%'
  },
  bottomTopContainer: {
    flex: 0.57, // leave some gap at the bottom of top container
    alignContent: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingTop: '5%',
  },
  titleContainer: {
    flex: 0.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftContainer: {
    flex: 0.5,
    backgroundColor: '#ffc802',
    borderRadius: 10,
  },
  clockText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'black',
    padding: 10,
  },
  mainButtons: {
    width: '80%',
    height: '30%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f72485',
    borderRadius: 10,
  },
  shiftButtonLeft: {
    color: '#08837f'
  },
  shiftButtonRight: {
    color: '#e63a46'
  }
});