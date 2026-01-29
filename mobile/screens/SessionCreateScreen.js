import React, { useState, useContext } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { createSession } from '../api';
import { AuthContext } from '../context/AuthContext';

export default function SessionCreateScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const tutor_id = user?.user_id;
  const platform = Platform.OS === 'ios' ? true : false;
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [location, setLocation] = useState('');
  const [chooseTimeDate, setChooseTimeDate] = useState('Date');

  const [mode, setMode] = useState('date');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(platform);

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      if (chooseTimeDate === 'Date') {
        const updatedStart = new Date(startDate);
        updatedStart.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        setStartDate(updatedStart);
        const updatedEnd = new Date(endDate);
        updatedEnd.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        setEndDate(updatedEnd);
      } else if (chooseTimeDate === 'Start') {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
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
      const sessionData = { tutor_id, title, subject, start_time: startDate.toISOString(), end_time: endDate.toISOString(), location };
      await createSession(sessionData);
      Alert.alert('Success', 'Session created successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Session creation failed');
    }
  };

  return (
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
        {/* Date and time picker */}
        <View style={styles.row}>
          {/* session date card */}
          <TouchableOpacity
            style={[styles.timeCard, chooseTimeDate === 'Date' && { borderColor: "#2D52A2", backgroundColor: "#E9EFFD" }]}
            onPress={() => {
              setChooseTimeDate('Date');
              setMode('date');
              setShowDatePicker(true);
            }}
          >
            <Text style={styles.cardLabel}>Session Date</Text>
            <Text style={styles.timeValue}>{startDate.toLocaleDateString()}</Text>
            <View style={[styles.indicator, { backgroundColor: "#2D52A2" }]} />
          </TouchableOpacity>
          {/* start time card */}
          <TouchableOpacity
            style={[styles.timeCard, chooseTimeDate === 'Start' && { borderColor: "#2D52A2", backgroundColor: "#E9EFFD" }]}
            onPress={() => {
              setChooseTimeDate('Start');
              setMode('time');
              setShowDatePicker(true);
            }}
          >
            <Text style={styles.cardLabel}>Start Time</Text>
            <Text style={styles.timeValue}>
              {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <View style={[styles.indicator, { backgroundColor: "#2D52A2" }]} />
          </TouchableOpacity>
          {/* end time card */}
          <TouchableOpacity
            style={[styles.timeCard, chooseTimeDate === 'End' && { borderColor: "#4CAF50", backgroundColor: "#E8F5E9" }]}
            onPress={() => {
              setChooseTimeDate('End');
              setMode('time');
              setShowDatePicker(true);
            }}
          >
            <Text style={styles.cardLabel}>End Time</Text>
            <Text style={styles.timeValue}>
              {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <View style={[styles.indicator, { backgroundColor: "#4CAF50" }]} />
          </TouchableOpacity>
        </View>
        {showDatePicker && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <RNDateTimePicker
              key={`${chooseTimeDate}-${mode}`}
              value={chooseTimeDate === 'Start' ? startDate : endDate}
              mode={mode}
              is24Hour={false}
              display={Platform.OS === 'ios' ? (mode === 'date' ? 'inline' : 'spinner') : 'default'}
              minimumDate={new Date()}
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
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 24,
  },
  headerText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
    marginTop: -10,
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
    marginBottom: 20,
  },
  submitText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  form: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  timeCard: {
    backgroundColor: '#FFF',
    width: '32%',
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
    fontSize: 13,
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