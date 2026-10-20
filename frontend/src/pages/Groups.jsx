import { useState, useEffect } from "react";
import axios from "../api/axios";

function Groups() {
  const [groups, setGroups] = useState([]);
  const [showForm, setshowForm] = useState(false);

  useEffect(() => {
    async function fetchGroups() {
      try {
        const response = await axios.get("/groups/created");
        setGroups(response.data.groups);
      } catch (error) {
        console.log("API error:", error.response?.status, error.message);
      }
    }

    fetchGroups();
  }, []);
  return (
    <div className="min-h-screen space-y-6 bg-black p-8 text-green-400">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Groups I Created</h1>

          <p className="mt-2 text-green-300">Manage your groups.</p>
        </div>

        <button
          onClick={() => setshowForm(true)}
          className="rounded-lg border border-green-500 bg-black px-4 py-2 text-green-400 transition hover:bg-green-500 hover:text-black"
        >
          + Create Group
        </button>
      </div>

      <div className="flex flex-wrap gap-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="w-fit rounded-lg border border-green-500 p-4"
          >
            <h2 className="text-xl font-semibold">{group.name}</h2>
          </div>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" >
          <div className="w-fit max-w-md rounded-xl border border-green-500 bg-gray-950 p-6">
            <h2 className="text-2xl font-bold">Create New Group</h2>
          </div>
         </div>
      )}
    </div>
  );
}

export default Groups;
