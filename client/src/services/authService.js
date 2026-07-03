import api from './api';

/**
 * All functions return the full axios response so callers
 * can access response.data.{token,user} consistently.
 * The api instance does NOT auto-unwrap — it returns the
 * full AxiosResponse, so callers use res.data.data.user etc.
 *
 * Fix: authService was destructuring { data } from axios,
 * making the return value the server's JSON body directly.
 * AuthContext expected res.data.user (AxiosResponse shape).
 * Now we return the raw AxiosResponse for consistency.
 */

export const register = async (name, email, password) => {
  return api.post('/auth/register', { name, email, password });
};

export const login = async (email, password) => {
  return api.post('/auth/login', { email, password });
};

export const getMe = async () => {
  return api.get('/auth/me');
};
