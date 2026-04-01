import React, { useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, TextInput, LayoutAnimation, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
// Added getUsers to imports
import { getSessions, cancelSession, getUsers } from '../api';
import { useIsFocused } from '@react-navigation/native';
import socket from '../services/socket';
import SessionBlock from '../components/SessionBlock';

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

  useEffect(() => {
    const handleBooked = (updatedSession) => {
      requestAnimationFrame(() => {
        if (updatedSession.tutor_id === user.user_id) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setSessions(prev => prev.map(s => s.session_id === updatedSession.session_id ? updatedSession : s));
        }
      });
    };
    const handleUnbooked = (updatedSession) => {
      requestAnimationFrame(() => {
        if (updatedSession.tutor_id === user.user_id) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setSessions(prev => prev.map(s => s.session_id === updatedSession.session_id ? updatedSession : s));
        }
      });
    };

    socket.on('session_booked', handleBooked);
    socket.on('session_unbooked', handleUnbooked);

    return () => {
      socket.off('session_booked', handleBooked);
      socket.off('session_unbooked', handleUnbooked);
    };
  }, [user.user_id]);

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

  const filteredSessions = useMemo(() => {
    const now = new Date();
    return sessions
      .filter((session) => {
        if (session.tutor_id !== user?.user_id) return false;
        const startTime = new Date(session.start_time);
        const endTime = new Date(session.end_time);
        const isVisible = session.status === 'open' ? startTime > now : endTime > now;
        if (!isVisible) return false;
        const matchesSearch =
          session.subject.toLowerCase().includes(filter.toLowerCase()) ||
          users.find(u => u.user_id === session.student_id)?.name.toLowerCase().includes(filter.toLowerCase()) ||
          session.title.toLowerCase().includes(filter.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }, [sessions, users, filter, user]);

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
            student={users.find(u => u.user_id === item.student_id)}
            onPressQR={() => navigation.navigate('SessionQR', { session: item })}
            onPressCopy={() => {
              const { session_id, student_id, ...sessionCopy } = item;
              navigation.navigate('SessionCreate', { sessionToEdit: { ...sessionCopy, status: 'open' } });
            }}
            onPressEdit={() => navigation.navigate('SessionCreate', { sessionToEdit: item })}
            onPressCancel={() => handleCancelSession(item.session_id)}
          />
        )}
        ListHeaderComponent={
          <>
            <Text style={styles.headerText}>Your Sessions</Text>
            <TextInput
              style={styles.input}
              placeholder="Search by course, title, or student..."
              onChangeText={setFilter}
              value={filter}
            />
          </>
        }
        ListEmptyComponent={<Text style={styles.emptyText}>No sessions posted yet.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      />

      <TouchableOpacity
        style={[styles.floatingButtonStyle, { backgroundColor: '#2D52A2' }]}
        onPress={() => navigation.navigate('SessionCreate')}
      >
        <Ionicons name="calendar-outline" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );

}


const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 100 },
  headerText: { fontSize: 30, fontWeight: 'bold', color: '#111827', marginBottom: 15 },
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
    marginTop: 15, padding: 12, backgroundColor: '#F9FAFB',
    borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB',
  },
  studentLabel: { fontSize: 12, color: '#888', marginBottom: 4, fontWeight: '600' },
  studentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  studentName: { marginLeft: 8, fontWeight: 'bold', color: '#333' },
  studentId: { marginLeft: 8, color: '#666', fontSize: 12 },

  actionRow: {
    flexDirection: 'row', marginTop: 15, paddingTop: 15, borderTopWidth: 1,
    borderTopColor: '#EEE'
  },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    paddingHorizontal: 12, borderRadius: 30, borderWidth: 1, marginRight: 10
  },
  actionRowContainer: {
    marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#EEE'
  },
  actionRowScroll: {
    flexDirection: 'row', alignItems: 'center', paddingLeft: 2, paddingRight: 8
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