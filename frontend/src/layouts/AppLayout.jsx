import { Outlet } from "react-router-dom";

import Navbar from "../shared/components/Navbar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-canvas text-ink md:grid md:grid-cols-[220px_1fr]">
      <Navbar />

      <main className="min-w-0 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
