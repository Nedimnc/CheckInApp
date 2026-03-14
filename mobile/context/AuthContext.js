import React, { createContext, use, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { loginUser } from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const login = async (email, password) => {
    try {
      const data = await loginUser(email, password);
      await SecureStore.setItemAsync('userToken', data.token);
      await SecureStore.setItemAsync('userData', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};