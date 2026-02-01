import React, { useState, useContext, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getSessions, getUsers, bookSession, unbookSession } from '../api';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

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

  // --- HANDLERS ---

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

  const handleUnbook = async (session) => {
    Alert.alert(
      "Unbook Session",
      "Do you want to cancel your booking?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Unbook", style: 'destructive',
          onPress: async () => {
            try {
              await unbookSession(session.session_id, user.user_id);
              loadData(); 
              Alert.alert("Success", "You have been removed from this session.");
            } catch (error) {
              Alert.alert("Error", error.message || "Could not unbook.");
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
      <TextInput
        style={styles.input}
        placeholder="Search by course or tutor..."
        onChangeText={setFilter}
        value={filter}
      />
      
      {sessions
        .filter((session) => {
          const isFuture = new Date(session.start_time) > new Date();
          const matchesSearch = session.subject.toLowerCase().includes(filter.toLowerCase()) || 
            users.find(u => u.user_id === session.tutor_id)?.name.toLowerCase().includes(filter.toLowerCase());
          return isFuture && matchesSearch;
        })
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
        .map((session) => {
          const isMyBooking = session.student_id === user.user_id;
          const isBookedByOther = session.status === 'booked' && !isMyBooking;

          return (
            <View key={session.session_id} style={[styles.sessionCard, isMyBooking && styles.myBookingCard]}>
              <View style={styles.headerRow}>
                <Text style={styles.subjectTitle}>{session.subject}: {session.title}</Text>
                
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

              {/* ACTION BUTTON AREA */}
              
              {/* 1. If I booked it: Show Compact Scan & Unbook buttons (Right Aligned) */}
              {isMyBooking && (
                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.qrButton]}
                    onPress={() => Alert.alert("Scanner", "Camera scanner coming soon!")}
                  >
                    <Ionicons name="scan-outline" size={16} color="#2D52A2" />
                    <Text style={[styles.actionText, { color: '#2D52A2' }]}>Scan QR</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => handleUnbook(session)}
                  >
                    <Ionicons name="close-circle-outline" size={16} color="#D32F2F" />
                    <Text style={[styles.actionText, { color: '#D32F2F' }]}>Unbook</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 2. If Open (and not me): Show Big Book Button */}
              {!isMyBooking && !isBookedByOther && (
                <View style={{ marginTop: 15 }}>
                  <TouchableOpacity 
                    style={styles.bookButton}
                    onPress={() => handleBook(session)}
                  >
                    <Text style={styles.bookButtonText}>Book Session</Text>
                  </TouchableOpacity>
                </View>
              )}

            </View>
          );
        })}
        
        {sessions.length === 0 && <Text style={styles.emptyText}>No upcoming sessions available.</Text>}
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
    borderLeftColor: '#4CAF50', backgroundColor: '#FFF'
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
    alignItems: 'center', width: '100%',
  },
  bookButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },


  actionRow: { 
    flexDirection: 'row', marginTop: 15, paddingTop: 15, 
    borderTopWidth: 1, borderTopColor: '#EEE', 
    justifyContent: 'flex-end', 
    gap: 8 
  },
  actionButton: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingVertical: 6, paddingHorizontal: 10, 
    borderRadius: 8, borderWidth: 1 
  },
  qrButton: { borderColor: '#2D52A2', backgroundColor: '#F5F7FA' },
  cancelButton: { borderColor: '#D32F2F', backgroundColor: '#FFEBEE' },
  actionText: { fontWeight: '600', fontSize: 12, marginLeft: 4 }, 
  
  emptyText: { textAlign: 'center', marginTop: 20, color: '#888' }
});