import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function Profile({ navigation }) {
  
  return (
    <View style={styles.scrollContent}>
      <View style={styles.topContent}>
        <Text style={styles.headerText}>Profile Screen</Text>
      </View>
      <View style={styles.bottomContent}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => navigation.replace('Login')}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F7FA',
  },
  headerText: {
    fontSize: 35,
    fontWeight: 'bold',
  },
  topContent: {
    flex: 1,
  },
  bottomContent: {
    marginBottom: 20,
  },
  logoutButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#D9534F',
  },
  logoutText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});