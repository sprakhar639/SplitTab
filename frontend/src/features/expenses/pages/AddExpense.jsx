import { Link, useNavigate, useParams } from "react-router-dom";

import Loader from "../../../shared/components/Loader";
import useGroup from "../../groups/hooks/useGroup";
import ExpenseForm from "../components/ExpenseForm";
import { createExpense } from "../expense.service";

export default function AddExpense() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { group, members, myId, loading, error } = useGroup(groupId);

  if (loading) return <Loader label="Loading group…" />;

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-danger">
        {error}
      </p>
    );
  }

  async function handleSubmit(payload) {
    await createExpense(groupId, payload);
    navigate(`/groups/${groupId}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-mute">
        <Link to="/groups" className="hover:text-deep">
          Groups
        </Link>{" "}
        /{" "}
        <Link to={`/groups/${groupId}`} className="hover:text-deep">
          {group.name}
        </Link>{" "}
        / Add expense
      </p>

      <div className="max-w-xl rounded-xl border border-line bg-white p-6">
        <h1 className="mb-5 text-xl font-extrabold tracking-tight">Add expense</h1>
        <ExpenseForm
          members={members}
          myId={myId}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/groups/${groupId}`)}
        />
      </div>
    </div>
  );
}
