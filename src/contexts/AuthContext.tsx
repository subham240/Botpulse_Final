import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types';
import { api } from '../services/api';

export interface AuthUser {
  name: string;
  email: string;
  organization: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (fullName: string, workEmail: string, organization: string, pass: string) => Promise<boolean>;
  logout: () => void;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  // Validate existing stored token on app load
  useEffect(() => {
    const token = localStorage.getItem('bp_token');
    if (!token) {
      setUser(null);
      setIsLoadingAuth(false);
      return;
    }

    api.auth
      .getMe()
      .then((me) => {
        setUser({
          name: me.full_name || me.email.split('@')[0],
          email: me.email,
          organization: me.organization || 'Enterprise Workspace',
          role: (me.role as UserRole) || 'owner',
        });
      })
      .catch((err) => {
        console.warn('[AuthContext] Session expired or invalid token:', err);
        localStorage.removeItem('bp_token');
        setUser(null);
      })
      .finally(() => {
        setIsLoadingAuth(false);
      });
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    const res = await api.auth.login(email, pass);
    localStorage.setItem('bp_token', res.access_token);
    setUser({
      name: res.user.full_name || email.split('@')[0],
      email: res.user.email,
      organization: res.user.organization || 'Enterprise Workspace',
      role: (res.user.role as UserRole) || 'owner',
    });
    return true;
  };

  const register = async (
    fullName: string,
    workEmail: string,
    organization: string,
    pass: string
  ): Promise<boolean> => {
    const res = await api.auth.register({
      fullName,
      workEmail,
      organization,
      password: pass,
    });
    localStorage.setItem('bp_token', res.access_token);
    setUser({
      name: res.user.full_name || workEmail.split('@')[0],
      email: res.user.email,
      organization: res.user.organization || organization,
      role: (res.user.role as UserRole) || 'owner',
    });
    return true;
  };

  const logout = () => {
    localStorage.removeItem('bp_token');
    setUser(null);
  };

  const setRole = (role: UserRole) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoadingAuth,
        login,
        register,
        logout,
        setRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
