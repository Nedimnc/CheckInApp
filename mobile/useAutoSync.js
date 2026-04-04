import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import { syncAttendance } from './api';

export const useAutoSync = () => {
  useEffect(() => {
    // This waits for the internet to connect
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        handleAutoSync();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAutoSync = async () => {

    try {
      const storedData = await SecureStore.getItemAsync('checkins');
      if (!storedData) return; 

      const checkinsArray = JSON.parse(storedData);

      if (checkinsArray.length > 0) {
        const response = await syncAttendance(checkinsArray);

        if (response && response.success === true) {
          await SecureStore.deleteItemAsync('checkins');
          console.log("Local data cleared.");
        }
      }
    } catch (error) {
      console.error("Error", error);
    }
  };
};