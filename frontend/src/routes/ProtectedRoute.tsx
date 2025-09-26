import { Navigate, Outlet, useLocation } from "react-router-dom";

import { LoadingOverlay } from "../components/LoadingOverlay";
import { useAuth } from "../hooks";

interface ProtectedRouteProps {
  requiredRoles?: string[];
}

export function ProtectedRoute({ requiredRoles }: ProtectedRouteProps): JSX.Element {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingOverlay fullScreen message="세션을 확인하는 중입니다" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiredRoles && user) {
    const hasAccess = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasAccess) {
      return <Navigate to="/forbidden" replace state={{ from: location }} />;
    }
  }

  return <Outlet />;
}
