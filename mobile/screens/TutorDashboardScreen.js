import React, { useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, TextInput, LayoutAnimation, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
// Added getUsers to imports
import { getSessions, cancelSession, getUsers } from '../api';
import { useIsFocused } from '@react-navigation/native';
import socket from '../services/socket';
import SessionBlock from '../components/SessionBlock';
import theme from '../styles/theme';
import Toast from 'react-native-toast-message';

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
    const handleCheckIn = (data) => {
      const { session } = data;
      requestAnimationFrame(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSessions(prev =>
          prev.map(s => s.session_id === session.session_id ? session : s)
        );
      });
    };

    socket.on('session_booked', handleBooked);
    socket.on('session_unbooked', handleUnbooked);
    socket.on('student_checked_in', handleCheckIn);

    return () => {
      socket.off('session_booked', handleBooked);
      socket.off('session_unbooked', handleUnbooked);
      socket.off('student_checked_in', handleCheckIn);
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
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setSessions(prev => prev.filter(s => s.session_id !== sessionId));
              Toast.hide();
              setTimeout(() => {
                Toast.show({
                  type: 'success',
                  text1: 'Session Cancelled',
                  text2: "The session has been removed from your schedule."
                });
              }, 500);
            } catch (error) {
              Toast.hide();
              setTimeout(() => {
                Toast.show({
                  type: 'error',
                  text1: 'Failed to Cancel Session',
                  text2: "Could not cancel the session."
                });
              }, 500);
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
  scrollContent: { flexGrow: 1, padding: theme.spacing.md, paddingBottom: 100 },
  headerText: { fontSize: theme.typography.h1, fontWeight: 'bold', color: theme.colors.text, marginBottom: theme.spacing.md },
  input: {
    backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.md,
    padding: theme.spacing.md, marginBottom: theme.spacing.md, fontSize: theme.typography.body,
  },
  emptyText: { textAlign: 'center', color: theme.colors.muted, marginTop: theme.spacing.lg, fontSize: theme.typography.body },
  floatingButtonStyle: {
    position: 'absolute', width: 60, height: 60, alignItems: 'center',
    justifyContent: 'center', right: 30, bottom: 30, backgroundColor: theme.colors.primary,
    borderRadius: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 4
  },
});