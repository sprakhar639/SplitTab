import api from "../../services/api";
import { mockInvites } from "../../services/mockData";

// /groups/belongTo and /groups/created still return soft-deleted groups.
const active = (groups) => groups.filter((group) => !group.isDeleted);

export async function getMyGroups() {
  const { groups } = await api.get("/groups/belongTo");
  return active(groups);
}

export async function getCreatedGroups() {
  const { groups } = await api.get("/groups/created");
  return active(groups);
}

export async function getGroup(groupId) {
  const { group } = await api.get(`/groups/${groupId}`);
  return group;
}

export async function createGroup(name) {
  const { group } = await api.post("/groups", { name });
  return group;
}

export async function renameGroup(groupId, name) {
  await api.patch(`/groups/${groupId}`, { name });
}

export async function deleteGroup(groupId) {
  await api.delete(`/groups/${groupId}`);
}

export async function getMembers(groupId) {
  const { members } = await api.get(`/groups/${groupId}/members`);
  return members;
}

export async function addMembers(groupId, userIds) {
  const { member } = await api.post(`/groups/${groupId}/members`, { userIds });
  return member;
}

export async function removeMember(groupId, userId) {
  await api.delete(`/groups/${groupId}/members/${userId}`);
}

// Mock for GET /users/search?q=
export async function searchUsers(groupId, query) {
  const params = new URLSearchParams({ q: query });

  const { users } = await api.get(
    `/users/groups/${groupId}/search?${params.toString()}`
  );

  return users;
}

// Mock for GET /groups/:groupId/invites
export function getInvites(groupId) {
  return mockInvites.list(groupId);
}

// Mock for POST /groups/:groupId/invites (sends the invite email).
export function inviteMember(groupId, email, invitedBy) {
  return mockInvites.create(groupId, { email, invitedBy });
}

// Mock for DELETE /groups/:groupId/invites/:inviteId
export function cancelInvite(groupId, inviteId) {
  return mockInvites.cancel(groupId, inviteId);
}
