import { describe, it, expect } from "vitest";

import {
  createGroup,
  addMember,
  removeMember,
  groupsCreatedByUser,
  groupsUserBelongTo,
  allGroupMembers,
  getGroupDetails,
  updateGroup,
  deleteGroup,
} from "./group.service.js";

// IDs from your seeded database
const adminId = Number(process.env.TEST_ADMIN_ID);
const memberId = Number(process.env.TEST_MEMBER_ID);
const nonMemberId = Number(process.env.TEST_NON_MEMBER_ID);

let groupId;

describe("Group Integration Tests", () => {

  // 1. Create group
  it("should create group and assign creator as ADMIN", async () => {
    const group = await createGroup({
      name: `Integration Group ${Date.now()}`,
      userId: adminId,
    });

    groupId = group.id;

    expect(group).toBeDefined();
    expect(group.createdById).toBe(adminId);
  });

  // 2. Add member
  it("should allow admin to add a member", async () => {
    const result = await addMember({
      groupId,
      userIds: [memberId],
      requesterId: adminId,
    });

    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe(memberId);
    expect(result[0].role).toBe("MEMBER");
  });

  // 3. Reject duplicate member
  it("should reject adding an existing member", async () => {
    await expect(
      addMember({
        groupId,
        userIds: [memberId],
        requesterId: adminId,
      })
    ).rejects.toThrow(`User ${memberId} is already a group member`);
  });

  // 4. Get group details
  it("should return group details to a member", async () => {
    const result = await getGroupDetails({
      groupId,
      userId: adminId,
    });

    expect(result.id).toBe(groupId);
  });

  // 5. Get all members
  it("should return all group members", async () => {
    const result = await allGroupMembers({
      groupId,
      userId: adminId,
    });

    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  // 6. Get groups created by user
  it("should return groups created by user", async () => {
    const result = await groupsCreatedByUser({
      userId: adminId,
    });

    expect(result.some((group) => group.id === groupId)).toBe(true);
  });

  // 7. Get groups user belongs to
  it("should return groups user belongs to", async () => {
    const result = await groupsUserBelongTo({
      userId: memberId,
    });

    expect(result.some((group) => group.id === groupId)).toBe(true);
  });

  // 8. Update group
  it("should allow admin to update group name", async () => {
    const updated = await updateGroup({
      groupId,
      userId: adminId,
      name: "Updated Integration Group",
    });

    expect(updated).toBeDefined();
  });

  // 9. Reject non-member access
  it("should reject non-member group access", async () => {
    await expect(
      getGroupDetails({
        groupId,
        userId: nonMemberId,
      })
    ).rejects.toThrow("You are not a member of this group.");
  });

  // 10. Remove member
  it("should allow admin to remove a member", async () => {
    const result = await removeMember({
      groupId,
      userId: memberId,
      requesterId: adminId,
    });

    expect(result.userId).toBe(memberId);
  });

  // 11. Delete group
  it("should allow admin to soft-delete group", async () => {
    const result = await deleteGroup({
      groupId,
      userId: adminId,
    });

    expect(result.message).toBe("Group deleted successfully");
  });
});