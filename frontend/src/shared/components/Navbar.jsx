import { NavLink, useNavigate } from "react-router-dom";

import { isFeatureReady } from "../../config/features";
import { useAuth } from "../../context/AuthContext";
import Avatar from "./Avatar";
import { ComingSoonBadge } from "./ComingSoon";
import Icon from "./Icon";

const LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/groups", label: "Groups", icon: "groups" },
  { to: "/expenses", label: "Expenses", icon: "expenses", feature: "expenseHistory" },
  { to: "/settlements", label: "Settlements", icon: "settlements", feature: "peopleBalances" },
  { to: "/munshi-ai", label: "Munshi AI", icon: "assistant", feature: "assistant" },
  { to: "/reminders", label: "Reminders", icon: "reminders", feature: "reminders" },
  { to: "/integrations", label: "Integrations", icon: "integrations", feature: "integrations" },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-deep-2 text-white shadow-[inset_2px_0_0_var(--color-lime)]"
      : "text-white/60 hover:text-white"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.name || user?.username || user?.email;

  async function handleLogout() {
    await logout().catch(() => {});
    navigate("/login");
  }

  return (
    <aside className="flex flex-col gap-5 bg-deep px-4 py-5 text-white md:sticky md:top-0 md:h-screen">
      <div className="flex items-center gap-2.5 text-lg font-extrabold">
        <span className="grid size-9 place-items-center rounded-xl bg-lime text-deep">
          ₹
        </span>
        SplitTab
      </div>

      <nav className="flex gap-1 overflow-x-auto md:flex-col">
        {LINKS.map((link) => (
          <NavLink key={link.to} to={link.to} className={linkClass}>
            <Icon name={link.icon} />
            {link.label}
            {link.feature && !isFeatureReady(link.feature) && (
              <ComingSoonBadge tone="dark" className="ml-auto" />
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-2 border-t border-white/10 pt-4 md:mt-auto">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1.5 transition ${
              isActive ? "bg-deep-2" : "hover:bg-deep-2"
            }`
          }
        >
          <Avatar name={displayName} id={user?.id} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            <p className="text-xs text-white/60">View profile</p>
          </div>
        </NavLink>

        <button
          type="button"
          onClick={handleLogout}
          title="Log out"
          aria-label="Log out"
          className="rounded-lg p-2 text-white/60 transition hover:bg-deep-2 hover:text-lime"
        >
          <Icon name="logout" />
        </button>
      </div>
    </aside>
  );
}
