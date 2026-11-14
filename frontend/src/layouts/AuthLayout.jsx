import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import Loader from "../shared/components/Loader";

// Login and Register are only for logged-out visitors.
export default function AuthLayout() {
  const { user } = useAuth();

  if (user === undefined) return <Loader label="Checking your session…" />;

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
