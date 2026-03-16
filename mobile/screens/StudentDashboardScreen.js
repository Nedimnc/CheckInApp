import React, { useState, useContext, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getSessions, getUsers, bookSession, unbookSession } from '../api';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import socket from '../services/socket';

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
    }
  }, [isFocused]);

  useEffect(() => {
    const handleCreated = (newSession) => {
      setSessions(prev => [...prev, newSession]);
    };
    const handleBooked = (updatedSession) => {
      setSessions(prev => prev.map(s => s.session_id === updatedSession.session_id ? updatedSession : s));
    };
    const handleUnbooked = (updatedSession) => {
      setSessions(prev => prev.map(s => s.session_id === updatedSession.session_id ? updatedSession : s));
    };
    const handleCancelled = ({ session_id }) => {
      setSessions(prev => prev.filter(s => Number(s.session_id || s.id) !== Number(session_id)));
    }
    const handleUpdated = (updatedSession) => {
      setSessions(prev => prev.map(s => s.session_id === updatedSession.session_id ? updatedSession : s));
    };

    socket.on('session_created', handleCreated);
    socket.on('session_booked', handleBooked);
    socket.on('session_unbooked', handleUnbooked);
    socket.on('session_cancelled', handleCancelled);
    socket.on('session_updated', handleUpdated);

    return () => {
      socket.off('session_created', handleCreated);
      socket.off('session_booked', handleBooked);
      socket.off('session_unbooked', handleUnbooked);
      socket.off('session_cancelled', handleCancelled);
      socket.off('session_updated', handleUpdated);
    };
  }, []);

  const loadData = async () => {
    try {
      const [sessionsData, usersData] = await Promise.all([
        getSessions(),
        getUsers()
      ]);
      setSessions(sessionsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().then(() => setRefreshing(false));
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
            } catch (error) {
              const serverMessage = error.message || 'Could not complete the request.';
              if (serverMessage.includes("Invalid token")) {
                console.log("Auth error caught via string matching - silencing local alert.");
                return;
              }

              Alert.alert("Action Failed", serverMessage);
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
              Alert.alert("Success", "You have been removed from this session.");
            } catch (error) {
              if (error.response && error.response.status !== 403 && error.response.status !== 401) {
                Alert.alert("Error", "Something went wrong. Please try again.");
              }
            }
          }
        }
      ]
    );
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.headerText}>All Sessions</Text>
        <TextInput
          style={styles.input}
          placeholder="Search by course, title, or tutor..."
          onChangeText={setFilter}
          value={filter}
        />

        {sessions
          .filter((session) => {
            const isFuture = new Date(session.start_time) > new Date();
            const matchesSearch = session.subject.toLowerCase().includes(filter.toLowerCase()) ||
              users.find(u => u.user_id === session.tutor_id)?.name.toLowerCase().includes(filter.toLowerCase()) ||
              session.title.toLowerCase().includes(filter.toLowerCase());
            return isFuture && matchesSearch;
          })
          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
          .map((session) => {
            const isMyBooking = session.student_id === user.user_id;
            const isCheckedIn = session.status === 'checked_in'; // Check if checked in
            // Consider it booked by other if it's booked OR checked in by someone else
            const isBookedByOther = (session.status === 'booked' || session.status === 'checked_in') && !isMyBooking;

            return (
              <View key={session.session_id} style={[styles.sessionCard, isMyBooking && styles.myBookingCard, isMyBooking && isCheckedIn && { borderLeftColor: '#5B21B6' }, isBookedByOther && styles.unavailableCard]}>
                <View style={styles.headerRow}>
                  <Text style={[styles.subjectTitle, isBookedByOther && styles.unavailableText]}>{session.subject}: {session.title}</Text>

                  {/* UPDATED: Badge rendering logic */}
                  {isMyBooking ? (
                    isCheckedIn ? (
                      <View style={styles.badgePurple}><Text style={styles.badgeTextPurple}>CHECKED IN ✓</Text></View>
                    ) : (
                      <View style={styles.badgeGreen}><Text style={styles.badgeTextGreen}>BOOKED BY YOU</Text></View>
                    )
                  ) : isBookedByOther ? (
                    <View style={styles.badgeGray}><Text style={styles.badgeTextGray}>UNAVAILABLE</Text></View>
                  ) : (
                    <View style={styles.badgeBlue}><Text style={styles.badgeTextBlue}>OPEN</Text></View>
                  )}
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={16} color={isBookedByOther ? '#999' : '#555'} />
                  <Text style={[styles.infoText, isBookedByOther && styles.unavailableText]}>
                    {new Date(session.start_time).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color={isBookedByOther ? '#999' : '#555'} />
                  <Text style={[styles.infoText, isBookedByOther && styles.unavailableText]}>
                    {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color={isBookedByOther ? '#999' : '#555'} />
                  <Text style={[styles.infoText, isBookedByOther && styles.unavailableText]}>{session.location}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={16} color={isBookedByOther ? '#999' : '#555'} />
                  <Text style={[styles.infoText, isBookedByOther && styles.unavailableText]}>
                    Tutor: {users.find(u => u.user_id === session.tutor_id)?.name || 'Loading...'}
                  </Text>
                </View>

                {/* ACTION BUTTON AREA */}

                {/* UPDATED: Only show Scan & Unbook if they haven't checked in yet */}
                {isMyBooking && !isCheckedIn && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.qrButton]}
                      onPress={() => navigation.navigate('Scanner')}
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
      {/* Floating QR Scanner Button */}
      <TouchableOpacity
        style={[styles.floatingButtonStyle]}
        onPress={() => navigation.navigate('Scanner')}
      >
        <Ionicons name="qr-code-outline" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingBottom: 50 },
  headerText: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    padding: 15, marginBottom: 20, fontSize: 16, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8,
  },
  sessionCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1,
    shadowRadius: 8, elevation: 4, borderLeftWidth: 5, borderLeftColor: '#2D52A2',
  },
  myBookingCard: { borderLeftColor: '#2E7D32', backgroundColor: '#FFF' },
  unavailableCard: { backgroundColor: '#F5F5F5', borderLeftColor: '#c9cacf' },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12,
  },
  subjectTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, paddingRight: 5 },

  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { marginLeft: 10, color: '#555', fontSize: 15 },
  unavailableText: { color: '#9CA3AF' },

  badgeBlue: { backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeTextBlue: { color: '#1976D2', fontSize: 12, fontWeight: 'bold' },

  badgeGreen: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeTextGreen: { color: '#2E7D32', fontSize: 12, fontWeight: 'bold' },

  badgeGray: { backgroundColor: '#EEEEEE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeTextGray: { color: '#9E9E9E', fontSize: 12, fontWeight: 'bold' },

  badgePurple: { backgroundColor: '#EDE9FE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeTextPurple: { color: '#5B21B6', fontSize: 12, fontWeight: 'bold' },


  bookButton: {
    backgroundColor: '#2D52A2', paddingVertical: 12, borderRadius: 10,
    alignItems: 'center', width: '100%',
  },
  bookButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  scanButton: {
    backgroundColor: '#2D52A2', flexDirection: 'row', alignItems: 'center', justifyContent:
      'center', padding: 18, borderRadius: 15, marginBottom: 20, elevation: 5, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5,
  },
  scanButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
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
  qrButton: { borderColor: '#CDD4FF', backgroundColor: '#F5F7FA' },
  cancelButton: { borderColor: '#FFCDD2', backgroundColor: '#FFEBEE' },
  actionText: { fontWeight: '600', fontSize: 12, marginLeft: 4 },

  emptyText: { textAlign: 'center', marginTop: 20, color: '#888' },
  floatingButtonStyle: {
    position: 'absolute', width: 60, height: 60, alignItems: 'center',
    justifyContent: 'center', right: 30, bottom: 30, backgroundColor: '#2D52A2',
    borderRadius: 30, elevation: 5, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4
  },
});