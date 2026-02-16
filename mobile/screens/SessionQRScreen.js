import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function SessionQRScreen({ route, navigation }) {
  // Get the session data passed from the button click
  const { session } = route.params;

  // The data inside the QR code
  const qrValue = JSON.stringify({
    session_id: session.session_id,
    type: 'check-in'
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Session Check-In</Text>
        <Text style={styles.subtitle}>{session.subject}</Text>
        
        {/* The QR Code Image */}
        <View style={styles.qrContainer}>
          <QRCode
            value={qrValue}
            size={250}
            color="black"
            backgroundColor="white"
          />
        </View>

        <Text style={styles.instruction}>
          Ask students to scan this code.
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
  qrContainer: { padding: 10, borderWidth: 1, borderColor: '#EEE', borderRadius: 10, marginBottom: 30 },
  instruction: { textAlign: 'center', color: '#888', fontSize: 14 },
  closeButton: { marginTop: 40, paddingVertical: 15, paddingHorizontal: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 30 },
  closeText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});