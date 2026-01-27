import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { loginUser } from '../api'; // Import the helper we just made
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleLogin = async () => {
    try {
      const user = await loginUser(email, password);
      Alert.alert('Success', `Welcome back, ${user.name}!`);
      // Later we will navigate to Dashboard here
      navigation.replace('MainTabs');
    } catch (error) {
      Alert.alert('Error', error.message || 'Login failed');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.header}>Login to CheckIn</Text>
          {/* Login input */}
          <Text style={styles.label}>GSU Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@gsu.edu"
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={setEmail}
            value={email}
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
            style={[styles.submitButton, { backgroundColor: '#2D52A2' }]}
            onPress={handleLogin}
          >
            <Text style={styles.submitText}>Log In</Text>
          </TouchableOpacity>
          {/* Quick login for developmental purposes with custom credentials */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: '#173062' }]}
            /* Change 'email' and 'password' as needed */
            onPress={() => {
              setEmail('student@gsu.edu');
              setPassword('password');
            }}
          >
            <Text style={styles.submitText}>Quick fill (dev button)</Text>
          </TouchableOpacity>
          <View style={styles.footerContainer}>
            <Text style={styles.footer}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingVertical: '40%',
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
  icon: {
    fontSize: 24,
    marginBottom: 4,
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
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  footer: {
    textAlign: 'left',
    color: '#666',
  },
  signUpText: {
    textAlign: 'right',
    color: '#2D52A2',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  }
});