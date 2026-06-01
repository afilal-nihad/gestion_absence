import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'absence_manager_auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
        setStats(parsed.stats);
        setToken(parsed.token);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const payload = {
      user: response.user,
      stats: response.stats,
      token: response.token
    };
    setUser(payload.user);
    setStats(payload.stats);
    setToken(payload.token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    if (payload.user.role === 'ADMIN') navigate('/admin');
    else if (payload.user.role === 'TRAINER') navigate('/formateur/presences');
    else navigate('/stagiaire');
  };

  const logout = () => {
    setUser(null);
    setStats(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    navigate('/login');
  };

  const refreshProfile = async () => {
    if (!token) return;
    const response = await api.get('/auth/me', token);
    const payload = {
      user: response.user,
      stats: response.stats,
      token
    };
    setUser(payload.user);
    setStats(payload.stats);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };

  const value = {
    user,
    stats,
    token,
    loading,
    login,
    logout,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
