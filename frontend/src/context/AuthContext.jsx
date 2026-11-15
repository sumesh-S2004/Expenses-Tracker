import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { clearCache } from "../api/cache";

const AuthContext = createContext(null);
const TOKEN_KEY = "wealthflow_token";
const USER_KEY = "wealthflow_user";

function readUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const hasToken = !!localStorage.getItem(TOKEN_KEY);
  // The saved user lets the app paint immediately; /auth/me then verifies it in the background.
  const [user, setUser] = useState(() => (hasToken ? readUser() : null));
  const [loading, setLoading] = useState(() => hasToken && !readUser());

  const persist = useCallback((u) => {
    setUser(u);
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => persist(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [persist]);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem(TOKEN_KEY, res.data.token);
    persist(res.data.user);
    return res.data.user;
  };

  const googleLogin = async (credential) => {
    const res = await api.post("/auth/google", { credential });
    localStorage.setItem(TOKEN_KEY, res.data.token);
    persist(res.data.user);
    return res.data.user;
  };

  const register = async (name, email, password, phone) => {
    const res = await api.post("/auth/register", { name, email, password, phone });
    localStorage.setItem(TOKEN_KEY, res.data.token);
    persist(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    persist(null);
    clearCache();
  };

  const updateUser = (partial) => persist({ ...user, ...partial });

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
