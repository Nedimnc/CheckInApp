import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, Button, Alert, TouchableOpacity } from 'react-native';
import { CameraView, Camera } from 'expo-camera';

export default function ScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const isScanning = useRef(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    if (isScanning.current) return; // Prevent multiple scans
    isScanning.current = true;
    setScanned(true);
    try {
      // 1. Read the data from the QR Code
      const sessionData = JSON.parse(data);

      // 2. Show what we found (This is just a test for now)
      Alert.alert(
        "Code Found!",
        `Session ID: ${sessionData.session_id}`,
        [
          {
            text: "OK", onPress: () => {
              isScanning.current = false;
              setScanned(false);
            }
          },
          { text: "Done", onPress: () => navigation.goBack() }
        ]
      );
    } catch (error) {
      Alert.alert("Invalid Code", "That doesn't look like a class QR code.", [
        {
          text: "Try Again", onPress: () => {
            isScanning.current = false;
            setScanned(false);
          }
        }
      ]);
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Overlay to guide the user */}
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
  scanBox: { width: 250, height: 250, borderWidth: 2, borderColor: '#FFF', backgroundColor: 'transparent', borderRadius: 20 },
  instruction: { marginTop: 20, color: 'white', fontSize: 18, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 5 },
  closeButton: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: 'white', padding: 15, borderRadius: 30 },
  closeText: { color: 'black', fontSize: 16, fontWeight: 'bold' }
});