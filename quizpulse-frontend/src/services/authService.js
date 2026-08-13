import API from './api';

export const loginUser = async (email, password) => {
  const response = await API.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await API.post('/auth/register', {
    full_name: userData.fullName || userData.full_name, // Handles both
    email: userData.email,
    password: userData.password,
    role: userData.role
  });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await API.get('/auth/me');
  return response.data;
};

export default {
  loginUser,
  registerUser,
  getCurrentUser
};