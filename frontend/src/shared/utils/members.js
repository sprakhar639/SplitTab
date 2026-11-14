export function memberName(members, userId, myId) {
  if (userId === myId) return "You";

  return members.find((member) => member.id === userId)?.name ?? `User #${userId}`;
}

export function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";

  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}
