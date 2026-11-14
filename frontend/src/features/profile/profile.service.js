import { mockProfile } from "../../services/mockData";

// Mock for PATCH /users/me
export function updateProfile(changes) {
  return mockProfile.update(changes);
}

// Mock for PATCH /users/me/password
export function changePassword({ currentPassword, newPassword }) {
  return mockProfile.changePassword({ currentPassword, newPassword });
}
