import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://backend.skinme.store/api/v1', // or your backend URL
  withCredentials: true, // This is CRITICAL for sending cookies
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to attach token
instance.interceptors.request.use(
  (config) => {
    // Get token from localStorage or cookies
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      console.error('Authentication failed - redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;