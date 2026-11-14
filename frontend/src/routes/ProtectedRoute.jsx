import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import Loader from "../shared/components/Loader";

export default function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (user === undefined) return <Loader label="Checking your session…" />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
