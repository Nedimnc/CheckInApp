import React, { useState, useContext, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
// Added getUsers to imports
import { getSessions, cancelSession, getUsers } from '../api';
import { useIsFocused } from '@react-navigation/native';

export default function TutorDashboardScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]); // Store list of users
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    try {
      // Fetch both Sessions and Users so we can match IDs to Names
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

  const handleCancelSession = (sessionId) => {
    Alert.alert(
      "Cancel Session",
      "Are you sure you want to cancel this session? This cannot be undone.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelSession(sessionId, user.user_id);
              setSessions(prev => prev.filter(s => s.session_id !== sessionId));
              Alert.alert("Success", "Session cancelled.");
            } catch (error) {
              Alert.alert("Error", "Could not cancel session.");
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.headerText}>Your Sessions</Text>
        <TextInput
          style={styles.input}
          placeholder="Search by course, title, or student..."
          onChangeText={setFilter}
          value={filter}
        />

        {sessions
          .filter((session) => {
            const matchesSearch = session.subject.toLowerCase().includes(filter.toLowerCase()) ||
              users.find(u => u.user_id === session.student_id)?.name.toLowerCase().includes(filter.toLowerCase()) || 
              session.title.toLowerCase().includes(filter.toLowerCase());
            return matchesSearch;
          })
          .filter((session) => session.tutor_id === user?.user_id)
          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
          .map((session) => {
            // Find the student if one is assigned
            const student = session.student_id ? users.find(u => u.user_id === session.student_id) : null;
            const isBooked = session.status === 'booked';
            const isCheckedIn = session.status === 'checked_in'; // <-- ADDED THIS

            return (
              <View key={session.session_id} style={[styles.sessionCard, isCheckedIn && styles.checkedInSessionCard, isBooked && styles.bookedSessionCard, !isBooked && !isCheckedIn && styles.openSessionCard]}>

                {/* Session Info */}
                <View style={styles.cardHeader}>
                  <Text style={styles.subjectText}>{session.subject}: {session.title}</Text>
                  {/* UPDATED BADGE LOGIC */}
                  <View style={[styles.statusBadge, isCheckedIn ? styles.checkedInBadge : (isBooked ? styles.bookedBadge : styles.openBadge)]}>
                    <Text style={[styles.statusText, isCheckedIn ? styles.checkedInText : (isBooked ? styles.bookedText : styles.openText)]}>
                      {isCheckedIn ? 'CHECKED IN ✓' : (isBooked ? 'BOOKED' : 'OPEN')}
                    </Text>
                  </View>
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

                {/* UPDATED: Student Info Section (Visible if Booked OR Checked In) */}
                {(isBooked || isCheckedIn) && student && (
                  <View style={styles.studentInfoBox}>
                    <Text style={styles.studentLabel}>Booked Student:</Text>
                    <View style={styles.studentRow}>
                      <Ionicons name="person" size={16} color={isCheckedIn ? '#5B21B6' : '#2E7D32'} />
                      <Text style={styles.studentName}>{student.name}</Text>
                    </View>
                    <View style={styles.studentRow}>
                      <Ionicons name="card-outline" size={16} color="#555" />
                      <Text style={styles.studentId}>ID: {student.panther_id || 'N/A'}</Text>
                    </View>
                  </View>
                )}

                {/* ACTION BUTTONS */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.qrButton]}
                    onPress={() => navigation.navigate('SessionQR', { session: session })}
                  >
                    <Ionicons name="qr-code-outline" size={18} color="#2D52A2" />
                    <Text style={[styles.actionText, { color: '#2D52A2' }]}>QR</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.copyButton]}
                    onPress={() => {
                      const { session_id, student_id, ...sessionCopy } = session;
                      navigation.navigate('SessionCreate', {
                        sessionToEdit: { ...sessionCopy, status: 'open' }
                      });
                    }}
                  >
                    <Ionicons name="copy-outline" size={18} color='#679968' />
                    <Text style={[styles.actionText, { color: '#679968' }]}>Copy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => navigation.navigate('SessionCreate', { sessionToEdit: session })}
                  >
                    <Ionicons name="create-outline" size={18} color="#F57C00" />
                    <Text style={[styles.actionText, { color: '#F57C00' }]}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => handleCancelSession(session.session_id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#D32F2F" />
                    <Text style={[styles.actionText, { color: '#D32F2F' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>

              </View>
            );
          })}

        {sessions.filter(s => s.tutor_id === user?.user_id).length === 0 && (
          <Text style={styles.emptyText}>No sessions posted yet.</Text>
        )}

      </ScrollView>
      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.floatingButtonStyle, { backgroundColor: '#2D52A2' }]}
        onPress={() => navigation.navigate('SessionCreate')}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 100 },
  headerText: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  sessionCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,
    shadowRadius: 8, elevation: 4, borderLeftWidth: 5, borderLeftColor: '#2D52A2'
  },
  openSessionCard: { borderLeftColor: '#2D52A2', backgroundColor: '#FFF' },
  bookedSessionCard: { borderLeftColor: '#2E7D32', backgroundColor: '#FFF' },
  checkedInSessionCard: { borderLeftColor: '#5B21B6', backgroundColor: '#FFF' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subjectText: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, paddingRight: 5 },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  openBadge: { backgroundColor: '#E3F2FD' },
  bookedBadge: { backgroundColor: '#E8F5E9' },
  checkedInBadge: { backgroundColor: '#EDE9FE' },

  statusText: { fontSize: 12, fontWeight: 'bold' },
  openText: { color: '#1976D2' },
  bookedText: { color: '#2E7D32' },
  checkedInText: { color: '#5B21B6' },

  titleText: { fontSize: 16, color: '#333', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoText: { marginLeft: 8, color: '#555', fontSize: 14 },

  studentInfoBox: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  studentLabel: { fontSize: 12, color: '#888', marginBottom: 4, fontWeight: '600' },
  studentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  studentName: { marginLeft: 8, fontWeight: 'bold', color: '#333' },
  studentId: { marginLeft: 8, color: '#666', fontSize: 12 },

  actionRow: {
    flexDirection: 'row', marginTop: 15, paddingTop: 15, borderTopWidth: 1,
    borderTopColor: '#EEE', justifyContent: 'space-between', gap: 10
  },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    paddingHorizontal: 12, borderRadius: 8, borderWidth: 1
  },
  qrButton: { borderColor: '#CDD4FF', backgroundColor: '#F5F7FA' },
  copyButton: { borderColor: '#b6e0b5', backgroundColor: '#f5fff5' },
  editButton: { borderColor: '#FFE0B2', backgroundColor: '#FFF3E0' },
  cancelButton: { borderColor: '#FFCDD2', backgroundColor: '#FFEBEE' },
  actionText: { fontWeight: '600', fontSize: 13, marginLeft: 6 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 30, fontSize: 16 },
  floatingButtonStyle: {
    position: 'absolute', width: 60, height: 60, alignItems: 'center',
    justifyContent: 'center', right: 30, bottom: 30, backgroundColor: '#2D52A2',
    borderRadius: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 4
  },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    padding: 15, marginBottom: 20, fontSize: 16, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8,
  },
});