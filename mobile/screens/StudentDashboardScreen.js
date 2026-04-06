import React, { useState, useContext, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, LayoutAnimation, Animated, Easing } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getSessions, getUsers, bookSession, unbookSession } from '../api';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import socket from '../services/socket';
import SessionBlock from '../components/SessionBlock';
import theme from '../styles/theme';
import NetInfo from '@react-native-community/netinfo'; // Offline detection
import * as SecureStore from 'expo-secure-store';       // Read pending queue count
import Toast from 'react-native-toast-message';

export default function StudentDashboardScreen({ navigation }) {
  const [filter, setFilter] = useState('');
  const { user } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);    // ADDED
  const [pendingCount, setPendingCount] = useState(0);  // ADDED

  // Subscribe to network state for the offline banner
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!(state.isConnected && state.isInternetReachable));
    });
    return () => unsubscribe();
  }, []);

    // Refresh pending badge whenever screen comes into focus
  useEffect(() => {
    if (isFocused) {
      SecureStore.getItemAsync('checkins').then((data) => {
        const queue = data ? JSON.parse(data) : [];
        setPendingCount(queue.length);
      });
    }
  }, [isFocused]);

  // Poll every 3 seconds to clear badge/banner once sync completes in background 
  useEffect(() => {
    if (pendingCount === 0) return;
    const interval = setInterval(async () => {
      const data = await SecureStore.getItemAsync('checkins');
      const queue = data ? JSON.parse(data) : [];
      if (queue.length === 0) {
        setPendingCount(0);
        loadData();
        Toast.hide();
        Toast.show({
          type: 'success',
          text1: 'Sync Complete!',
          text2: 'Your attendance records have been updated.',
        });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pendingCount]);

  useEffect(() => {
    if (isFocused && !isOffline) {
      console.log("Back online, refreshing session data");
      loadData();
    }
  }, [isFocused, isOffline]);

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
              Toast.hide();
              setTimeout(() => {
                Toast.show({
                  type: 'success',
                  text1: 'Session Booked',
                  text2: `You have successfully booked ${session.subject}.`
                });
              }, 500);
            } catch (error) {
              const serverMessage = error.message || 'Could not complete the request.';
              if (serverMessage.includes("Invalid token")) {
                console.log("Auth error caught via string matching - silencing local alert.");
                return;
              }
              Toast.hide();
              setTimeout(() => {
                Toast.show({
                  type: 'error',
                  text1: 'Action Failed.',
                  text2: `${serverMessage}`
                });
              }, 500);
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
              Toast.hide();
              setTimeout(() => {
                Toast.show({
                  type: 'success',
                  text1: 'Session Unbooked',
                  text2: `You have successfully unbooked ${session.subject}.`
                });
              }, 500);
            } catch (error) {
              if (error.response && error.response.status !== 403 && error.response.status !== 401) {
                Toast.show({
                  type: 'error',
                  text1: 'Unbooking Failed',
                  text2: `Could not unbook ${session.subject}. Please try again.`
                });
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
          (users.find(u => u.user_id === session.tutor_id)?.name || '').toLowerCase().includes(filter.toLowerCase()) ||
          session.title.toLowerCase().includes(filter.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }, [sessions, filter, users]);

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <View style={{ flex: 1 }}>
      {/* Offline banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
          <Text style={styles.offlineBannerText}>
            Offline Mode — Scans will be queued{pendingCount > 0 ? ` (${pendingCount} pending)` : ''}
          </Text>
        </View>
      )}

      {/* Back online with pending items */}
      {!isOffline && pendingCount > 0 && (
        <View style={styles.pendingBanner}>
          <Ionicons name="sync-outline" size={16} color="#1976D2" />
          <Text style={styles.pendingBannerText}>Syncing {pendingCount} queued check-in{pendingCount > 1 ? 's' : ''}...</Text>
        </View>
      )}

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
        {/* Red dot badge when there are pending check-ins */}
        {pendingCount > 0 && <View style={styles.badgeDot} />}
      </TouchableOpacity>
    </View>
  );

}

const styles = StyleSheet.create({
  // ADDED: offline/pending banners
  offlineBanner: {
    backgroundColor: '#B71C1C', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 8, gap: 6,
  },
  offlineBannerText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  pendingBanner: {
    backgroundColor: '#E3F2FD', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 8, gap: 6,
  },
  pendingBannerText: { color: '#1976D2', fontSize: 13, fontWeight: '600' },
  // ADDED: badge dot on floating button
  badgeDot: {
    position: 'absolute', top: 8, right: 8, width: 12, height: 12,
    borderRadius: 6, backgroundColor: '#D32F2F', borderWidth: 2, borderColor: '#fff',
  },

  scrollContent: { padding: theme.spacing.md, paddingBottom: 50 },
  headerText: { fontSize: theme.typography.h1, fontWeight: 'bold', color: theme.colors.text, marginBottom: theme.spacing.md },
  input: {
    backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.md,
    padding: theme.spacing.md, marginBottom: theme.spacing.md, fontSize: theme.typography.body,
  },
  emptyText: { textAlign: 'center', marginTop: theme.spacing.lg, color: theme.colors.muted },
  floatingButtonStyle: {
    position: 'absolute', width: 60, height: 60, alignItems: 'center',
    justifyContent: 'center', right: 30, bottom: 30, backgroundColor: theme.colors.primary,
    borderRadius: 30, elevation: 5, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4
  },
  animatedContainer: { position: 'absolute', width: '100%', paddingHorizontal: theme.spacing.xxs },
});