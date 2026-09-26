import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoadingGrid } from "../components/ui/LoadingGrid";
import { useAuth } from "./AuthProvider";

export function AdminRoute() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <LoadingGrid count={2} />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
