import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function Dashboard({ navigation }) {
  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={{ fontSize: 35, fontWeight: 'bold' }}>Dashboard Screen</Text>
      </View>
    </ScrollView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '15%',
  },
});