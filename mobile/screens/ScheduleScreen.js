import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 

export default function ScheduleScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>My Schedule</Text>
        
        {/* Placeholder text until you have real sessions */}
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No upcoming sessions.</Text>
        </View>
      </ScrollView>

      {/* --- THIS IS THE BUTTON --- */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('SessionCreate')}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20 },
  header: { fontSize: 30, fontWeight: 'bold', marginBottom: 20, color: '#2D52A2' },
  emptyState: { padding: 20, alignItems: 'center', marginTop: 50 },
  emptyText: { color: 'gray', fontSize: 16 },
  
  // Styles for the Blue + Button
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: '#2D52A2',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  }
});