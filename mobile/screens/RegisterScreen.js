import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { registerUser } from '../api'; // Import the helper we just made
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import theme from '../styles/theme';
import Toast from 'react-native-toast-message';


export default function RegisterScreen({ navigation }) {
  const headerHeight = useHeaderHeight();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [panther_id, setPantherId] = useState('');
  const [role, setRole] = useState('student'); // Default role
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const primaryColor = role === 'student' ? theme.colors.primary : theme.colors.success;
  const lightBg = role === 'student' ? theme.colors.primaryLight : '#E8F5E9';

  const handleRegister = async () => {
    if (!name || !email || !password || !panther_id) {
      Toast.hide();
      setTimeout(() => {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: "Please fill in all fields."
        });
      }, 500);
      return;
    }
    if (!email.endsWith('@gsu.edu') && !email.endsWith('@student.gsu.edu')) {
      Toast.hide();
      setTimeout(() => {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: "Please use a valid GSU email address."
        });
      }, 500);
      return;
    }
    try {
      const userData = { name, email, password, panther_id, role };
      const user = await registerUser(userData);
      Toast.hide();
      setTimeout(() => {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: `Account created for ${user.name}!`
        });
      }, 500);
      // Navigate back to the login page
      navigation.goBack();
    } catch (error) {
      Toast.hide();
      setTimeout(() => {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Registration failed'
        });
      }, 500);
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
                role === 'student' && { borderColor: theme.colors.primary, backgroundColor: '#F5F7FA' }
              ]}
              onPress={() => setRole('student')}
            >
              <Text style={styles.icon}>🎒</Text>
              <Text style={[styles.roleText, role === 'student' && { color: theme.colors.primary }]}>Student</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === 'tutor' && { borderColor: theme.colors.success, backgroundColor: '#E8F5E9' }
              ]}
              onPress={() => setRole('tutor')}
            >
              <Text style={styles.icon}>📖</Text>
              <Text style={[styles.roleText, role === 'tutor' && { color: theme.colors.success }]}>Tutor</Text>
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
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
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
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.lg, },
  card: {
    backgroundColor: theme.colors.card, borderRadius: theme.radii.lg, padding: theme.spacing.md, width: '100%', shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5,
  },
  header: { fontSize: theme.typography.h2, fontWeight: 'bold', textAlign: 'center', marginBottom: theme.spacing.lg, color: theme.colors.text, },
  roleContainer: { flexDirection: 'row', marginBottom: theme.spacing.lg, },
  roleButton: {
    flex: 1, padding: theme.spacing.md, borderRadius: theme.radii.md, borderWidth: 1,
    borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.sm
  },
  roleText: { fontWeight: '600', color: '#888', },
  icon: { fontSize: 24, marginBottom: 4, },
  form: { width: '100%', },
  label: { fontSize: theme.typography.caption, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 6, marginLeft: 4, },
  input: {
    flex: 1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radii.md, padding: theme.spacing.sm, marginBottom: theme.spacing.md, fontSize: theme.typography.body,
  },
  submitButton: { paddingVertical: theme.spacing.md, borderRadius: theme.radii.lg, alignItems: 'center', marginTop: theme.spacing.sm, },
  submitText: { color: '#FFF', fontSize: theme.typography.h3, fontWeight: 'bold', },
  inputContainer: { flexDirection: 'row', alignItems: 'center', position: 'relative', width: '100%', },
  eyeIcon: { position: 'absolute', right: 15, height: '70%', justifyContent: 'center', },
  passwordContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.md,
    marginBottom: theme.spacing.sm, paddingRight: 10, },
  passwordInput: { flex: 1, padding: theme.spacing.sm, fontSize: theme.typography.body, color: theme.colors.text, },
});