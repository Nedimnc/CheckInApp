import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Touchable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {registerUser } from '../api'; // Import the helper we just made
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation }) {
  const [role, setRole] = useState('student'); // Default role
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    panther_id: '',
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Dynamic styles based on role
  const primaryColor = role === 'student' ? '#2D52A2' : '#4CAF50';
  const lightBg = role === 'student' ? '#E9EFFD' : '#E8F5E9';

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.panther_id) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!formData.email.endsWith('@gsu.edu') && !formData.email.endsWith('@student.gsu.edu')) {
      Alert.alert('Error', 'Please use a valid GSU email address');
      return;
    }
    try {
      const userData = { ...formData, role };
      const user = await registerUser(userData);
      Alert.alert('Success', `Account created for ${user.name}!`);
      // Navigate back to the login page
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Registration failed');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 115 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          bounces={false} 
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
                onChangeText={(val) => handleInputChange('name', val)}
                value={formData.name}
              />

              <Text style={styles.label}>GSU Email</Text>
              <TextInput 
                style={styles.input}
                placeholder="email@gsu.edu"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={(val) => handleInputChange('email', val)}
                value={formData.email}
              />

              <Text style={styles.label}>Panther ID</Text>
              <TextInput 
                style={styles.input}
                placeholder="002-XXXX-XX"
                keyboardType="numeric"
                onChangeText={(val) => handleInputChange('panther_id', val)}
                value={formData.panther_id}
              />
              
              <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <TextInput 
                style={styles.input}
                placeholder="••••••••••••"
                secureTextEntry={!isPasswordVisible}
                onChangeText={(val) => handleInputChange('password', val)}
                value={formData.password}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start', 
    paddingVertical: 40, 
    paddingHorizontal: 20,
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
    marginBottom: 15,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    height: '70%',
    justifyContent: 'top',
  },
});