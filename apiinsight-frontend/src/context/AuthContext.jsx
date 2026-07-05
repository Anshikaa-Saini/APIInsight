import { createContext, useEffect, useState } from 'react';
import { getMeApi, loginApi, registerApi } from '../api/authApi';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true while we check for an existing session

  // On first load, if a token already exists (from a previous session),
  // validate it against the backend and restore the user.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    getMeApi()
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(credentials) {
    const res = await loginApi(credentials);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  }

  async function register(payload) {
    const res = await registerApi(payload);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
