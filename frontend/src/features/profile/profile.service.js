import { mockProfile } from "../../services/mockData";

// Mock for PATCH /users/me
export function updateProfile(userId, changes) {
  return mockProfile.update(userId, changes);
}

// Mock for PATCH /users/me/password
export function changePassword({ currentPassword, newPassword }) {
  return mockProfile.changePassword({ currentPassword, newPassword });
}
