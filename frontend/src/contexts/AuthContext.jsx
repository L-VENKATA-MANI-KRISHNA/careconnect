import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { signInWithGoogle } from '../firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data.user);
      setProviderProfile(res.data.data.providerProfile || null);
    } catch (err) {
      setUser(null);
      setProviderProfile(null);
      localStorage.removeItem('careconnect_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: loggedInUser, providerProfile: profile, accessToken } = res.data.data;
    if (accessToken) {
      localStorage.setItem('careconnect_token', accessToken);
    }
    setUser(loggedInUser);
    setProviderProfile(profile || null);
    return loggedInUser;
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    const { user: newUser, providerProfile: profile, accessToken } = res.data.data;
    if (accessToken) {
      localStorage.setItem('careconnect_token', accessToken);
    }
    setUser(newUser);
    setProviderProfile(profile || null);
    return newUser;
  };

  const loginWithGoogle = async (role = 'CUSTOMER', businessName = '') => {
    const result = await signInWithGoogle();
    const fbUser = result.user;
    const res = await api.post('/auth/google', {
      email: fbUser.email,
      name: fbUser.displayName,
      avatar: fbUser.photoURL,
      googleId: fbUser.uid,
      role,
      businessName,
    });
    const { user: loggedInUser, providerProfile: profile, accessToken } = res.data.data;
    if (accessToken) {
      localStorage.setItem('careconnect_token', accessToken);
    }
    setUser(loggedInUser);
    setProviderProfile(profile || null);
    return loggedInUser;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('careconnect_token');
      setUser(null);
      setProviderProfile(null);
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const value = {
    user,
    providerProfile,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    refreshUser,
    isCustomer: user?.role === 'CUSTOMER',
    isProvider: user?.role === 'SERVICE_PROVIDER',
    isAdmin: user?.role === 'PLATFORM_ADMIN',
    isOps: user?.role === 'OPERATIONS_MANAGER',
    isSupport: user?.role === 'SUPPORT_AGENT',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
