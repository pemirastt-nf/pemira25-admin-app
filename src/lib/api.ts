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
               let traceData: { ip: string; location: string } | null = null;
               const locCache = sessionStorage.getItem('admin_loc_cache');
               if (locCache) {
                    traceData = JSON.parse(locCache);
               } else {
                    let ip = '';
                    let location = '';

                    try {
                         const res = await fetch('https://freeipapi.com/api/json/', { method: 'GET', signal: AbortSignal.timeout(3000) });
                         if (res.ok) {
                              const data = await res.json();
                              ip = String(data.ipAddress || '');
                              location = [data.cityName, data.regionName, data.countryName].filter(Boolean).join(', ');
                         }
                    } catch {
                         // Silently ignore freeipapi block
                    }

                    if (!ip) {
                         try {
                              const cfRes = await fetch('/cdn-cgi/trace', { signal: AbortSignal.timeout(3000) });
                              if (cfRes.ok) {
                                   const text = await cfRes.text();
                                   const lines = text.split('\n');
                                   for (const line of lines) {
                                        if (line.startsWith('ip=')) ip = line.split('=')[1].trim();
                                        if (line.startsWith('loc=')) location = line.split('=')[1].trim() + ' (Cloudflare)';
                                   }
                              }
                         } catch {
                              // Final fallback fails
                         }
                    }

                    if (ip) {
                         traceData = { ip, location };
                         sessionStorage.setItem('admin_loc_cache', JSON.stringify(traceData));
                    }
               }

               if (traceData && config.data) {
                    if (typeof config.data === 'string') {
                         try {
                              const parsed = JSON.parse(config.data);
                              parsed._clientIp = traceData.ip;
                              parsed._clientLocation = traceData.location;
                              config.data = JSON.stringify(parsed);
                         } catch { /* not JSON, skip */ }
                    } else if (typeof config.data === 'object') {
                         config.data._clientIp = traceData.ip;
                         config.data._clientLocation = traceData.location;
                    }
               }
          } catch {
               // Proceed anyway if location fetch fails
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
