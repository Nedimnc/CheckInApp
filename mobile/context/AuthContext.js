import React, { createContext, use, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { loginUser } from '../api';
import { Alert } from 'react-native';
import socket from '../services/socket';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  let isAlertVisible = false;

  // Check for token on app startup
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        const savedUser = await SecureStore.getItemAsync('userData');
        if (token && savedUser) {
          console.log("Found saved token on startup");
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.log("Error reading token", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkToken();
  }, []);

  useEffect(() => {
    const setupSocket = async () => {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        socket.auth = { token };
        socket.connect();
        console.log('Auto-connected to Socket.IO with token');
      }
    };
    setupSocket();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await loginUser(email, password);
      await SecureStore.setItemAsync('userToken', data.token);
      await SecureStore.setItemAsync('userData', JSON.stringify(data.user));
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      socket.auth = { token: data.token };
      socket.connect();
      console.log('Socket connected manually after login');
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    console.log('Clearing token, disconnecting socket, and logging out');
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
    socket.disconnect();
    setUser(null);
  };

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && (error.response.status === 403 || error.response.status === 401)) {
          if (isAlertVisible) {
            return Promise.reject(error);
          }
          isAlertVisible = true;
          Alert.alert(
            "Session Expired",
            "Please log in again.",
            [{
              text: "OK",
              onPress: () => {
                isAlertVisible = false;
                logout();
              }
            }],
            { cancelable: false }
          );
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};