import API from './api';

export const loginUser = async (email, password) => {
  const response = await API.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (userData) => {
  const registrationPayload = {
    full_name: userData.fullName || userData.full_name,
    email: userData.email,
    password: userData.password, // Always include password
    role: userData.role || 'surveyor'
  };

  // Only include password for non-student roles
  if (userData.role !== 'taker' && userData.password) {
    registrationPayload.password = userData.password;
  }

  const response = await API.post('/auth/register', registrationPayload);
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