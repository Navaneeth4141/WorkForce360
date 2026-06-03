'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import API from '../lib/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load session from localStorage on app load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('wf_token');
      const storedUser = localStorage.getItem('wf_user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    }
  }, []);

  // Login handler
  const login = async (employeeId, password) => {
    try {
      const res = await API.post('/auth/login', { employeeId, password });
      const { token: jwtToken, user: userData } = res.data;

      localStorage.setItem('wf_token', jwtToken);
      localStorage.setItem('wf_user', JSON.stringify(userData));

      setToken(jwtToken);
      setUser(userData);

      // Redirect based on user role
      if (userData.role === 'ADMIN') {
        router.push('/dashboard');
      } else {
        router.push('/worker');
      }

      return { success: true };
    } catch (error) {
      console.error('Login request failed:', error);
      const message = error.response?.data?.error?.message || 'Login failed. Please check your credentials.';
      return { success: false, message };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      // Call backend logout to revoke session
      await API.post('/auth/logout');
    } catch (error) {
      console.error('Revoke session request failed:', error.message);
    } finally {
      localStorage.removeItem('wf_token');
      localStorage.removeItem('wf_user');
      setToken(null);
      setUser(null);
      router.push('/login');
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await API.post('/auth/change-password', { currentPassword, newPassword });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to update password.';
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
