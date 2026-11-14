import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDb, mockTransaction } = vi.hoisted(() => ({
  mockDb: { orm: { public: {} } },
  mockTransaction: vi.fn(),
}));

vi.mock("../../prisma/db.ts", () => ({
  default: {
    get orm() {
      return mockDb.orm;
    },
    transaction: mockTransaction,
  },
}));

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

describe("Group Service Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockReset();
    mockDb.orm.public = {};
  });

  // 1. Create group
  it("should create a group and assign creator as ADMIN", async () => {
    const group = { id: 1, name: "Trip", createdById: 10 };

    const Group = {
      create: vi.fn().mockResolvedValue(group),
    };

    const GroupMember = {
      create: vi.fn().mockResolvedValue({ role: "ADMIN" }),
    };

    mockTransaction.mockImplementation((callback) =>
      callback({ orm: { public: { Group, GroupMember } } })
    );

    const result = await createGroup({ name: "Trip", userId: 10 });

    expect(result).toEqual(group);
    expect(GroupMember.create).toHaveBeenCalledWith({
      groupId: 1,
      userId: 10,
      role: "ADMIN",
    });
  });

  // 2. Reject non-admin adding members
  it("should reject adding members by non-admin", async () => {
    const GroupMember = {
      where: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ role: "MEMBER" }),
      }),
    };

    mockTransaction.mockImplementation((callback) =>
      callback({ orm: { public: { GroupMember } } })
    );

    await expect(
      addMember({ groupId: 1, userIds: [20], requesterId: 10 })
    ).rejects.toThrow("Only group admins can add members");
  });

  // 3. Reject empty member list
  it("should reject an empty member list", async () => {
    const GroupMember = {
      where: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ role: "ADMIN" }),
      }),
    };

    mockTransaction.mockImplementation((callback) =>
      callback({ orm: { public: { GroupMember } } })
    );

    await expect(
      addMember({ groupId: 1, userIds: [], requesterId: 10 })
    ).rejects.toThrow("Provide at least one user ID");
  });

  // 4. Reject duplicate member addition
  it("should reject adding an existing member", async () => {
    const GroupMember = {
      where: vi.fn()
        .mockReturnValueOnce({
          first: vi.fn().mockResolvedValue({ role: "ADMIN" }),
        })
        .mockReturnValueOnce({
          first: vi.fn().mockResolvedValue({ userId: 20 }),
        }),
    };

    const User = {
      where: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ id: 20 }),
      }),
    };

    mockTransaction.mockImplementation((callback) =>
      callback({ orm: { public: { GroupMember, User } } })
    );

    await expect(
      addMember({ groupId: 1, userIds: [20], requesterId: 10 })
    ).rejects.toThrow();
  });

  // 5. Reject non-admin removing members
  it("should reject member removal by non-admin", async () => {
    const GroupMember = {
      where: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ role: "MEMBER" }),
      }),
    };

    mockTransaction.mockImplementation((callback) =>
      callback({ orm: { public: { GroupMember } } })
    );

    await expect(
      removeMember({ groupId: 1, userId: 20, requesterId: 10 })
    ).rejects.toThrow("Only group admin can remove members");
  });

  // 6. Prevent admin from removing themselves
  it("should prevent admin from removing themselves", async () => {
    const GroupMember = {
      where: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ role: "ADMIN" }),
      }),
    };

    mockTransaction.mockImplementation((callback) =>
      callback({ orm: { public: { GroupMember } } })
    );

    await expect(
      removeMember({ groupId: 1, userId: 10, requesterId: 10 })
    ).rejects.toThrow("You cannot remove yourself as group admin");
  });

  // 7. Get groups created by user
  it("should return groups created by a user", async () => {
    const groups = [{ id: 1, name: "Trip" }];

    const Group = {
      where: vi.fn().mockReturnValue({
        all: vi.fn().mockResolvedValue(groups),
      }),
    };

    mockDb.orm.public = { Group };

    const result = await groupsCreatedByUser(10);

    expect(result).toEqual(groups);
  });

  // 8. Get groups user belongs to
  it("should return groups where the user is a member", async () => {
    const memberships = [{ groupId: 1 }, { groupId: 2 }];
    const groups = [{ id: 1 }, { id: 2 }];

    const GroupMember = {
      where: vi.fn().mockReturnValue({
        all: vi.fn().mockResolvedValue(memberships),
      }),
    };

    const Group = {
      where: vi.fn().mockReturnValue({
        all: vi.fn().mockResolvedValue(groups),
      }),
    };

    mockDb.orm.public = { GroupMember, Group };

    const result = await groupsUserBelongTo(10);

    expect(result).toEqual(groups);
  });

  // 9. Get all group members
  it("should return all members of a group", async () => {
    const memberships = [
      { userId: 10, role: "ADMIN", joinedAt: new Date() },
      { userId: 20, role: "MEMBER", joinedAt: new Date() },
    ];

    const users = [
      { id: 10, name: "User One", email: "one@test.com" },
      { id: 20, name: "User Two", email: "two@test.com" },
    ];

    const Group = {
      where: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ id: 1 }),
      }),
    };

    const GroupMember = {
      where: vi.fn()
        .mockReturnValueOnce({
          first: vi.fn().mockResolvedValue({ userId: 10 }),
        })
        .mockReturnValueOnce({
          all: vi.fn().mockResolvedValue(memberships),
        }),
    };

    const User = {
      where: vi.fn().mockReturnValue({
        all: vi.fn().mockResolvedValue(users),
      }),
    };

    mockDb.orm.public = { Group, GroupMember, User };

    const result = await allGroupMembers({ groupId: 1, userId: 10 });

    expect(result).toHaveLength(2);
  });

  // 10. Reject non-member group details access
  it("should reject group details access by non-member", async () => {
    const Group = {
      where: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ id: 1 }),
      }),
    };

    const GroupMember = {
      where: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
      }),
    };

    mockDb.orm.public = { Group, GroupMember };

    await expect(
      getGroupDetails({ groupId: 1, userId: 20 })
    ).rejects.toThrow("You are not a member of this group.");
  });

  // 11. Reject non-admin group updates
  it("should reject group updates by non-admin", async () => {
    const GroupMember = {
      where: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ role: "MEMBER" }),
      }),
    };

    mockDb.orm.public = { GroupMember };

    await expect(
      updateGroup({ groupId: 1, userId: 20, name: "New Name" })
    ).rejects.toThrow("Unauthorized User");
  });

  // 12. Reject non-admin group deletion
  it("should reject group deletion by non-admin", async () => {
    const GroupMember = {
      where: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ role: "MEMBER" }),
      }),
    };

    mockTransaction.mockImplementation((callback) =>
      callback({ orm: { public: { GroupMember } } })
    );

    await expect(
      deleteGroup({ groupId: 1, userId: 20 })
    ).rejects.toThrow(
      "User does not have permission to delete the group"
    );
  });
});