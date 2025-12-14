import axios from "axios";

// Ensure the base URL maps to the /api endpoint, as expected by the backend
const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const baseURL = envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;

const api = axios.create({
     baseURL,
     withCredentials: true,
     headers: {
          "Content-Type": "application/json",
     },
});

// Add interceptor to inject Bearer token from localStorage
api.interceptors.request.use((config) => {
     if (typeof window !== 'undefined') {
          const token = localStorage.getItem('admin_token');
          console.log(`[API Interceptor] URL: ${config.url}, Token found: ${!!token}`);
          if (token) {
               config.headers.Authorization = `Bearer ${token}`;
          }
     }
     return config;
});

export { api };

export const useApi = () => api;
