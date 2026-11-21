import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";
import Button from "../../../shared/components/Button";
import Loader from "../../../shared/components/Loader";
import CreateGroupModal from "../components/CreateGroupModal";
import GroupCard from "../components/GroupCard";
import { getCreatedGroups, getMyGroups } from "../group.service";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "created", label: "Owned by me" },
];

export default function Groups() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [groups, setGroups] = useState({ all: [], created: [] });
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    Promise.all([getMyGroups(), getCreatedGroups()])
      .then(([all, created]) => setGroups({ all, created }))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const visible = groups[filter];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Your groups</h1>
          <p className="text-sm text-mute">Groups you belong to</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ New group</Button>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            aria-pressed={filter === item.key}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              filter === item.key
                ? "border-deep bg-deep text-white"
                : "border-line bg-white text-mute hover:text-ink"
            }`}
          >
            {item.label} · {groups[item.key].length}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader label="Loading groups…" />
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((group) => (
            <GroupCard key={group.id} group={group} myId={user?.id ?? null} />
          ))}

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="grid min-h-28 place-items-center rounded-xl border-2 border-dashed border-line text-sm font-bold text-mute transition hover:border-deep/40 hover:text-deep"
          >
            + Create a group
          </button>
        </div>
      )}

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(group) => navigate(`/groups/${group.id}/members`)}
      />
    </div>
  );
}
