import { createContext, useContext, useState, useEffect } from 'react';
import { api, getToken, setToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getToken());
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  useEffect(() => {
    let cancelled = false;
    if (!getToken()) return undefined;

    api.me()
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (cancelled) return;
        setToken(null);
        setTokenState(null);
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    setToken(data.token);
    setTokenState(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const data = await api.register({ name, email, password });
    setToken(data.token);
    setTokenState(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setTokenState(null);
    setUser(null);
  };

  const updateProfile = async (profile) => {
    const data = await api.saveProfile(profile);
    setUser((prev) => (prev ? { ...prev, profile: data.profile } : prev));
    return data.profile;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
