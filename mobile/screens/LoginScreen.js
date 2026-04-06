import React, { useContext, useState } from 'react';
import { View, Text, Button, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { loginUser } from '../api'; // Import the helper we just made
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { AuthContext } from '../context/AuthContext';
import theme from '../styles/theme';
import Toast from 'react-native-toast-message';

export default function LoginScreen({ navigation }) {
  const headerHeight = useHeaderHeight();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { login } = useContext(AuthContext);

  const handleLogin = async (role) => {
    try {
      const loggedInUser = await login(email, password);
      Toast.hide();
      setTimeout(() => {
        Toast.show({
          type: 'greeting',
          text1: 'Login Successful!',
          text2: `Welcome back, ${loggedInUser.name}!`
        });
      }, 500);
    } catch (error) {
      Toast.hide();
      setTimeout(() => {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: error.message || "Check your credentials and try again."
        });
      }, 500);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent, { paddingBottom: headerHeight }]}
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
          style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleLogin}
        >
          <Text style={styles.submitText}>Log In</Text>
        </TouchableOpacity>
        {/* Quick login for developmental purposes with custom credentials for student and tutor */}
        {/* Change 'email' and 'password' as needed */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: '#1b3366' }]}
          onPress={() => {
            setEmail('student@gsu.edu');
            setPassword('student');
          }}
        >
          <Text style={styles.submitText}>Quick Student (dev button)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.colors.success }]}
          onPress={() => {
            setEmail('tutor@gsu.edu');
            setPassword('tutor');
          }}
        >
          <Text style={styles.submitText}>Quick Tutor (dev button)</Text>
        </TouchableOpacity>
        <View style={styles.footerContainer}>
          <Text style={styles.footer}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: theme.spacing.md, },
  card: {
    backgroundColor: theme.colors.card, borderRadius: theme.radii.lg, padding: theme.spacing.md, width: '100%', shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5,
  },
  header: { fontSize: theme.typography.h2, fontWeight: 'bold', textAlign: 'center', marginBottom: theme.spacing.lg, color: theme.colors.text, },
  icon: { fontSize: 24, marginBottom: 4, },
  label: { fontSize: theme.typography.caption, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 6, marginLeft: 4, },
  input: {
    flex: 1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radii.md, padding: theme.spacing.sm, marginBottom: theme.spacing.sm, fontSize: theme.typography.body,
  },
  submitButton: { paddingVertical: theme.spacing.md, borderRadius: theme.radii.lg, alignItems: 'center', marginTop: theme.spacing.sm, },
  submitText: { color: '#FFF', fontSize: theme.typography.h3, fontWeight: 'bold', },
  inputContainer: { flexDirection: 'row', alignItems: 'center', position: 'relative', width: '100%', },
  eyeIcon: { position: 'absolute', right: 15, height: '70%', justifyContent: 'center', },
  footerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.md, },
  footer: { textAlign: 'left', color: theme.colors.textSecondary, },
  signUpText: { textAlign: 'right', color: theme.colors.primary, fontWeight: 'bold', textDecorationLine: 'underline', }
});