import React, { useState, useContext, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Platform, Alert } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
// Import updateSession here
import { createSession, updateSession } from '../api';
import { AuthContext } from '../context/AuthContext';

export default function SessionCreateScreen({ route, navigation }) {
  const { user } = useContext(AuthContext);
  // Check if we are in "Edit Mode" by seeing if a session was passed
  const { sessionToEdit } = route.params || {};
  // True if we have any incoming data (edit or copy)
  const isPreFilled = !!sessionToEdit;
  // True if we are editing an existing session (has session_id)
  const isEditMode = !!(sessionToEdit && sessionToEdit.session_id);

  const tutor_id = user?.user_id;
  const platform = Platform.OS === 'ios' ? true : false;
  
  // Initialize state: If editing, use existing data. If new, use defaults.
  const [title, setTitle] = useState(isPreFilled ? sessionToEdit.title : '');
  const [subject, setSubject] = useState(isPreFilled ? sessionToEdit.subject : '');
  const [location, setLocation] = useState(isPreFilled ? sessionToEdit.location : '');
  
  const [startDate, setStartDate] = useState(isPreFilled ? new Date(sessionToEdit.start_time) : new Date());
  const [endDate, setEndDate] = useState(isPreFilled ? new Date(sessionToEdit.end_time) : new Date());

  // Date Picker State
  const [chooseTimeDate, setChooseTimeDate] = useState('Date');
  const [mode, setMode] = useState('date');
  const [showDatePicker, setShowDatePicker] = useState(platform);
  const [inlineDisplay, setInlineDisplay] = useState('inline');

  // Update navigation title based on mode
  useEffect(() => {
    navigation.setOptions({ title: isPreFilled ? (isEditMode ? 'Edit Session' : 'Copy Session') : 'New Session' });
  }, [navigation, isPreFilled, isEditMode]);

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);

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

  const handleSubmit = async () => {
    if (!title || !subject || !location) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (endDate <= startDate) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    try {
      const sessionData = { 
        tutor_id, 
        title, 
        subject, 
        start_time: startDate.toISOString(), 
        end_time: endDate.toISOString(), 
        location,
        status: sessionToEdit?.status || 'open'
      };

      if (isEditMode) {
        // UPDATE Existing
        await updateSession(sessionToEdit.session_id, sessionData);
        Alert.alert('Success', 'Session updated successfully!');
      } else {
        // CREATE New
        await createSession(sessionData);
        Alert.alert('Success', 'Session created successfully!');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Operation failed');
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.headerText}>{isPreFilled ? (isEditMode ? 'Edit Session Details' : 'Copy Session Details') : 'Session Details'}</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} placeholder="e.g. Linear Algebra I" onChangeText={setTitle} value={title} />
        
        <Text style={styles.label}>Subject</Text>
        <TextInput style={styles.input} placeholder="e.g. CSC 4352" onChangeText={setSubject} value={subject} />
        
        <Text style={styles.label}>Location</Text>
        <TextInput style={styles.input} placeholder="e.g. Langdale Hall Room 225" onChangeText={setLocation} value={location} />

        {/* Date and time picker UI */}
        <View style={styles.row}>
          <TouchableOpacity 
            style={[styles.timeCard, chooseTimeDate === 'Date' && styles.activeCard]} 
            onPress={() => { setChooseTimeDate('Date'); setMode('date'); setShowDatePicker(true); setInlineDisplay('inline'); }}
          >
            <Text style={styles.cardLabel}>Date</Text>
            <Text style={styles.timeValue}>{startDate.toLocaleDateString()}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.timeCard, chooseTimeDate === 'Start' && styles.activeCard]} 
            onPress={() => { setChooseTimeDate('Start'); setMode('time'); setShowDatePicker(true); setInlineDisplay('spinner'); }}
          >
            <Text style={styles.cardLabel}>Start</Text>
            <Text style={styles.timeValue}>{startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.timeCard, chooseTimeDate === 'End' && styles.activeEndCard]} 
            onPress={() => { setChooseTimeDate('End'); setMode('time'); setShowDatePicker(true); setInlineDisplay('spinner'); }}
          >
            <Text style={styles.cardLabel}>End</Text>
            <Text style={styles.timeValue}>{endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <View style={{ alignItems: 'center', marginVertical: 10 }}>
            <RNDateTimePicker
              value={chooseTimeDate === 'Start' ? startDate : endDate}
              mode={mode}
              is24Hour={false}
              display={Platform.OS === 'ios' ? inlineDisplay : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          </View>
        )}
      </View>

      <TouchableOpacity style={[styles.submitButton, { backgroundColor: '#2D52A2' }]} onPress={handleSubmit}>
        <Text style={styles.submitText}>{isPreFilled ? (isEditMode ? 'Save Changes' : 'Create Copy') : 'Create Session'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#FFF', padding: 24 },
  headerText: { fontSize: 26, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 6 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginBottom: 20, fontSize: 16 },
  submitButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20, marginBottom: 50 },
  submitText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  form: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  timeCard: { width: '30%', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  activeCard: { borderColor: "#2D52A2", backgroundColor: "#E9EFFD" },
  activeEndCard: { borderColor: "#4CAF50", backgroundColor: "#E8F5E9" },
  cardLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  timeValue: { fontSize: 12, color: '#666' }
});