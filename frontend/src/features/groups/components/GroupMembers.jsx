import { useEffect, useState } from "react";

import { isFeatureReady } from "../../../config/features";
import Avatar from "../../../shared/components/Avatar";
import Button from "../../../shared/components/Button";
import { ComingSoonBadge } from "../../../shared/components/ComingSoon";
import Modal from "../../../shared/components/Modal";
import { PreviewBanner } from "../../../shared/components/ComingSoon";
import formatDate from "../../../shared/utils/formatDate";
import {
  addMembers,
  cancelInvite,
  getInvites,
  inviteMember,
  removeMember,
  searchUsers,
} from "../group.service";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Until these ship, admins add people by numeric user ID (a real endpoint),
// and can preview search and invites on mock data.
const SEARCH_READY = isFeatureReady("memberSearch");
const INVITES_READY = isFeatureReady("invites");

function StatusPill({ pending }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap ${
        pending ? "bg-amber-100 text-amber-800" : "bg-mint/30 text-success"
      }`}
    >
      {pending ? "Invite pending" : "Active"}
    </span>
  );
}

export default function GroupMembers({ groupId, members, myId, isAdmin, onChanged }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [invites, setInvites] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [peeking, setPeeking] = useState(false);

  const searchOn = SEARCH_READY || peeking;
  const invitesOn = INVITES_READY || peeking;

  useEffect(() => {
    if (invitesOn) getInvites(groupId).then(setInvites);
  }, [groupId, invitesOn]);

  useEffect(() => {
    if (!searchOn || !query.trim()) return;

    const memberIds = members.map((member) => member.id);
    const timer = setTimeout(() => {
      searchUsers(query, memberIds).then(setResults);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, members, searchOn]);

  const trimmed = query.trim();
  const email = trimmed.toLowerCase();

  const typedId = /^\d+$/.test(trimmed) ? Number(trimmed) : null;
  const canAddTypedId =
    typedId !== null &&
    !members.some((member) => member.id === typedId) &&
    !results.some((user) => user.id === typedId);

  // An email with no account behind it gets an invite instead of being added.
  const isMemberEmail = members.some((member) => member.email?.toLowerCase() === email);
  const isInvited = invites.some((invite) => invite.email === email);
  const canInvite =
    invitesOn &&
    EMAIL_REGEX.test(trimmed) &&
    !isMemberEmail &&
    !isInvited &&
    !results.some((user) => user.email?.toLowerCase() === email);

  function handleQueryChange(e) {
    setQuery(e.target.value);
    setError("");
    setNotice("");
    if (!e.target.value.trim()) setResults([]);
  }

  function resetSearch() {
    setQuery("");
    setResults([]);
  }

  async function handleAdd(userId) {
    setBusyId(userId);
    setError("");
    try {
      await addMembers(groupId, [userId]);
      resetSearch();
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleInvite() {
    setBusyId("invite");
    setError("");
    try {
      const invite = await inviteMember(groupId, email, myId);
      setInvites((prev) => [...prev, invite]);
      setNotice(
        `Invite sent to ${invite.email}. They'll join once they create an account and accept.`,
      );
      resetSearch();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleConfirmRemove() {
    setBusyId(removing.id);
    try {
      if (removing.type === "invite") {
        await cancelInvite(groupId, removing.id);
        setInvites((prev) => prev.filter((invite) => invite.id !== removing.id));
      } else {
        await removeMember(groupId, removing.id);
        await onChanged();
      }
      setRemoving(null);
    } catch (err) {
      setError(err.message);
      setRemoving(null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {peeking && (
        <PreviewBanner feature="memberSearch" onExit={() => setPeeking(false)} />
      )}

      {isAdmin && (
        <div className="relative rounded-xl border border-line bg-white p-4">
          <label htmlFor="member-search" className="text-xs font-bold text-ink">
            Add a member
          </label>
          <input
            id="member-search"
            value={query}
            onChange={handleQueryChange}
            placeholder={
              searchOn
                ? "Search by name or username, or enter an email to invite"
                : "Enter the user ID of the person to add"
            }
            autoComplete="off"
            className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-deep focus:ring-2 focus:ring-mint/50"
          />

          {trimmed && (
            <ul className="mt-2 flex flex-col divide-y divide-line rounded-lg border border-line">
              {results.map((user) => (
                <li key={user.id} className="flex items-center gap-3 px-3 py-2">
                  <Avatar name={user.name} id={user.id} size="size-7" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-mute">
                      {user.email} · ID {user.id}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    loading={busyId === user.id}
                    disabled={peeking}
                    title={peeking ? "Adding from search isn't available in a preview" : undefined}
                    onClick={() => handleAdd(user.id)}
                  >
                    Add
                  </Button>
                </li>
              ))}

              {canAddTypedId && (
                <li className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="text-sm">Add user with ID {typedId}</span>
                  <Button
                    variant="ghost"
                    loading={busyId === typedId}
                    onClick={() => handleAdd(typedId)}
                  >
                    Add
                  </Button>
                </li>
              )}

              {canInvite && (
                <li className="flex items-center gap-3 px-3 py-2">
                  <Avatar name={email} size="size-7" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{email}</p>
                    <p className="text-xs text-mute">
                      No SplitTab account yet. We'll email them an invite.
                    </p>
                  </div>
                  <Button loading={busyId === "invite"} onClick={handleInvite}>
                    Send invite
                  </Button>
                </li>
              )}

              {isMemberEmail && (
                <li className="px-3 py-2 text-sm text-mute">
                  {email} is already in this group.
                </li>
              )}

              {isInvited && (
                <li className="px-3 py-2 text-sm text-mute">
                  {email} has already been invited.
                </li>
              )}

              {results.length === 0 &&
                !canAddTypedId &&
                !canInvite &&
                !isMemberEmail &&
                !isInvited && (
                  <li className="px-3 py-2 text-sm text-mute">
                    {searchOn
                      ? "No matching users. Enter their email address to invite them."
                      : "Enter a numeric user ID, like 4."}
                  </li>
                )}
            </ul>
          )}

          {SEARCH_READY && INVITES_READY ? (
            <p className="mt-2 text-xs text-mute">
              Search and invites use mock data until the backend supports them.
            </p>
          ) : (
            !peeking && (
              <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-mute">
                <ComingSoonBadge />
                Finding people by name or email, and inviting people without an account.
                <button
                  type="button"
                  onClick={() => setPeeking(true)}
                  className="font-bold text-deep hover:underline"
                >
                  Take a peek →
                </button>
              </p>
            )
          )}
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-lg bg-mint/30 px-3 py-2 text-sm font-semibold text-success">
          ✓ {notice}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-canvas/60 text-left text-[10.5px] font-extrabold tracking-wider text-mute">
              <th className="px-4 py-2.5">NAME</th>
              <th className="px-4 py-2.5">ROLE</th>
              <th className="px-4 py-2.5">STATUS</th>
              <th className="px-4 py-2.5">JOINED</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={member.name} id={member.id} />
                    <div className="min-w-0">
                      <p className="font-bold">
                        {member.name}
                        {member.id === myId && " (you)"}
                      </p>
                      <p className="text-xs text-mute">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-wider ${
                      member.role === "ADMIN"
                        ? "bg-lime/40 text-deep"
                        : "bg-canvas text-mute"
                    }`}
                  >
                    {member.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusPill pending={false} />
                </td>
                <td className="px-4 py-3 text-mute">{formatDate(member.joinedAt)}</td>
                <td className="px-4 py-3 text-right">
                  {isAdmin && member.id !== myId && (
                    <button
                      type="button"
                      onClick={() =>
                        setRemoving({ type: "member", id: member.id, label: member.name })
                      }
                      className="text-xs font-bold text-danger hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {invites.map((invite) => (
              <tr key={invite.id} className="bg-amber-50/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={invite.email} />
                    <div className="min-w-0">
                      <p className="font-bold">{invite.email}</p>
                      <p className="text-xs text-mute">
                        Invited {formatDate(invite.invitedAt)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-canvas px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-mute">
                    MEMBER
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusPill pending />
                </td>
                <td className="px-4 py-3 text-mute">—</td>
                <td className="px-4 py-3 text-right">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() =>
                        setRemoving({ type: "invite", id: invite.id, label: invite.email })
                      }
                      className="text-xs font-bold text-danger hover:underline"
                    >
                      Cancel invite
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(removing)}
        title={
          removing?.type === "invite"
            ? `Cancel the invite to ${removing?.label}?`
            : `Remove ${removing?.label}?`
        }
        onClose={() => setRemoving(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRemoving(null)}>
              Keep
            </Button>
            <Button
              variant="danger"
              loading={busyId === removing?.id}
              onClick={handleConfirmRemove}
            >
              {removing?.type === "invite" ? "Cancel invite" : "Remove member"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-mute">
          {removing?.type === "invite"
            ? "The invite link stops working. You can invite them again later."
            : "They lose access to this group. Expenses they're part of are kept."}
        </p>
      </Modal>
    </div>
  );
}
