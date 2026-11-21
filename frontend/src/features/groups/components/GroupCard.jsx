import { Link } from "react-router-dom";

import formatDate from "../../../shared/utils/formatDate";

export default function GroupCard({ group, myId }) {
  const isCreator = myId !== null && Number(group.createdById) === myId;

  return (
    <Link
      to={`/groups/${group.id}`}
      className="flex flex-col gap-4 rounded-xl border border-line bg-white p-4 transition hover:border-deep/40 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-deep"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-extrabold text-ink">{group.name}</h3>

        {isCreator && (
          <span className="rounded-md bg-lime/40 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-deep">
            ADMIN
          </span>
        )}
      </div>

      <div className="flex justify-between border-t border-dashed border-line pt-3 text-xs text-mute">
        <span>Created {formatDate(group.createdAt)}</span>
        <span className="font-semibold text-deep">Open →</span>
      </div>
    </Link>
  );
}
