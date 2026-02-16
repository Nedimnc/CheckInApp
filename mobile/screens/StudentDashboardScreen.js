import React, { useState, useContext, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getSessions, getUsers, bookSession } from '../api';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons

export default function StudentDashboardScreen({ navigation }) {
  const [filter, setFilter] = useState('');
  const { user } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isFocused) {
      loadData();
      loadUsers();
    }
  }, [isFocused]);

  const loadData = async () => {
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([loadData(), loadUsers()]).then(() => setRefreshing(false));
  }, []);

  // Handle the booking logic
  const handleBook = async (session) => {
    Alert.alert(
      "Confirm Booking",
      `Do you want to book ${session.subject}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Book Now",
          onPress: async () => {
            try {
              await bookSession(session.session_id, user.user_id);
              Alert.alert("Success", "You have booked this session!");
              loadData(); 
            } catch (error) {
              Alert.alert("Error", error.message || "Failed to book");
            }
          }
        }
      ]
    );
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* ---  QR SCAN BUTTON  --- */}
      <TouchableOpacity 
        style={styles.scanButton} 
        onPress={() => navigation.navigate('Scanner')}
      >
        <Ionicons name="qr-code-outline" size={24} color="white" />
        <Text style={styles.scanButtonText}>Scan to Check In</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Search by course or tutor..."
        onChangeText={setFilter}
        value={filter}
      />
      
      {sessions
        .filter((session) => 
          session.subject.toLowerCase().includes(filter.toLowerCase()) || 
          users.find(u => u.user_id === session.tutor_id)?.name.toLowerCase().includes(filter.toLowerCase())
        )
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
        .map((session) => {
          const isMyBooking = session.student_id === user.user_id;
          const isBookedByOther = session.status === 'booked' && !isMyBooking;

          return (
            <View key={session.session_id} style={[styles.sessionCard, isMyBooking && styles.myBookingCard]}>
              <View style={styles.headerRow}>
                <Text style={styles.subjectTitle}>{session.subject}: {session.title}</Text>
                
                {/* Visual Status Badge */}
                {isMyBooking ? (
                  <View style={styles.badgeGreen}><Text style={styles.badgeTextGreen}>Booked by You</Text></View>
                ) : isBookedByOther ? (
                  <View style={styles.badgeGray}><Text style={styles.badgeTextGray}>Unavailable</Text></View>
                ) : (
                  <View style={styles.badgeBlue}><Text style={styles.badgeTextBlue}>Open</Text></View>
                )}
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.infoText}>
                  {new Date(session.start_time).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.infoText}>
                  {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.infoText}>{session.location}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color="#666" />
                <Text style={styles.infoText}>
                   Tutor: {users.find(u => u.user_id === session.tutor_id)?.name || 'Loading...'}
                </Text>
              </View>

              {/* BOOK BUTTON */}
              {!isMyBooking && !isBookedByOther && (
                <TouchableOpacity 
                  style={styles.bookButton}
                  onPress={() => handleBook(session)}
                >
                  <Text style={styles.bookButtonText}>Book Session</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
        
        {sessions.length === 0 && <Text style={styles.emptyText}>No sessions available.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingBottom: 50 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    padding: 15, marginBottom: 20, fontSize: 16, elevation: 2,
  },
  sessionCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1,
    shadowRadius: 8, elevation: 4, borderLeftWidth: 5, borderLeftColor: '#2D52A2',
  },
  myBookingCard: {
    borderLeftColor: '#4CAF50', backgroundColor: '#F1F8E9',
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12,
  },
  subjectTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, paddingRight: 5 },
  
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { marginLeft: 10, color: '#555', fontSize: 15 },

  badgeBlue: { backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeTextBlue: { color: '#1976D2', fontSize: 12, fontWeight: 'bold' },
  
  badgeGreen: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeTextGreen: { color: '#2E7D32', fontSize: 12, fontWeight: 'bold' },

  badgeGray: { backgroundColor: '#EEEEEE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeTextGray: { color: '#9E9E9E', fontSize: 12, fontWeight: 'bold' },

  bookButton: {
    backgroundColor: '#2D52A2', paddingVertical: 12, borderRadius: 10,
    alignItems: 'center', marginTop: 15,
  },
  bookButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#888' },

  scanButton: { backgroundColor: '#2D52A2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18,
    borderRadius: 15, marginBottom: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  
  scanButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 10,
  },
});