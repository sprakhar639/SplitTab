import api from "../../services/api";

export async function updateProfile(changes) {
  const response = await api.patch("/auth/profile", changes);
  return response.user;
}

export async function changePassword({ currentPassword, newPassword }) {
  const response = await api.patch("/auth/password", {
    currentPassword,
    newPassword,
  });

  return response;
}
