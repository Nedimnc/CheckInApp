import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { registerUser } from '../api'; // Import the helper we just made
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';


export default function RegisterScreen({ navigation }) {
  const headerHeight = useHeaderHeight();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [panther_id, setPantherId] = useState('');
  const [role, setRole] = useState('student'); // Default role
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const primaryColor = role === 'student' ? '#2D52A2' : '#4CAF50';
  const lightBg = role === 'student' ? '#E9EFFD' : '#E8F5E9';

  const handleRegister = async () => {
    if (!name || !email || !password || !panther_id) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!email.endsWith('@gsu.edu') && !email.endsWith('@student.gsu.edu')) {
      Alert.alert('Error', 'Please use a valid GSU email address');
      return;
    }
    try {
      const userData = { name, email, password, panther_id, role };
      const user = await registerUser(userData);
      Alert.alert('Success', `Account created for ${user.name}!`);
      // Navigate back to the login page
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Registration failed');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent, { paddingBottom: headerHeight }]}
          bounces={true}
          keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.header}>Join the community</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === 'student' && { borderColor: '#2D52A2', backgroundColor: lightBg }
              ]}
              onPress={() => setRole('student')}
            >
              <Text style={styles.icon}>🎒</Text>
              <Text style={[styles.roleText, role === 'student' && { color: '#2D52A2' }]}>Student</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === 'tutor' && { borderColor: '#4CAF50', backgroundColor: lightBg }
              ]}
              onPress={() => setRole('tutor')}
            >
              <Text style={styles.icon}>📖</Text>
              <Text style={[styles.roleText, role === 'tutor' && { color: '#4CAF50' }]}>Tutor</Text>
            </TouchableOpacity>
          </View>
          {/* Input form */}
          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Jane Doe"
              onChangeText={setName}
              value={name}
            />
            <Text style={styles.label}>GSU Email</Text>
            <TextInput
              style={styles.input}
              placeholder="email@gsu.edu"
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={setEmail}
              value={email}
            />
            <Text style={styles.label}>Panther ID</Text>
            <TextInput
              style={styles.input}
              placeholder="002-XXXX-XX"
              keyboardType="numeric"
              onChangeText={setPantherId}
              value={panther_id}
            />
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                secureTextEntry={!isPasswordVisible}
                onChangeText={setPassword}
                value={password}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                <Ionicons
                  name={isPasswordVisible ? 'eye-off' : 'eye'}
                  size={24}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: primaryColor }]}
              onPress={handleRegister}
            >
              <Text style={styles.submitText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
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
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E1E8ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleText: {
    fontWeight: '600',
    color: '#888',
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    height: '70%',
    justifyContent: 'top',
  },
});