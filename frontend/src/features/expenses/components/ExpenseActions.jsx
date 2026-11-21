import { useState } from "react";

import Button from "../../../shared/components/Button";
import Modal from "../../../shared/components/Modal";
import { deleteExpense, updateExpense } from "../expense.service";
import ExpenseForm from "./ExpenseForm";

function DeleteExpense({ groupId, expense, onDeleted, onCancel }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await deleteExpense(groupId, expense.id);
      onDeleted();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <>
      <p className="text-sm text-mute">
        This removes the expense and everyone's share of it. Balances in the
        group update straight away. You can't undo this.
      </p>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-danger">{error}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Keep it
        </Button>
        <Button variant="danger" loading={deleting} onClick={handleDelete}>
          Delete expense
        </Button>
      </div>
    </>
  );
}

// Edit and Delete buttons for the expense details page, with their dialogs.
export default function ExpenseActions({ groupId, expense, members, myId, onSaved, onDeleted }) {
  const [open, setOpen] = useState(null); // "edit" | "delete" | null
  const close = () => setOpen(null);
  const title = expense.description || "Expense";

  async function handleSave(payload) {
    await updateExpense(groupId, expense.id, payload);
    close();
    onSaved();
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => setOpen("edit")}>
          Edit
        </Button>
        <Button variant="danger" onClick={() => setOpen("delete")}>
          Delete
        </Button>
      </div>

      <Modal open={open === "edit"} title={`Edit “${title}”`} onClose={close} size="lg">
        <ExpenseForm
          members={members}
          myId={myId}
          expense={expense}
          submitLabel="Save changes"
          onSubmit={handleSave}
          onCancel={close}
        />
      </Modal>

      <Modal open={open === "delete"} title={`Delete “${title}”?`} onClose={close}>
        <DeleteExpense groupId={groupId} expense={expense} onDeleted={onDeleted} onCancel={close} />
      </Modal>
    </>
  );
}
