import { useState } from "react";
import { Outlet } from "react-router-dom";

import Navbar from "../shared/components/Navbar";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div
      className={`
        min-h-screen bg-canvas text-ink
        md:grid
        transition-[grid-template-columns] duration-300 ease-in-out
        ${
          collapsed
            ? "md:grid-cols-[76px_minmax(0,1fr)]"
            : "md:grid-cols-[230px_minmax(0,1fr)]"
        }
      `}
    >
      <Navbar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
      />

      <main className="min-w-0 px-4 py-5 md:px-6 md:py-6 lg:px-8">
        <div className="mx-auto max-w-none">
          <Outlet />
        </div>
      </main>
    </div>
  );
}