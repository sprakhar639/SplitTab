import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";
import Button from "../../../shared/components/Button";
import Loader from "../../../shared/components/Loader";
import CreateGroupModal from "../../groups/components/CreateGroupModal";
import GroupCard from "../../groups/components/GroupCard";
import { getCreatedGroups, getMyGroups } from "../../groups/group.service";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [createdCount, setCreatedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    Promise.all([getMyGroups(), getCreatedGroups()])
      .then(([mine, created]) => {
        setGroups(mine);
        setCreatedCount(created.length);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const recent = [...groups]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);
  const firstName = (user?.name || user?.username || "").split(" ")[0];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {firstName ? `Hi, ${firstName}` : "Welcome back"}
          </h1>
          <p className="text-sm text-mute">Here's what's happening across your groups.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ New group</Button>
      </div>

      {loading ? (
        <Loader label="Loading your groups…" />
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-white p-5">
              <p className="text-xs font-bold tracking-wider text-mute uppercase">
                Groups you're in
              </p>
              <p className="text-3xl font-extrabold tabular-nums">{groups.length}</p>
            </div>
            <div className="rounded-xl border border-line bg-white p-5">
              <p className="text-xs font-bold tracking-wider text-mute uppercase">
                Groups you own
              </p>
              <p className="text-3xl font-extrabold tabular-nums">{createdCount}</p>
            </div>
          </div>

          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-extrabold">Recent groups</h2>
              <Link to="/groups" className="text-sm font-semibold text-deep hover:underline">
                View all
              </Link>
            </div>

            {recent.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-line p-8 text-center">
                <p className="text-sm text-mute">
                  You're not in any groups yet. Create one for your next trip or flat.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map((group) => (
                  <GroupCard key={group.id} group={group} myId={user?.id ?? null} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(group) => navigate(`/groups/${group.id}/members`)}
      />
    </div>
  );
}
