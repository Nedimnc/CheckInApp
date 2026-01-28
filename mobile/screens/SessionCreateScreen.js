import React, { useState, useContext } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createSession } from '../api';
import { AuthContext } from '../context/AuthContext';

export default function SessionCreateScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const tutor_id = user?.user_id;
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('Start'); // Default role
  const primaryColor = time === 'Start' ? '#2D52A2' : '#4CAF50';
  const lightBg = time === 'Start' ? '#E9EFFD' : '#E8F5E9';

  const [mode, setMode] = useState('date');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onDateChange = (event, selectedDate) => {
    if (!selectedDate) return;
    setShowDatePicker(Platform.OS === 'ios');
    if (time === 'Start') {
      setStartDate(selectedDate);
    } else {
      setEndDate(selectedDate);
    }
  };

  const handleCreateSession = async () => {
    if (!title || !subject || !location) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (endDate <= startDate) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }
    try {
      console.log({
        title,
        subject,
        location,
        tutor_id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString()
      });
      const sessionData = { tutor_id, title, subject, start_time: startDate.toISOString(), end_time: endDate.toISOString(), location };
      const session = await createSession(sessionData);
      Alert.alert('Success', 'Session created successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Session creation failed');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#f3f4f600' }}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.headerText}>Session Details</Text>
          {/* Input fields */}
          <View style={styles.form}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Linear Algebra I"
              onChangeText={setTitle}
              value={title}
            />
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. CSC 4352"
              onChangeText={setSubject}
              value={subject}
            />
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Langdale Hall Room 225"
              onChangeText={setLocation}
              value={location}
            />
            {/* Start and end time selection */}
            <Text style={styles.text}>Time Slot</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.timeCard,
                  time === 'Start' && { borderColor: '#2D52A2', backgroundColor: lightBg }
                ]}
                onPress={() => setTime('Start')}
              >
                <Text style={[styles.roleText, time === 'Start' && { color: primaryColor }]}>Start</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.timeCard,
                  time === 'End' && { borderColor: '#4CAF50', backgroundColor: lightBg }
                ]}
                onPress={() => setTime('End')}
              >
                <Text style={[styles.roleText, time === 'End' && { color: primaryColor }]}>End</Text>
              </TouchableOpacity>
            </View>
            {/* Date and time picker */}
            <View style={styles.row}>
              <TouchableOpacity style={styles.timeCard} onPress={() => { setShowDatePicker(true); setMode('date'); }}>
                <Text style={styles.cardLabel}>{time} Date</Text>
                <Text style={styles.timeValue}>
                  {(time === 'Start' ? startDate : endDate).toLocaleDateString()}
                </Text>
                <View style={[styles.indicator, { backgroundColor: primaryColor }]} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.timeCard} onPress={() => { setShowDatePicker(true); setMode('time'); }}>
                <Text style={styles.cardLabel}>{time} Time</Text>
                <Text style={styles.timeValue}>
                  {(time === 'Start' ? startDate : endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <View style={[styles.indicator, { backgroundColor: primaryColor }]} />
              </TouchableOpacity>
            </View>
            {/* 5. Render Picker conditionally */}
            {showDatePicker && (
              <View style={{ alignItems: 'center', width: '100%', marginBottom: 20 }}>
                <DateTimePicker
                  value={time === 'Start' ? startDate : endDate}
                  mode={mode}
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                />
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: '#2D52A2' }]}
            onPress={handleCreateSession}
          >
            <Text style={styles.submitText}>Create Session</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  headerText: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#111827',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
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
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#111827',
  },
  form: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  timeCard: {
    backgroundColor: '#FFF',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  indicator: {
    height: 3,
    width: '60%',
    borderRadius: 2,
    position: 'absolute',
    bottom: 12,
  },
  roleText: {
    fontWeight: '600',
    color: '#888',
  },
});