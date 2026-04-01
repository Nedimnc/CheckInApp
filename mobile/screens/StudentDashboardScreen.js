import React, { useState, useContext, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, LayoutAnimation, Animated, Easing } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getSessions, getUsers, bookSession, unbookSession } from '../api';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import socket from '../services/socket';
import SessionBlock from '../components/SessionBlock';

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
      requestAnimationFrame(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSessions(prev => [...prev, newSession]);
      });
    };
    const handleBooked = (updatedSession) => {
      requestAnimationFrame(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSessions(prev => prev.map(s => s.session_id === updatedSession.session_id ? updatedSession : s));
      });
    };
    const handleUnbooked = (updatedSession) => {
      requestAnimationFrame(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSessions(prev => prev.map(s => s.session_id === updatedSession.session_id ? updatedSession : s));
      });
    };
    const handleCancelled = ({ session_id }) => {
      requestAnimationFrame(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSessions(prev => prev.filter(s => Number(s.session_id) !== Number(session_id)));
      });
    };
    const handleUpdated = (updatedSession) => {
      requestAnimationFrame(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSessions(prev => prev.map(s => s.session_id === updatedSession.session_id ? updatedSession : s));
      });
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

  const filteredSessions = useMemo(() => {
    const now = new Date();
    return sessions
      .filter((session) => {
        const startTime = new Date(session.start_time);
        const endTime = new Date(session.end_time);
        const isVisible = session.status === 'open' ? startTime > now : endTime > now;
        if (!isVisible) return false;
        const matchesSearch =
          session.subject.toLowerCase().includes(filter.toLowerCase()) ||
          users.find(u => u.user_id === session.tutor_id)?.name.toLowerCase().includes(filter.toLowerCase()) ||
          session.title.toLowerCase().includes(filter.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }, [sessions, filter, users]);

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={filteredSessions}
        keyExtractor={(item) => item.session_id.toString()}
        renderItem={({ item }) => (
          <SessionBlock
            session={item}
            currentUser={user}
            users={users}
            onPressScan={() => navigation.navigate('Scanner')}
            onUnbook={() => handleUnbook(item)}
            onPressBook={() => handleBook(item)}
          />
        )}
        ListHeaderComponent={
          <>
            <Text style={styles.headerText}>All Sessions</Text>
            <TextInput
              style={styles.input}
              placeholder="Search by course, title, or tutor..."
              onChangeText={setFilter}
              value={filter}
            />
          </>
        }
        ListEmptyComponent={<Text style={styles.emptyText}>No upcoming sessions available.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      />
      <TouchableOpacity style={styles.floatingButtonStyle} onPress={() => navigation.navigate('Scanner')}>
        <Ionicons name="qr-code-outline" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}



const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingBottom: 50 },
  headerText: { fontSize: 30, fontWeight: 'bold', color: '#111827', marginBottom: 15 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    padding: 15, marginBottom: 20, fontSize: 16, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8,
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
    backgroundColor: '#2D52A2', paddingVertical: 12, borderRadius: 30,
    alignItems: 'center', width: '100%', marginTop: 10
  },
  bookButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  actionRow: {
    flexDirection: 'row', marginTop: 15, paddingTop: 15, borderTopWidth: 1,
    borderTopColor: '#EEE', justifyContent: 'flex-end', gap: 15
  },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 30, borderWidth: 1,
  },
  qrButton: { borderColor: '#CDD4FF', backgroundColor: '#F5F7FA' },
  cancelButton: { borderColor: '#FFCDD2', backgroundColor: '#FFEBEE' },
  actionText: { fontWeight: '600', fontSize: 13, marginLeft: 6 },

  emptyText: { textAlign: 'center', marginTop: 20, color: '#888' },
  floatingButtonStyle: {
    position: 'absolute', width: 60, height: 60, alignItems: 'center',
    justifyContent: 'center', right: 30, bottom: 30, backgroundColor: '#2D52A2',
    borderRadius: 30, elevation: 5, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4
  },

  animatedContainer: { position: 'absolute', width: '100%', paddingHorizontal: 2 },
});