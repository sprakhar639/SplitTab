import { useState } from "react";

function Groups() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl">Groups I Created</h1>

      <button
        onClick={() => setShowForm(true)}
        className="rounded bg-blue-600 px-4 py-2 text-white"
      >
        Create Group
      </button>

      {showForm && (
        <div>
          <h2>Create Group Form</h2>
        </div>
      )}
    </div>
  );
}

export default Groups;
