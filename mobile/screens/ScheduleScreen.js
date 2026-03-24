import React, { useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Alert, LayoutAnimation, FlatList, Easing } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getSessions, getUsers, cancelSession, unbookSession } from '../api';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import socket from '../services/socket';

export default function Schedule({ navigation }) {
  const { user } = useContext(AuthContext);
  const [mySessions, setMySessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();
  const [filter, setFilter] = useState('all');

  // Calendar State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState({});

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  useEffect(() => {
    const handleUpdated = (updatedSession) => {
      requestAnimationFrame(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMySessions(prev => {
          const isMySession = updatedSession.student_id === user.user_id || updatedSession.tutor_id === user.user_id;
          if (isMySession) {
            const exists = prev.find(s => s.session_id === updatedSession.session_id);
            return exists
              ? prev.map(s => s.session_id === updatedSession.session_id ? updatedSession : s)
              : [...prev, updatedSession];
          } else {
            return prev.filter(s => s.session_id !== updatedSession.session_id);
          }
        });
      });
    };
    const handleCancelled = ({ session_id }) => {
      requestAnimationFrame(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMySessions(prev => prev.filter(s => Number(s.session_id) !== Number(session_id)));
      });
    };

    socket.on('session_booked', handleUpdated);
    socket.on('session_unbooked', handleUpdated);
    socket.on('session_updated', handleUpdated);
    socket.on('session_cancelled', handleCancelled);

    return () => {
      socket.off('session_booked', handleUpdated);
      socket.off('session_unbooked', handleUpdated);
      socket.off('session_updated', handleUpdated);
      socket.off('session_cancelled', handleCancelled);
    };
  }, [user.user_id]);

  useEffect(() => {
    const marks = {};
    mySessions.forEach(session => {
      const dateKey = session.start_time.split('T')[0];
      const shouldMark = (filter === 'all') || (session.status === 'booked' || session.status === 'checked_in');
      if (shouldMark) {
        marks[dateKey] = { marked: true, dotColor: '#2D52A2' };
      }
    });
    marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: '#2D52A2' };
    setMarkedDates(marks);
  }, [mySessions, selectedDate, filter]);

  const loadData = async () => {
    try {
      const [sessionsData, usersData] = await Promise.all([
        getSessions(),
        getUsers()
      ]);

      const relevantSessions = sessionsData.filter(session => {
        if (user.role === 'tutor') {
          return session.tutor_id === user.user_id;
        }
        return session.student_id === user.user_id;
      });

      setMySessions(relevantSessions);
      setUsers(usersData);

      // Mark Calendar
      const marks = {};
      relevantSessions.forEach(session => {
        if (session.status === 'booked' || session.status === 'checked_in') {
          const dateKey = session.start_time.split('T')[0];
          marks[dateKey] = { marked: true, dotColor: '#2D52A2' };
        }
      });
      // Highlight Selected
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: '#2D52A2' };
      setMarkedDates(marks);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().then(() => setRefreshing(false));
  }, [selectedDate]);

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
    const newMarks = { ...markedDates };
    Object.keys(newMarks).forEach(key => {
      if (newMarks[key].selected) {
        delete newMarks[key].selected;
        delete newMarks[key].selectedColor;
      }
    });
    newMarks[day.dateString] = { ...newMarks[day.dateString], selected: true, selectedColor: '#2D52A2' };
    setMarkedDates(newMarks);
  };

  // ACTION HANDLERS 

  const handleTutorCancel = (sessionId) => {
    Alert.alert(
      "Cancel Session",
      "Are you sure? This will delete the session entirely.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel", style: 'destructive',
          onPress: async () => {
            try {
              await cancelSession(sessionId, user.user_id);
              Alert.alert("Success", "Session deleted.");
            } catch (error) {
              Alert.alert("Error", "Could not delete session.");
            }
          }
        }
      ]
    );
  };

  const handleStudentUnbook = (sessionId) => {
    Alert.alert(
      "Unbook Session",
      "Do you want to cancel your booking? The slot will become open for others.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Unbook", style: 'destructive',
          onPress: async () => {
            try {
              await unbookSession(sessionId, user.user_id);
              Alert.alert("Success", "You have been removed from this session.");
            } catch (error) {
              Alert.alert("Error", error.message || "Could not unbook.");
            }
          }
        }
      ]
    );
  };

  const daySessions = useMemo(() => {
    return mySessions
      .filter(s => s.start_time.startsWith(selectedDate))
      .filter(s => {
        if (user.role !== 'tutor' || filter === 'all') return true;
        return s.status === 'booked' || s.status === 'checked_in';
      })
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }, [mySessions, selectedDate, filter, user.role]);

  const handleToggle = (newFilter) => {
    requestAnimationFrame(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setFilter(newFilter);
    });
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={daySessions}
        keyExtractor={(item) => item.session_id.toString()}
        renderItem={({ item }) => (
          <SessionCard
            session={item}
            user={user}
            users={users}
            navigation={navigation}
            // tutor action buttons
            onPressQR={() => navigation.navigate('SessionQR', { session: item })} // Use item
            onPressCopy={() => {
              const { session_id, student_id, ...sessionCopy } = item; // Use item
              navigation.navigate('SessionCreate', {
                sessionToEdit: { ...sessionCopy, status: 'open' }
              });
            }}
            onPressEdit={() => navigation.navigate('SessionCreate', { sessionToEdit: item })} // Match prop name
            onCancel={() => handleTutorCancel(item.session_id)}
            // student action buttons
            onPressScan={() => navigation.navigate('Scanner')}
            onUnbook={() => handleStudentUnbook(item.session_id)}
          />
        )}
        ListHeaderComponent={
          <>
            <View style={styles.container}>
              <Text style={styles.headerTitle}>My Schedule</Text>
              {user.role === 'tutor' && (
                <View style={styles.toggleContainer}>
                  <View style={[styles.slidingPill, filter === 'all' ? { left: 4 } : { left: '51%' }]} />
                  <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => handleToggle('all')}
                  >
                    <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
                      All Sessions
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => handleToggle('booked')}
                  >
                    <Text style={[styles.filterButtonText, filter === 'booked' && styles.filterButtonTextActive]}>
                      Only Booked
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.calendarContainer}>
                <Calendar
                  onDayPress={onDayPress}
                  markedDates={markedDates}
                  theme={{
                    selectedDayBackgroundColor: '#2D52A2',
                    todayTextColor: '#2D52A2',
                    arrowColor: '#2D52A2',
                    dotColor: '#2D52A2',
                  }}
                />
              </View>
              <Text style={styles.sectionTitle}>
                Sessions for {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-clear-outline" size={40} color="#CCC" />
            <Text style={styles.emptyText}>No sessions on this day.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 50 }}
      />
    </View>
  );
}

const SessionCard = ({ session, user, users, navigation, onPressQR, onPressCopy, onPressEdit, onCancel, onPressScan, onUnbook }) => {
  const isImTheTutor = session.tutor_id === user.user_id;
  const counterpartId = isImTheTutor ? session.student_id : session.tutor_id;
  const counterpartLabel = isImTheTutor ? "Student" : "Tutor";
  const counterpartName = users.find(u => u.user_id === counterpartId)?.name || 'Unknown';
  const isPast = new Date(session.end_time) < new Date();
  const isCheckedIn = session.status === 'checked_in';
  const isBooked = session.status === 'booked';

  let accentColor = '#2D52A2';
  if (isPast) {
    accentColor = '#CCC';
  } else if (isCheckedIn) {
    accentColor = '#5B21B6';
  } else if (isBooked) {
    accentColor = '#2E7D32';
  };

  return (
    <View style={[styles.card, isPast ? styles.pastCard : styles.upcomingCard, { borderLeftColor: accentColor }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.subject, isPast && styles.pastText]}>{session.subject}: {session.title}</Text>
        {/* Swap between Confirmed and Checked In */}
        <View style={[styles.statusBadge, !isPast ? (isCheckedIn ? styles.checkedInBadge : (isBooked ? styles.bookedBadge : styles.openBadge)) : null]}>
          <Text style={[styles.statusText, isCheckedIn ? styles.checkedInText : (isBooked ? styles.bookedText : styles.openText)]}>
            {!isPast ? (isCheckedIn ? 'CHECKED IN ✓' : (isBooked ? 'BOOKED' : 'OPEN')) : null}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <Ionicons name="time-outline" size={16} color={isPast ? "#999" : "#555"} />
        <Text style={[styles.info, isPast && styles.pastText]}>
          {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="location-outline" size={16} color={isPast ? "#999" : "#555"} />
        <Text style={[styles.info, isPast && styles.pastText]}>{session.location}</Text>
      </View>

      {isBooked || isCheckedIn ? (
        <View style={styles.row}>
          <Ionicons name="person-outline" size={16} color={isPast ? "#999" : "#555"} />
          <Text style={[styles.info, isPast && styles.pastText]}>
            {counterpartLabel}: {counterpartName}
          </Text>
        </View>
      ) : null}

      {/* ACTION BUTTONS ROW (UPDATED: Hide if checked in) */}
      {!isPast && !isCheckedIn && (
        <View style={[styles.actionRow, isImTheTutor && { justifyContent: 'space-between', gap: 10 }]}>

          {/* IF I AM THE TUTOR */}
          {isImTheTutor ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.qrButton]}
                onPress={onPressQR}
              >
                <Ionicons name="qr-code-outline" size={18} color="#2D52A2" />
                <Text style={[styles.actionText, { color: '#2D52A2' }]}>QR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.copyButton]}
                onPress={onPressCopy}
              >
                <Ionicons name="copy-outline" size={18} color="#679968" />
                <Text style={[styles.actionText, { color: '#679968' }]}>Copy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={onPressEdit}
              >
                <Ionicons name="create-outline" size={18} color="#F57C00" />
                <Text style={[styles.actionText, { color: '#F57C00' }]}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={onCancel}
              >
                <Ionicons name="trash-outline" size={18} color="#D32F2F" />
                <Text style={[styles.actionText, { color: '#D32F2F' }]}>Delete</Text>
              </TouchableOpacity>
            </>
          ) : (
            /* IF I AM THE STUDENT */
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.qrButton]}
                onPress={onPressScan}
              >
                <Ionicons name="qr-code-outline" size={18} color="#2D52A2" />
                <Text style={[styles.actionText, { color: '#2D52A2' }]}>Scan QR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={onUnbook}
              >
                <Ionicons name="close-circle-outline" size={18} color="#D32F2F" />
                <Text style={[styles.actionText, { color: '#D32F2F' }]}>Unbook</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#111827', marginBottom: 15 },
  calendarContainer: { marginBottom: 20, borderRadius: 12, overflow: 'hidden', elevation: 3, backgroundColor: 'white', },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  emptyContainer: { alignItems: 'center', marginTop: 20 },
  emptyText: { color: '#888', fontStyle: 'italic', marginTop: 10 },
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,
    shadowRadius: 8, elevation: 4, borderLeftWidth: 5, borderLeftColor: '#2D52A2', marginHorizontal: 20,
  },
  upcomingCard: { backgroundColor: '#FFF', borderLeftColor: '#2E7D32', borderLeftWidth: 5 },
  pastCard: { backgroundColor: '#F3F4F6', borderLeftColor: '#c9cacf', borderLeftWidth: 5 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subject: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1, paddingRight: 5 },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  openBadge: { backgroundColor: '#E3F2FD' },
  bookedBadge: { backgroundColor: '#E8F5E9' },
  checkedInBadge: { backgroundColor: '#EDE9FE' },

  statusText: { fontSize: 12, fontWeight: 'bold' },
  openText: { color: '#1976D2' },
  bookedText: { color: '#2E7D32' },
  checkedInText: { color: '#5B21B6' },

  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  info: { marginLeft: 8, fontSize: 14, color: '#555' },
  pastText: { color: '#9CA3AF' },

  actionRow: { flexDirection: 'row', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#EEE', justifyContent: 'flex-end', gap: 15 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 30, borderWidth: 1 },
  qrButton: { borderColor: '#CDD4FF', backgroundColor: '#F5F7FA' },
  copyButton: { borderColor: '#b6e0b5', backgroundColor: '#f5fff5' },
  editButton: { borderColor: '#FFE0B2', backgroundColor: '#FFF3E0' },
  cancelButton: { borderColor: '#FFCDD2', backgroundColor: '#FFEBEE' },
  actionText: { fontWeight: '600', fontSize: 13, marginLeft: 6 },

  toggleContainer: { flexDirection: 'row', backgroundColor: '#dedede', borderRadius: 25, padding: 4, marginBottom: 20 },
  slidingPill: {
    position: 'absolute', top: 4, bottom: 4, width: '50%', backgroundColor: '#2D52A2', 
    borderRadius: 21, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.2, shadowRadius: 3, elevation: 3, },
  filterButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 21 },
  filterButtonActive: { backgroundColor: '#2D52A2', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  filterButtonText: { color: '#666', fontWeight: '600' },
  filterButtonTextActive: { color: '#FFF' },
});