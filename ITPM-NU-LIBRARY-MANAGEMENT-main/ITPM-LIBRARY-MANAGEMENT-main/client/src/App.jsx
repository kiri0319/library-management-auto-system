import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import ProtectedRoute from "./components/common/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import AuthLayout from "./layouts/AuthLayout";
import LandingPage from "./pages/public/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import UnauthorizedPage from "./pages/public/UnauthorizedPage";
import NotFoundPage from "./pages/public/NotFoundPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagementPage from "./pages/admin/UserManagementPage";
import ActivityLogsPage from "./pages/admin/ActivityLogsPage";
import ReportsPage from "./pages/admin/ReportsPage";
import SettingsPage from "./pages/admin/SettingsPage";
import LibrarianDashboard from "./pages/librarian/LibrarianDashboard";
import BooksPage from "./pages/librarian/BooksPage";
import BorrowDeskPage from "./pages/librarian/BorrowDeskPage";
import ReservationQueuePage from "./pages/librarian/ReservationQueuePage";
import FinesPage from "./pages/librarian/FinesPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import CatalogPage from "./pages/student/CatalogPage";
import MyBorrowsPage from "./pages/student/MyBorrowsPage";
import MyReservationsPage from "./pages/student/MyReservationsPage";
import ProfilePage from "./pages/student/ProfilePage";

const HomeRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="app-shell text-sm text-slate-500">Loading workspace...</div>;
  }

  if (!user) {
    return <LandingPage />;
  }

  if (user.role === "Admin") {
    return <Navigate to="/dashboard/admin" replace />;
  }

  if (user.role === "Librarian") {
    return <Navigate to="/dashboard/librarian" replace />;
  }

  return <Navigate to="/dashboard/student" replace />;
};

const App = () => (
  <Routes>
    <Route path="/" element={<HomeRedirect />} />
    <Route element={<AuthLayout />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/admin" element={<LoginPage roleHint="Admin" />} />
      <Route path="/login/librarian" element={<LoginPage roleHint="Librarian" />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
    </Route>
    <Route path="/unauthorized" element={<UnauthorizedPage />} />

    <Route element={<ProtectedRoute roles={["Admin"]} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/dashboard/admin/users" element={<UserManagementPage />} />
        <Route path="/dashboard/admin/activity" element={<ActivityLogsPage />} />
        <Route path="/dashboard/admin/reports" element={<ReportsPage />} />
        <Route path="/dashboard/admin/settings" element={<SettingsPage />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute roles={["Admin", "Librarian"]} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard/librarian" element={<LibrarianDashboard />} />
        <Route path="/dashboard/librarian/books" element={<BooksPage />} />
        <Route path="/dashboard/librarian/borrows" element={<BorrowDeskPage />} />
        <Route path="/dashboard/librarian/reservations" element={<ReservationQueuePage />} />
        <Route path="/dashboard/librarian/fines" element={<FinesPage />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute roles={["Student"]} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard/student" element={<StudentDashboard />} />
        <Route path="/dashboard/student/catalog" element={<CatalogPage />} />
        <Route path="/dashboard/student/borrows" element={<MyBorrowsPage />} />
        <Route path="/dashboard/student/reservations" element={<MyReservationsPage />} />
        <Route path="/dashboard/student/profile" element={<ProfilePage />} />
      </Route>
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default App;
