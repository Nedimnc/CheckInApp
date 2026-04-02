import React, { useState, useEffect, useRef, useContext } from 'react';
import { Text, View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { checkinSession } from '../api'; // Import our API call
import { AuthContext } from '../context/AuthContext'; // Import Auth to get student ID
import theme from '../styles/theme';

export default function ScannerScreen({ navigation }) {
  const { user } = useContext(AuthContext); // Get the logged-in student
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const isScanning = useRef(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status: existingStatus } = await Camera.getCameraPermissionsAsync();
      if (existingStatus === 'granted') {
        setHasPermission(true);
        return;
      }
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getCameraPermissions();
  }, []);

  // Async so we can await the API call
  const handleBarCodeScanned = async ({ type, data }) => {
    if (isScanning.current) return; // Prevent multiple scans
    isScanning.current = true;
    setScanned(true);

    try {
      // 1. The data from the QR Code is the secure JWT token
      const token = data;

      // Safety check: Make sure it's not empty
      if (!token) {
        throw new Error("Invalid QR Code.");
      }

      // 2. Hit the backend to securely check them in
      await checkinSession(token, user.user_id);

      // 3. Show message and go back to dashboard
      Alert.alert(
        "Check-In Successful!",
        "You have been securely checked into your tutoring session.",
        [{ text: "Done", onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      // 4. Failure (Not booked, expired token, etc.)
      const errorMsg = error.message || "Could not check in. Please try again.";
      Alert.alert("Check-In Failed", errorMsg, [
        {
          text: "Try Again", onPress: () => {
            isScanning.current = false;
            setScanned(false);
          }
        },
        { text: "Cancel", onPress: () => navigation.goBack(), style: 'cancel' }
      ]);
    }
  };

  if (hasPermission === null) return <Text>Requesting camera permission...</Text>;
  if (hasPermission === false) return <Text>No access to camera</Text>;

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.overlay}>
        <View style={styles.scanBox} />
        <Text style={styles.instruction}>Scan the Tutor's QR Code</Text>
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'column', justifyContent: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanBox: { width: 250, height: 250, borderWidth: 2, borderColor: theme.colors.card === '#FFFFFF' ? '#FFF' : theme.colors.primary, backgroundColor: 'transparent', borderRadius: theme.radii.lg },
  instruction: { marginTop: theme.spacing.md, color: theme.colors.card === '#FFFFFF' ? 'white' : theme.colors.text, fontSize: theme.typography.h3, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.5)', padding: theme.spacing.sm, borderRadius: theme.radii.sm },
  closeButton: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: theme.colors.card, padding: theme.spacing.md, borderRadius: theme.radii.lg },
  closeText: { color: theme.colors.text, fontSize: theme.typography.body, fontWeight: 'bold' }
});