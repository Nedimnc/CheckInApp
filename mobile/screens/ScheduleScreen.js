import React, { useState, useContext, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getSessions, getUsers, cancelSession, unbookSession } from '../api';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';

export default function Schedule({ navigation }) {
  const { user } = useContext(AuthContext);
  const [mySessions, setMySessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  // Calendar State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState({});

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    try {
      const [sessionsData, usersData] = await Promise.all([
        getSessions(),
        getUsers()
      ]);

      const relevantSessions = sessionsData.filter(session =>
        session.student_id === user.user_id ||
        // Include 'checked_in' so they don't disappear from tutor's calendar
        (session.tutor_id === user.user_id && (session.status === 'booked' || session.status === 'checked_in'))
      );

      setMySessions(relevantSessions);
      setUsers(usersData);

      // Mark Calendar
      const marks = {};
      relevantSessions.forEach(session => {
        const dateKey = session.start_time.split('T')[0];
        marks[dateKey] = { marked: true, dotColor: '#2D52A2' };
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
              loadData(); // Refresh list
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
              loadData(); // Refresh list
              Alert.alert("Success", "You have been removed from this session.");
            } catch (error) {
              Alert.alert("Error", error.message || "Could not unbook.");
            }
          }
        }
      ]
    );
  };

  const daySessions = mySessions.filter(s => s.start_time.startsWith(selectedDate));

  const renderSessionCard = (session) => {
    const isImTheTutor = session.tutor_id === user.user_id;
    const counterpartId = isImTheTutor ? session.student_id : session.tutor_id;
    const counterpartLabel = isImTheTutor ? "Student" : "Tutor";
    const counterpartName = users.find(u => u.user_id === counterpartId)?.name || 'Unknown';
    const isPast = new Date(session.start_time) < new Date();
    const isCheckedIn = session.status === 'checked_in'; 

    return (
      <View key={session.session_id} style={[styles.card, isPast ? styles.pastCard : styles.upcomingCard]}>
        <View style={styles.headerRow}>
          <Text style={[styles.subject, isPast && styles.pastText]}>{session.subject}</Text>
          {/* Swap between Confirmed and Checked In */}
          {!isPast && (
            isCheckedIn ? (
              <View style={styles.badgePurple}><Text style={styles.badgeTextPurple}>CHECKED IN ✓</Text></View>
            ) : (
              <View style={styles.badge}><Text style={styles.badgeText}>CONFIRMED</Text></View>
            )
          )}
        </View>

        <Text style={[styles.title, isPast && styles.pastText]}>{session.title}</Text>

        <View style={styles.row}>
          <Ionicons name="person-outline" size={16} color={isPast ? "#999" : "#555"} />
          <Text style={[styles.info, isPast && styles.pastText]}>
            {counterpartLabel}: {counterpartName}
          </Text>
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

        {/* ACTION BUTTONS ROW (UPDATED: Hide if checked in) */}
        {!isPast && !isCheckedIn && (
          <View style={styles.actionRow}>

            {/* IF I AM THE TUTOR */}
            {isImTheTutor ? (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.qrButton]}
                  onPress={() => navigation.navigate('SessionQR', { session: session })}
                >
                  <Ionicons name="qr-code-outline" size={16} color="#2D52A2" />
                  <Text style={[styles.actionText, { color: '#2D52A2' }]}>QR</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => navigation.navigate('SessionCreate', { sessionToEdit: session })}
                >
                  <Ionicons name="create-outline" size={16} color="#F57C00" />
                  <Text style={[styles.actionText, { color: '#F57C00' }]}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => handleTutorCancel(session.session_id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#D32F2F" />
                  <Text style={[styles.actionText, { color: '#D32F2F' }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* IF I AM THE STUDENT */
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.qrButton]}
                  onPress={() => navigation.navigate('Scanner')}
                >
                  <Ionicons name="scan-outline" size={16} color="#2D52A2" />
                  <Text style={[styles.actionText, { color: '#2D52A2' }]}>Scan QR</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => handleStudentUnbook(session.session_id)}
                >
                  <Ionicons name="close-circle-outline" size={16} color="#D32F2F" />
                  <Text style={[styles.actionText, { color: '#D32F2F' }]}>Unbook</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 50 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.headerTitle}>My Schedule</Text>

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Sessions for {new Date(selectedDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
        </Text>

        {daySessions.length > 0 ? (
          daySessions.sort((a, b) => new Date(a.start_time) - new Date(b.start_time)).map(renderSessionCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-clear-outline" size={40} color="#CCC" />
            <Text style={styles.emptyText}>No sessions on this day.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#111827', marginBottom: 15, marginTop: 10 },
  calendarContainer: { marginBottom: 20, borderRadius: 12, overflow: 'hidden', elevation: 3, backgroundColor: 'white' },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  emptyContainer: { alignItems: 'center', marginTop: 20 },
  emptyText: { color: '#888', fontStyle: 'italic', marginTop: 10 },
  card: { borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, elevation: 2 },
  upcomingCard: { backgroundColor: '#FFF', borderColor: '#2D52A2', borderLeftWidth: 5 },
  pastCard: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subject: { fontSize: 16, fontWeight: 'bold', color: '#2D52A2' },
  title: { fontSize: 15, fontWeight: '600', marginBottom: 10, color: '#1F2937' },
  
  badge: { backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#1976D2' },
  
  badgePurple: { backgroundColor: '#EDE9FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeTextPurple: { fontSize: 10, fontWeight: 'bold', color: '#5B21B6' },

  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  info: { marginLeft: 8, fontSize: 14, color: '#555' },
  pastText: { color: '#9CA3AF' },

  actionRow: { flexDirection: 'row', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#EEE', justifyContent: 'flex-end', gap: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1 },
  qrButton: { borderColor: '#2D52A2', backgroundColor: '#F5F7FA' },
  editButton: { borderColor: '#FFE0B2', backgroundColor: '#FFF3E0' },
  cancelButton: { borderColor: '#FFCDD2', backgroundColor: '#FFEBEE' },
  actionText: { fontWeight: '600', fontSize: 12, marginLeft: 4 },
});