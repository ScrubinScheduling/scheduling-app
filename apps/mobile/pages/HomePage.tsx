import { View, Text, Button, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
            <IconButton iconColor="#fff" icon="bell" mode="contained" containerColor='#ffc802' size={20} />
            </TouchableOpacity>
          </View>
          <View style={styles.shiftContainer}>
            <Image style={{height: 40, width: 40, borderRadius: '50%'}} source={require('assets/example-vet.png')}/>
            <View style={styles.shiftTextContainer}>
              <View style={styles.shiftRowTextContainer}>
                <Text style={styles.standardText}>Today</Text>
                <View style={styles.shiftButtonLeft}>
                  <Text style={[styles.standardText, {fontSize: 10, fontWeight: 'normal'}]}>Vet Tech</Text>
                </View>
                <View style={styles.shiftButtonRight}>
                  <Text style={[styles.standardText, {fontSize: 10, fontWeight: 'normal'}]}>Stay Late</Text>
                </View>
              </View>
              <View style={styles.shiftRowTextContainer}>
                <Ionicons name="time-outline" size={12} color="#fff" />
                <Text style={[styles.standardText, {fontWeight: 'normal'}]}>8am - 6pm</Text>
                <Ionicons name="location-outline" size={12} color="#fff" />
                <Text style={[styles.standardText, {fontWeight: 'normal'}]}>3315 Fairlight Drive</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.bottomTopContainer}>
          <Text style={styles.clockText}>00:00</Text>
          <TouchableOpacity style={styles.mainButtons} onPress={() => signOut()}>
            <Text style={styles.standardText}>Clock In</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.bottomContainer}>
        <Text style={[styles.standardText, {color: 'black'}]}>Upcoming</Text>
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
    padding: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  shiftTextContainer: {
    paddingLeft: 10,
    justifyContent: 'center',
    flexDirection: 'column',
  },
  shiftRowTextContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
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
  }
});