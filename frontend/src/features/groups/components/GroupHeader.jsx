import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import Button from "../../../shared/components/Button";
import Input from "../../../shared/components/Input";
import Modal from "../../../shared/components/Modal";
import { deleteGroup, renameGroup } from "../group.service";

export default function GroupHeader({ group, members, isAdmin, onRenamed }) {
  const navigate = useNavigate();

  const [dialog, setDialog] = useState(null); // "rename" | "delete" | null
  const [name, setName] = useState(group.name);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const tabs = [
    { to: `/groups/${group.id}`, label: "Expenses", end: true },
    { to: `/groups/${group.id}/members`, label: `Members · ${members.length}` },
    { to: `/groups/${group.id}/balances`, label: "Balances" },
    { to: `/groups/${group.id}/settle`, label: "Settle up" },
  ];

  function openDialog(type) {
    setName(group.name);
    setError("");
    setDialog(type);
  }

  async function handleRename(e) {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Group name can't be empty");
      return;
    }

    setSaving(true);
    try {
      await renameGroup(group.id, trimmed);
      onRenamed(trimmed);
      setDialog(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await deleteGroup(group.id);
      navigate("/groups", { replace: true });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <header className="flex flex-col gap-4">
      <p className="text-xs text-mute">
        <Link to="/groups" className="hover:text-deep">
          Groups
        </Link>{" "}
        / {group.name}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight">{group.name}</h1>
          {isAdmin && (
            <span className="rounded-md bg-lime/40 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-deep">
              ADMIN
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <>
              <Button variant="ghost" onClick={() => openDialog("rename")}>
                Rename
              </Button>
              <Button variant="danger" onClick={() => openDialog("delete")}>
                Delete
              </Button>
            </>
          )}
          <Button
            variant="lime"
            onClick={() => navigate(`/groups/${group.id}/expenses/new`)}
          >
            + Add expense
          </Button>
        </div>
      </div>

      <nav className="flex gap-5 overflow-x-auto border-b border-line">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `whitespace-nowrap pb-2.5 text-sm font-bold transition ${
                isActive
                  ? "text-ink shadow-[inset_0_-2px_0_var(--color-deep)]"
                  : "text-mute hover:text-ink"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Modal
        open={dialog === "rename"}
        title="Rename group"
        onClose={() => setDialog(null)}
      >
        <form onSubmit={handleRename} className="flex flex-col gap-4" noValidate>
          <Input
            id="rename-group"
            label="Group name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            error={error}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={dialog === "delete"}
        title={`Delete ${group.name}?`}
        onClose={() => setDialog(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Keep group
            </Button>
            <Button variant="danger" loading={saving} onClick={handleDelete}>
              Delete group
            </Button>
          </>
        }
      >
        <p className="text-sm text-mute">
          The group disappears for every member. Its expenses and settlements
          stay in the database.
        </p>
        {error && <p className="text-xs font-semibold text-danger">{error}</p>}
      </Modal>
    </header>
  );
}
