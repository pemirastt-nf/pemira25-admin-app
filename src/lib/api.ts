/* eslint-disable @typescript-eslint/no-unused-vars */
import axios from "axios";

const getEnvUrl = () => {
     let url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
     if (url.endsWith('/')) url = url.slice(0, -1);
     return url;
};

const envUrl = getEnvUrl();
const baseURL = envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;

const api = axios.create({
     baseURL,
     withCredentials: true,
     headers: {
          "Content-Type": "application/json",
     },
});

api.interceptors.request.use((config) => {
     if (typeof window !== 'undefined') {
          const token = localStorage.getItem('admin_token');
          if (token) {
               config.headers.Authorization = `Bearer ${token}`;
          }
     }
     return config;
});

export { api };

export const useApi = () => api;

// Socket.io Helper
import { io, Socket } from 'socket.io-client';

export const SOCKET_URL = (() => {
     try {
          const url = new URL(envUrl);

          return url.origin;
     } catch (e) {
          console.error('[Admin API] Invalid API URL for socket:', envUrl);
          return 'http://localhost:5000';
     }
})();

export const initSocket = (token: string | null): Socket => {
     return io(SOCKET_URL, {
          auth: { token },
          withCredentials: true,
          reconnection: true,
          transports: ['polling', 'websocket']
     });
};
