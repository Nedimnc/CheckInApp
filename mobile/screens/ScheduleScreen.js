import React, { useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Alert, LayoutAnimation, FlatList, Easing } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getSessions, getUsers, cancelSession, unbookSession } from '../api';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import socket from '../services/socket';
import SessionBlock from '../components/SessionBlock';
import theme from '../styles/theme';

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
    <View>
      <FlatList
        data={daySessions}
        keyExtractor={(item) => item.session_id.toString()}
        renderItem={({ item }) => (
          <SessionBlock
            session={item}
            currentUser={user}
            users={users}
            onPressQR={() => navigation.navigate('SessionQR', { session: item })}
            onPressCopy={() => {
              const { session_id, student_id, ...sessionCopy } = item;
              navigation.navigate('SessionCreate', { sessionToEdit: { ...sessionCopy, status: 'open' } });
            }}
            onPressEdit={() => navigation.navigate('SessionCreate', { sessionToEdit: item })}
            onPressCancel={() => handleTutorCancel(item.session_id)}
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
        contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: 50 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitle: { fontSize: theme.typography.h1, fontWeight: 'bold', color: theme.colors.text, marginBottom: theme.spacing.md },
  calendarContainer: { marginBottom: theme.spacing.lg, borderRadius: theme.radii.md, overflow: 'hidden', elevation: 3, backgroundColor: theme.colors.card },
  sectionTitle: { fontSize: theme.typography.h3, fontWeight: 'bold', color: theme.colors.text, marginBottom: theme.spacing.md },
  emptyContainer: { alignItems: 'center', marginTop: theme.spacing.md },
  emptyText: { color: theme.colors.muted, fontStyle: 'italic', marginTop: theme.spacing.xs },

  toggleContainer: { flexDirection: 'row', backgroundColor: '#dedede', borderRadius: 25, padding: theme.spacing.xxs, marginBottom: theme.spacing.lg },
  slidingPill: {
    position: 'absolute', top: 4, bottom: 4, width: '50%', backgroundColor: theme.colors.primary,
    borderRadius: 21, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3,
  },
  filterButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 21 },
  filterButtonActive: { backgroundColor: theme.colors.primary, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  filterButtonText: { color: '#666', fontWeight: '600' },
  filterButtonTextActive: { color: '#FFF' },
});