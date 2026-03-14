import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { getQRToken } from '../api'; // Import API call

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
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Session Check-In</Text>
        <Text style={styles.subtitle}>{session.subject}</Text>
        
        {/* Show a spinner while loading, then show the QR Code */}
        <View style={styles.qrContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#2D52A2" style={{ margin: 50 }} />
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
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2D52A2', padding: 20 },
  card: { backgroundColor: 'white', padding: 30, borderRadius: 20, alignItems: 'center', width: '100%', maxWidth: 350, elevation: 5 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2D52A2', marginBottom: 5 },
  subtitle: { fontSize: 18, color: '#666', marginBottom: 30 },
  qrContainer: { padding: 10, borderWidth: 1, borderColor: '#EEE', borderRadius: 10, marginBottom: 30, minHeight: 270, minWidth: 270, justifyContent: 'center', alignItems: 'center' },
  instruction: { textAlign: 'center', color: '#888', fontSize: 14 },
  closeButton: { marginTop: 40, paddingVertical: 15, paddingHorizontal: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 30 },
  closeText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});