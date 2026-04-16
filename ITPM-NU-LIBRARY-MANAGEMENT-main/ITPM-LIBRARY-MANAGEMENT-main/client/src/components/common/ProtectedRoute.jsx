import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const roleHome = {
  Admin: "/dashboard/admin",
  Librarian: "/dashboard/librarian",
  Student: "/dashboard/student",
};

const ProtectedRoute = ({ roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="app-shell text-sm text-slate-500">Loading workspace...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={roleHome[user.role] || "/unauthorized"} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

