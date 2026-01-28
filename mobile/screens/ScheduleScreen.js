import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function Schedule({ navigation }) {

  return (
    <ScrollView
      bounces={true}
    >
      <View style={styles.container}>
        <Text style={{ fontSize: 35, fontWeight: 'bold' }}>Schedule Screen</Text>
      </View>
    </ScrollView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});