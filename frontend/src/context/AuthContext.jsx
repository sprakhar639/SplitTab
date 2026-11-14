import { createContext, useCallback, useContext, useEffect, useState } from "react";

import * as authService from "../features/auth/services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCurrentUser());

  useEffect(() => {
    function handleUnauthorized() {
      authService.clearCurrentUser();
      setUser(null);
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  const login = useCallback(async (credentials) => {
    setUser(await authService.login(credentials));
  }, []);

  const register = useCallback(async (details) => {
    setUser(await authService.register(details));
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  // Fills in id/name once a group member list tells us who we are.
  const updateUser = useCallback((changes) => {
    setUser((prev) =>
      prev ? authService.saveCurrentUser({ ...prev, ...changes }) : prev,
    );
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook lives beside its provider; only affects fast refresh of this file.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
