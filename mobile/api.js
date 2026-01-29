// mobile/api.js
import axios from 'axios';
import config from './config'; // Import the local config

const BASE_URL = config.API_URL; // Use the URL from the config file

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: 'Network Error' };
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: 'Network Error' };
  }
};

export const createSession = async (sessionData) => {
  try {
    const response = await api.post('/sessions/create', sessionData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: 'Network Error' };
  }
};

export const getSessions = async () => {
  try {
    const response = await api.get('/sessions/fetch');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: 'Network Error' };
  }
};

export const getUsers = async () => {
  try {
    const response = await api.get('/users/fetch');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: 'Network Error' };
  }
}

export default api;