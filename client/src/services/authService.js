import api from './api';

/**
 * All functions return the full axios response so callers
 * can access res.data.data.{token,user} consistently.
 */

export const register = async (name, email, password) => {
  return api.post('/auth/register', { name, email, password });
};

export const login = async (email, password) => {
  return api.post('/auth/login', { email, password });
};

export const logout = async () => {
  return api.post('/auth/logout');
};

export const refreshToken = async () => {
  return api.post('/auth/refresh');
};

export const getMe = async () => {
  return api.get('/auth/me');
};
