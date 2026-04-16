import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import Topbar from "../components/common/Topbar";

const DashboardLayout = () => (
  <div className="app-shell">
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Sidebar />
      <main>
        <Topbar />
        <Outlet />
      </main>
    </div>
  </div>
);

export default DashboardLayout;

