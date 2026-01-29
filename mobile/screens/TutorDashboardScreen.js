import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { getSessions } from '../api';
import { useIsFocused } from '@react-navigation/native';

export default function TutorDashboard({ navigation }) {
  const { user } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (isFocused)
      loadData();
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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 200);
    loadData();
  }, []);

  if (loading) return <ActivityIndicator size="large" />;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.scrollContent}>
          <View>
            <Text style={styles.headerText}>Your Sessions</Text>
            {sessions
              .filter((session) => session.tutor_id === user?.user_id)
              .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
              .map((session) => (
                <View key={session.session_id} style={styles.sessionCard}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{session.subject}: {session.title}</Text>
                  <Text>Date: {new Date(session.start_time).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                  <Text>Time: {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  <Text>Location: {session.location}</Text>
                </View>
              ))}
          </View>
        </View>
      </ScrollView>
      <TouchableOpacity
        style={[styles.floatingButtonStyle, { backgroundColor: '#2D52A2' }]}
        onPress={() => navigation.navigate('SessionCreate', { tutor_id: user?.user_id })}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
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
  mainCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
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
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  floatingButtonStyle: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 30,
    bottom: 30,
    backgroundColor: '#2D52A2',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  }
});