import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import * as authService from "../features/auth/services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined while the session is being checked, null when logged out.
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    authService
      .fetchCurrentUser()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      setUser(null);
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  const login = useCallback(async (credentials) => {
    await authService.loginUser(credentials);
    setUser(await authService.fetchCurrentUser());
  }, []);

  const register = useCallback(async (userData) => {
    await authService.registerUser(userData);
    setUser(await authService.fetchCurrentUser());
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logoutUser();
    } finally {
      setUser(null);
    }
  }, []);

  // Applies local profile edits until the backend can save them.
  const updateUser = useCallback((changes) => {
    setUser((prev) => (prev ? { ...prev, ...changes } : prev));
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
