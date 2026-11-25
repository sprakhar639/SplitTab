import { NavLink, useNavigate } from "react-router-dom";

import { isFeatureReady } from "../../config/features";
import { useAuth } from "../../context/AuthContext";
import Avatar from "./Avatar";
import { ComingSoonBadge } from "./ComingSoon";
import Icon from "./Icon";

const LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/groups", label: "Groups", icon: "groups" },
  {
    to: "/expenses",
    label: "Expenses",
    icon: "expenses",
    feature: "expenseHistory",
  },
  {
    to: "/settlements",
    label: "Settlements",
    icon: "settlements",
    feature: "peopleBalances",
  },
  {
    to: "/munshi-ai",
    label: "Munshi AI",
    icon: "assistant",
    feature: "assistant",
  },
  {
    to: "/reminders",
    label: "Reminders",
    icon: "reminders",
    feature: "reminders",
  },
  {
    to: "/integrations",
    label: "Integrations",
    icon: "integrations",
    feature: "integrations",
  },
];

export default function Navbar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.name || user?.username || user?.email;

  async function handleLogout() {
    await logout().catch(() => {});
    navigate("/login");
  }

  return (
    <aside
      className="
        z-40 flex h-dvh min-h-0 flex-col
        overflow-visible
        border-r border-white/[0.06]
        bg-[#082F26] px-3 py-4 text-white
        md:sticky md:top-0
        transition-all duration-300 ease-in-out
      "
    >
      {/* LOGO - CLICK TO EXPAND / COLLAPSE */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        className={`
          group relative flex h-11 shrink-0 items-center
          rounded-xl transition-all duration-200
          hover:bg-white/[0.04]
          cursor-pointer
          ${collapsed ? "justify-center" : "gap-2 px-1"}
        `}
      >
        <span
          className="
            grid size-10 shrink-0 place-items-center
            rounded-xl bg-[#B9F56A]
            text-xl font-extrabold text-[#082F26]
            shadow-[0_3px_12px_rgba(185,245,106,0.12)]
          "
        >
          ₹
        </span>

        {!collapsed && (
          <span className="cursor-default select-none whitespace-nowrap text-lg font-bold tracking-tight">
            SplitTab
          </span>
        )}

        {/* LOGO TOOLTIP */}
      </button>

      {/* NAVIGATION */}
      <nav
        className={`
          mt-4 flex min-h-0 flex-1 flex-col gap-1
          overflow-visible
          ${collapsed ? "items-center" : ""}
        `}
      >
        {LINKS.map((link) => {
          const ready = !link.feature || isFeatureReady(link.feature);

          return (
            <NavLink
              key={link.to}
              to={link.to}
              aria-label={collapsed ? link.label : undefined}
              className={({ isActive }) => `
                group relative flex h-10 shrink-0 items-center
                rounded-lg px-3
                transition-all duration-200
                cursor-pointer
                ${collapsed ? "w-10 justify-center px-0" : "w-full gap-3"}
                ${
                  isActive
                    ? "bg-[#174B39] text-[#C5F58A] shadow-[inset_3px_0_0_#B9F56A]"
                    : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                }
              `}
            >
              {/* SIMPLE ICON - NO SEPARATE GLASS CARD */}
              <span className="grid size-6 shrink-0 place-items-center">
                <Icon name={link.icon} />
              </span>

              {/* LABEL */}
              {!collapsed && (
                <span className="flex min-w-0 flex-1 items-center justify-between whitespace-nowrap text-sm font-semibold">
                  {link.label}

                  {link.feature && !ready && <ComingSoonBadge tone="dark" />}
                </span>
              )}

              {/* COMING SOON INDICATOR */}
              {collapsed && link.feature && !ready && (
                <span className="absolute right-0.5 top-0.5 size-2 rounded-full bg-[#C5F58A] ring-2 ring-[#082F26]" />
              )}

              {/* CUSTOM TOOLTIP */}
              {collapsed && (
                <span
                  className="
                    pointer-events-none absolute left-full top-1/2 z-[100]
                    ml-3 -translate-y-1/2 translate-x-1
                    whitespace-nowrap rounded-lg
                    border border-white/10
                    bg-[#104737]/95 px-3 py-2
                    text-xs font-semibold text-white
                    opacity-0 shadow-xl backdrop-blur-xl
                    transition-all duration-200
                    group-hover:translate-x-0 group-hover:opacity-100
                  "
                >
                  {link.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* PROFILE AND LOGOUT */}
      <div className="mt-auto shrink-0 border-t border-white/10 pt-3">
        <div
          className={`flex items-center ${
            collapsed ? "flex-col gap-2" : "gap-2"
          }`}
        >
          {/* PROFILE */}
          <NavLink
            to="/profile"
            aria-label={collapsed ? "View profile" : undefined}
            className={({ isActive }) => `
              group relative flex min-w-0 items-center
              rounded-lg transition-all duration-200
              cursor-pointer
              ${collapsed ? "size-10 justify-center" : "flex-1 gap-3 p-2"}
              ${isActive ? "bg-[#174B39]" : "hover:bg-white/[0.06]"}
            `}
          >
            <Avatar name={displayName} id={user?.id} />

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {displayName}
                </p>

                <p className="text-xs text-white/50">View profile</p>
              </div>
            )}

            {collapsed && (
              <span
                className="
                  pointer-events-none absolute left-full top-1/2 z-[100]
                  ml-3 -translate-y-1/2 translate-x-1
                  whitespace-nowrap rounded-lg
                  border border-white/10 bg-[#104737]/95
                  px-3 py-2 text-xs font-semibold text-white
                  opacity-0 shadow-xl backdrop-blur-xl
                  transition-all duration-200
                  group-hover:translate-x-0 group-hover:opacity-100
                "
              >
                View profile
              </span>
            )}
          </NavLink>

          {/* LOGOUT */}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="
              group relative grid size-10 shrink-0
              place-items-center rounded-lg
              text-white/60
              transition-all duration-200
              hover:bg-red-400/10 hover:text-red-300
              cursor-pointer
            "
          >
            <Icon name="logout" />

            {collapsed && (
              <span
                className="
                  pointer-events-none absolute left-full top-1/2 z-[100]
                  ml-3 -translate-y-1/2 translate-x-1
                  whitespace-nowrap rounded-lg
                  border border-white/10 bg-[#104737]/95
                  px-3 py-2 text-xs font-semibold text-white
                  opacity-0 shadow-xl backdrop-blur-xl
                  transition-all duration-200
                  group-hover:translate-x-0 group-hover:opacity-100
                "
              >
                Log out
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
