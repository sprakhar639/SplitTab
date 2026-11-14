import { useState } from "react";

import Button from "../../../shared/components/Button";
import Input from "../../../shared/components/Input";
import Modal from "../../../shared/components/Modal";
import { createGroup } from "../group.service";

export default function CreateGroupModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleClose() {
    setName("");
    setError("");
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give the group a name");
      return;
    }

    setSaving(true);
    try {
      const group = await createGroup(trimmed);
      setName("");
      onCreated(group);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Create a group" onClose={handleClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          id="group-name"
          label="Group name"
          placeholder="Goa Trip"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          error={error}
          hint="You'll be the admin. You can add members next."
          autoFocus
        />

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Create group
          </Button>
        </div>
      </form>
    </Modal>
  );
}
