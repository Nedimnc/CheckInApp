import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { getQRToken } from '../api'; // Import API call
import theme from '../styles/theme';

export default function SessionQRScreen({ route, navigation }) {
  // Get the session data passed from the button click
  const { session } = route.params;
  
  // State to hold our secure token and loading status
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the secure token when the screen opens
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const secureToken = await getQRToken(session.session_id);
        setToken(secureToken);
      } catch (error) {
        Alert.alert("Error", "Could not generate secure QR code. Please check your connection.");
        navigation.goBack(); // Send them back if it fails
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [session.session_id]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}> 
      <View style={styles.card}>
        <Text style={styles.title}>Session Check-In</Text>
        <Text style={styles.subtitle}>{session.subject}</Text>
        
        {/* Show a spinner while loading, then show the QR Code */}
        <View style={styles.qrContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ margin: 50 }} />
          ) : token ? (
            <QRCode
              value={token} // Encrypted JWT
              size={250}
              color="black"
              backgroundColor="white"
            />
          ) : (
            <Text>Failed to load code.</Text>
          )}
        </View>

        <Text style={styles.instruction}>
          Ask student to scan this code.
        </Text>
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.md },
  card: { backgroundColor: theme.colors.card, padding: theme.spacing.lg, borderRadius: theme.radii.lg, alignItems: 'center', width: '100%', maxWidth: 350, elevation: 5 },
  title: { fontSize: theme.typography.h3, fontWeight: 'bold', color: theme.colors.primary, marginBottom: theme.spacing.sm },
  subtitle: { fontSize: theme.typography.body, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },
  qrContainer: { padding: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.sm, marginBottom: theme.spacing.lg, minHeight: 270, minWidth: 270, justifyContent: 'center', alignItems: 'center' },
  instruction: { textAlign: 'center', color: theme.colors.muted, fontSize: theme.typography.caption },
  closeButton: { marginTop: theme.spacing.lg, paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: theme.radii.lg },
  closeText: { color: 'white', fontSize: theme.typography.body, fontWeight: 'bold' }
});