// mobile/api.js
import axios from 'axios';

// REPLACE THIS WITH YOUR COMPUTER'S IP ADDRESS
// Example: const BASE_URL = 'http://192.168.1.15:3000/api';
// mobile/api.js
const BASE_URL = 'http://10.0.0.145:3000/api';

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

export default api;