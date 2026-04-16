import {
  Activity,
  BookCopy,
  BookOpen,
  ChartColumn,
  FileBarChart,
  HandCoins,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

export const navigationByRole = {
  Admin: [
    { label: "Dashboard", path: "/dashboard/admin", icon: LayoutDashboard },
    { label: "Users", path: "/dashboard/admin/users", icon: Users },
    { label: "Activity Logs", path: "/dashboard/admin/activity", icon: Activity },
    { label: "Reports", path: "/dashboard/admin/reports", icon: FileBarChart },
    { label: "Settings", path: "/dashboard/admin/settings", icon: Settings },
  ],
  Librarian: [
    { label: "Dashboard", path: "/dashboard/librarian", icon: LayoutDashboard },
    { label: "Books", path: "/dashboard/librarian/books", icon: BookCopy },
    { label: "Borrow Desk", path: "/dashboard/librarian/borrows", icon: ShieldCheck },
    { label: "Queue", path: "/dashboard/librarian/reservations", icon: BookOpen },
    { label: "Fines", path: "/dashboard/librarian/fines", icon: HandCoins },
  ],
  Student: [
    { label: "Dashboard", path: "/dashboard/student", icon: LayoutDashboard },
    { label: "Catalog", path: "/dashboard/student/catalog", icon: BookOpen },
    { label: "My Borrows", path: "/dashboard/student/borrows", icon: ChartColumn },
    { label: "Reservations", path: "/dashboard/student/reservations", icon: BookCopy },
    { label: "Profile", path: "/dashboard/student/profile", icon: Users },
  ],
};

