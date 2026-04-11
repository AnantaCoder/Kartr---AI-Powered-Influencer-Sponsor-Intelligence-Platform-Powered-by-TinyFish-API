import axios from "axios";

// Get API URL from environment variables with fallback
// Try multiple sources for compatibility
const getApiUrl = (): string => {
  // For Bun environment
  if (typeof Bun !== 'undefined' && Bun.env?.BACKEND_API_URL) {
    return Bun.env.BACKEND_API_URL;
  }
  
  // For Vite/import.meta.env
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_API_URL) {
    return import.meta.env.VITE_BACKEND_API_URL;
  }
  
  // For Node.js process.env
  if (typeof process !== 'undefined' && process.env?.BACKEND_API_URL) {
    return process.env.BACKEND_API_URL;
  }
  
  // Default fallback
  return "http://localhost:8000/api";
};

const API_URL = getApiUrl();

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
