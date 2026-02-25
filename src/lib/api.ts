/* eslint-disable @typescript-eslint/no-unused-vars */
import axios from "axios";
import { adminStorage } from "./storage";

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

api.interceptors.request.use(async (config) => {
     if (typeof window !== 'undefined') {
          const token = adminStorage.getItem('admin_token');
          if (token) {
               config.headers.Authorization = `Bearer ${token}`;
          }

          try {
               // Client-side IP tracking to bypass proxy restrictions
               const locCache = sessionStorage.getItem('admin_loc_cache');
               if (locCache) {
                    const parsed = JSON.parse(locCache);
                    config.headers['x-client-ip'] = parsed.ip;
                    config.headers['x-client-location'] = parsed.location;
               } else {
                    const res = await fetch('https://freeipapi.com/api/json/', { method: 'GET' });
                    if (res.ok) {
                         const data = await res.json();
                         const ip = data.ipAddress || '';
                         const location = [data.cityName, data.regionName, data.countryName].filter(Boolean).join(', ');

                         sessionStorage.setItem('admin_loc_cache', JSON.stringify({ ip, location }));

                         config.headers['x-client-ip'] = ip;
                         config.headers['x-client-location'] = location;
                    }
               }
          } catch (e) {
               // Proceed anyway if location fetch fails (e.g., adblocker)
          }
     }
     return config;
});

export { api };

export const useApi = () => api;

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
     const socket = io(SOCKET_URL, {
          auth: { token },
          withCredentials: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          transports: ['polling', 'websocket']
     });

     return socket;
};
