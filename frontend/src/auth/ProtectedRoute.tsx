import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoadingGrid } from "../components/ui/LoadingGrid";
import { useAuth } from "./AuthProvider";

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <LoadingGrid count={2} />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
