import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/v1`
  : '/api/v1';

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.message && typeof error.response.data.message === 'string') {
      error.message = error.response.data.message;
    }
    return Promise.reject(error);
  }
);

export default api;
