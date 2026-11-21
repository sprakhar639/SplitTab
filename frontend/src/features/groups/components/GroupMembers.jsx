import { useEffect, useState } from "react";

import Avatar from "../../../shared/components/Avatar";
import Button from "../../../shared/components/Button";
import Modal from "../../../shared/components/Modal";
import formatDate from "../../../shared/utils/formatDate";
import { addMembers, removeMember, searchUsers } from "../group.service";

export default function GroupMembers({
  groupId,
  members = [],
  myId,
  isAdmin,
  onChanged,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    const searchQuery = query.trim();

    if (searchQuery.length < 2) return;

    let cancelled = false;

    const timer = setTimeout(async () => {
      setSearching(true);
      setError("");

      try {
        const users = await searchUsers(groupId, searchQuery);

        if (!cancelled) {
          setResults(Array.isArray(users) ? users : []);
        }
      } catch (err) {
        if (!cancelled) {
          setResults([]);
          setError(err?.message || "Unable to search users.");
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [groupId, query]);

  function handleQueryChange(event) {
    const value = event.target.value;

    setQuery(value);
    setError("");

    if (value.trim().length < 2) {
      setResults([]);
      setSearching(false);
    }
  }

  function resetSearch() {
    setQuery("");
    setResults([]);
    setError("");
  }

  async function handleAdd(user) {
    setBusyId(user.id);
    setError("");

    try {
      // The user selects a search result; its database ID is sent internally.
      await addMembers(groupId, [user.id]);
      resetSearch();
      await onChanged();
    } catch (err) {
      setError(err?.message || "Unable to add this member.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleConfirmRemove() {
    if (!removing) return;

    setBusyId(removing.id);
    setError("");

    try {
      await removeMember(groupId, removing.id);
      setRemoving(null);
      await onChanged();
    } catch (err) {
      setError(err?.message || "Unable to remove this member.");
    } finally {
      setBusyId(null);
    }
  }

  const trimmedQuery = query.trim();

  return (
    <div className="flex flex-col gap-4">
      {isAdmin && (
        <div className="rounded-xl border border-line bg-white p-4">
          <label htmlFor="member-search" className="text-xs font-bold text-ink">
            Add a member
          </label>

          <input
            id="member-search"
            type="search"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search by name, username or email..."
            autoComplete="off"
            className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-deep focus:ring-2 focus:ring-mint/50"
          />

          <p className="mt-1.5 text-xs text-mute">
            Search by name, username or email. Results update as you type.
          </p>

          {trimmedQuery.length >= 1 && (
            <ul className="mt-2 flex flex-col divide-y divide-line rounded-lg border border-line">
              {searching && (
                <li className="px-3 py-3 text-sm text-mute">Searching...</li>
              )}

              {!searching &&
                results.map((user) => (
                  <li
                    key={user.id}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <Avatar name={user.name} id={user.id} size="size-7" />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-mute">
                        {user.username ? `@${user.username}` : ""}
                        {user.username && user.email ? " · " : ""}
                        {user.email || ""}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      loading={busyId === user.id}
                      disabled={busyId !== null}
                      onClick={() => handleAdd(user)}
                    >
                      Add
                    </Button>
                  </li>
                ))}

              {!searching && results.length === 0 && !error && (
                <li className="px-3 py-3 text-sm text-mute">
                  No matching users found.
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-danger"
        >
          {error}
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
                        {Number(member.id) === Number(myId) && " (you)"}
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
                  <span className="rounded-full bg-mint/30 px-2 py-0.5 text-[11px] font-bold text-success">
                    Active
                  </span>
                </td>

                <td className="px-4 py-3 text-mute">
                  {formatDate(member.joinedAt)}
                </td>

                <td className="px-4 py-3 text-right">
                  {isAdmin && Number(member.id) !== Number(myId) && (
                    <button
                      type="button"
                      onClick={() =>
                        setRemoving({
                          id: member.id,
                          label: member.name,
                        })
                      }
                      className="text-xs font-bold text-danger hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {members.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-mute">
                  No members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(removing)}
        title={`Remove ${removing?.label || "this member"}?`}
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
              Remove member
            </Button>
          </>
        }
      >
        <p className="text-sm text-mute">
          They will lose access to this group. Existing expenses they're part of
          will be kept.
        </p>
      </Modal>
    </div>
  );
}
