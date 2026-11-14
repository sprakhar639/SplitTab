import api from "../../../services/api";
import { mockAuth } from "../../../services/mockData";

// The backend has no "who am I" endpoint, so the creator id of any group I
// created is the only reliable way to learn my user id right after login.
async function resolveUserId(user) {
  try {
    const { groups } = await api.get("/groups/created");

    if (groups.length === 0) return user;

    return { ...user, id: Number(groups[0].createdById) };
  } catch {
    // Logged in either way; useGroup can still match us by email later.
    return user;
  }
}

export async function login({ identifier, password }) {
  await api.post("/auth/login", { identifier, password });

  const isEmail = identifier.includes("@");
  const user = await resolveUserId({
    id: null,
    name: "",
    username: isEmail ? "" : identifier,
    email: isEmail ? identifier : "",
  });

  return mockAuth.setMe(user);
}

export async function register({ name, username, email, password }) {
  await api.post("/auth/register", { name, username, email, password });

  return mockAuth.setMe({ id: null, name, username, email });
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    mockAuth.clear();
  }
}

// Mock for GET /auth/me.
export function getCurrentUser() {
  return mockAuth.me();
}

export function saveCurrentUser(user) {
  return mockAuth.setMe(user);
}

export function clearCurrentUser() {
  mockAuth.clear();
}
