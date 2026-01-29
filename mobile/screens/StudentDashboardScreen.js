import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getSessions } from '../api';
import { useIsFocused } from '@react-navigation/native';
import { getUsers } from '../api';

export default function StudentDashboard({ navigation }) {
  const [filter, setFilter] = useState('');
  const { user } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = React.useState(false);

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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 200);
    loadData();
    loadUsers();
  }, []);

  if (loading) return <ActivityIndicator size="large" />;

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.scrollContent}>
        <TextInput
          style={styles.input}
          placeholder="Search by course or tutor (e.g. CS1301, John Doe)"
          onChangeText={setFilter}
          value={filter}
        />
        {sessions
          .filter((session) => session.subject.toLowerCase().includes(filter.toLowerCase()) || users.find(u => u.user_id === session.tutor_id)?.name.toLowerCase().includes(filter.toLowerCase()))
          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
          .map((session) => (
            <View key={session.session_id} style={styles.sessionCard}>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{session.subject}: {session.title}</Text>
              <Text>Date: {new Date(session.start_time).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
              <Text>Time: {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <Text>Location: {session.location}</Text>
              {/* session has tutor_id, tutor_id == user.user_id, user_id can be used to get tutor name */}
              <Text>Tutor: {users.find(u => u.user_id === session.tutor_id)?.name || 'Loading...'}</Text>
            </View>
          ))}
      </View>
    </ScrollView >
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 20,
  },
  sessionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    marginTop: 10,
  },
});