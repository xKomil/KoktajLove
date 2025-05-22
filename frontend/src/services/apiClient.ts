// frontend/src/services/apiClient.ts
import axios, { InternalAxiosRequestConfig } from 'axios';
import * as storage from '@/utils/localStorage'; // For getting token

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const TOKEN_KEY = 'koktajlove_authToken'; // Consistent key with AuthContext

const apiClient = axios.create({
  baseURL: VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Adds the auth token to requests if available
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getItem<string>(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor (Optional): Handle global errors like 401
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Status:', error.response.status);
      console.error('API Error Data:', error.response.data);

      if (error.response.status === 401) {
        // Unauthorized: Token might be invalid or expired
        // Here you could trigger a logout action or redirect to login
        // Be careful with circular dependencies if importing AuthContext/logout directly
        // One common pattern is to dispatch a custom event that AuthContext listens to.
        console.warn('Unauthorized access (401). Token may be invalid or expired.');
        // Example: Firing a custom event
        // window.dispatchEvent(new CustomEvent('auth-error-401'));
        // Or, if a simple redirect is enough:
        // storage.removeItem(TOKEN_KEY);
        // storage.removeItem('koktajlove_userData'); // Also clear user data
        // window.location.href = '/login'; // Force reload to clear state
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Request Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;