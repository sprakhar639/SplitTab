import api from "../../../services/api";

export function registerUser(userData) {
  return api.post("/auth/register", userData);
}

export function loginUser(credentials) {
  return api.post("/auth/login", credentials);
}

// Google login with CSRF protection.
export async function googleLoginUser(credential) {
  const { csrfToken } = await api.get("/auth/google/csrf");

  return api.post("/auth/google", {
    credential,
    csrfToken,
  });
}

export function logoutUser() {
  return api.post("/auth/logout");
}

// Returns { id, name, username, email } for the session cookie's user.
export async function fetchCurrentUser() {
  const { user } = await api.get("/auth/me");
  return user;
}
