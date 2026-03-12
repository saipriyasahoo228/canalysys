import axios from 'axios';
import {getToken, getNewAccessToken, logout} from './auth';
import {API_BASE_URL} from "./constant";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(config => {
  const { accessToken } = getToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // If error is not 401 or already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    
    // Mark as retried to prevent infinite loops
    originalRequest._retry = true;
    
    try {
      await getNewAccessToken();
      // Retry the original request with new token
      return api(originalRequest);
    } catch (refreshError) {
      // Only logout if refresh token is actually expired/invalid
      // Don't logout for network errors
      if (refreshError.response?.status === 401) {
        logout();
      }
      return Promise.reject(error);
    }
  }
);

export default api;