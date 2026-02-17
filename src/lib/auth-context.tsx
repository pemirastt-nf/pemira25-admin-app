"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "./api";
import { adminStorage } from "./storage";

type User = {
     id: string;
     email: string;
     role: string;
     name: string;
};

type AuthContextType = {
     user: User | null;
     loading: boolean;
     login: (token: string, userData: User) => void;
     logout: () => void;
     isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType>({
     user: null,
     loading: true,
     login: () => { },
     logout: () => { },
     isAuthenticated: false
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
     const [user, setUser] = useState<User | null>(null);
     const [loading, setLoading] = useState(true);
     const router = useRouter();
     const pathname = usePathname();

     const checkAuth = useCallback(async () => {
          try {
               const res = await api.get('/auth/me');
               setUser(res.data);
               if (pathname === '/login') {
                    router.push('/');
               }
          } catch {
               setUser(null);
               if (pathname !== '/login' && !pathname.startsWith('/invite')) {
                    router.push('/login');
               }
          } finally {
               setLoading(false);
          }
     }, [pathname, router]);

     useEffect(() => {
          checkAuth();
     }, [checkAuth]);

     const login = (token: string, userData: User) => {
          adminStorage.setItem('admin_token', token);
          setUser(userData);
          // Force hard navigation to ensure clean state and middleware/layout mounting
          window.location.href = '/';
     };

     const logout = async () => {
          try {
               await api.post('/auth/logout');
          } catch (error) {
               console.error('Logout error', error);
          }
          adminStorage.removeItem('admin_token');
          setUser(null);
          router.push('/login');
     };

     return (
          <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
               {children}
          </AuthContext.Provider>
     );
}

export const useAuth = () => useContext(AuthContext);
