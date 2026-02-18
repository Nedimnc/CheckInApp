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

export const bookSession = async (sessionId, studentId) => {
  try {
    const response = await api.post(`/sessions/${sessionId}/book`, { 
      student_id: studentId 
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const cancelSession = async (sessionId, userId) => {
  try {
    // Sending the user_id in the body so the backend verifies ownership
    const response = await api.delete(`/sessions/${sessionId}`, {
      data: { user_id: userId } 
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
export const updateSession = async (sessionId, sessionData) => {
  try {
    const response = await api.put(`/sessions/${sessionId}`, sessionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Helper to unbook a session
export const unbookSession = async (sessionId, studentId) => {
  try {
    const response = await api.post(`/sessions/${sessionId}/unbook`, { 
      student_id: studentId 
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export default api;