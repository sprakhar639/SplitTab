import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

// Login and Register are only for logged-out visitors.
export default function AuthLayout() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
