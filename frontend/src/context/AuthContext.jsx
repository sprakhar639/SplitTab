import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import * as authService from "../features/auth/services/auth.service";

const AuthContext = createContext(null);

// Clear the active Munshi AI conversation for a user.
function clearAssistantConversation(userId) {
  if (!userId) return;

  localStorage.removeItem(`splittab_conversation_${userId}`);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    authService
      .fetchCurrentUser()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  // Handle unauthorized sessions.
  useEffect(() => {
    function handleUnauthorized() {
      setUser((currentUser) => {
        if (currentUser) {
          clearAssistantConversation(currentUser.id);
        }

        return null;
      });
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  // LOGIN
  const login = useCallback(async (credentials) => {
    await authService.loginUser(credentials);

    const loggedInUser = await authService.fetchCurrentUser();

    clearAssistantConversation(loggedInUser.id);

    setUser(loggedInUser);
  }, []);

  // GOOGLE LOGIN
  const googleLogin = useCallback(async (credential) => {
    await authService.googleLoginUser(credential);

    const loggedInUser = await authService.fetchCurrentUser();

    clearAssistantConversation(loggedInUser.id);

    setUser(loggedInUser);
  }, []);

  // REGISTER
  const register = useCallback(async (userData) => {
    await authService.registerUser(userData);

    const registeredUser = await authService.fetchCurrentUser();

    clearAssistantConversation(registeredUser.id);

    setUser(registeredUser);
  }, []);

  // LOGOUT
  const logout = useCallback(async () => {
    const currentUserId = user?.id;

    try {
      await authService.logoutUser();
    } finally {
      clearAssistantConversation(currentUserId);
      setUser(null);
    }
  }, [user]);

  // UPDATE USER
  const updateUser = useCallback((updatedUser) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        googleLogin,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
