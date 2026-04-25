import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BookOpen, Coins, Users } from "lucide-react";
import { libraryApi } from "../../api/libraryApi";
import StatCard from "../../components/common/StatCard";
import LoadingState from "../../components/common/LoadingState";
import Panel from "../../components/common/Panel";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import { formatCurrency, formatDateTime } from "../../utils/format";

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logFilter, setLogFilter] = useState({ search: "", severity: "All", module: "" });

  useEffect(() => {
    libraryApi.dashboard
      .admin()
      .then(({ data }) => setDashboard(data))
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = useMemo(() => {
    const search = logFilter.search.trim().toLowerCase();
    return (dashboard?.recentLogs || []).filter((row) => {
      const matchesSearch = !search || [row.action, row.description, row.actor?.name]
        .some((value) => String(value || "").toLowerCase().includes(search));
      const matchesSeverity = logFilter.severity === "All" || row.severity === logFilter.severity;
      const matchesModule = !logFilter.module.trim() || String(row.module || "").toLowerCase().includes(logFilter.module.trim().toLowerCase());
      return matchesSearch && matchesSeverity && matchesModule;
    });
  }, [dashboard, logFilter]);

  if (loading || !dashboard) {
    return <LoadingState text="Loading admin analytics..." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Users"
          value={dashboard.stats.userCount}
          hint="All system accounts"
          icon={Users}
          tone="blue"
          to="/dashboard/admin/users"
        />
        <StatCard
          label="Active Borrows"
          value={dashboard.stats.activeBorrows}
          hint="Books currently checked out"
          icon={BookOpen}
          tone="green"
          to="/dashboard/admin/reports?preview=borrowing"
        />
        <StatCard
          label="Unpaid Fines"
          value={formatCurrency(dashboard.stats.unpaidFineTotal)}
          hint="Outstanding collection total"
          icon={Coins}
          tone="orange"
          to="/dashboard/admin/reports?preview=fines"
        />
        <StatCard
          label="Suspicious Actions"
          value={dashboard.stats.suspiciousActions}
          hint="High-severity audit events"
          icon={AlertTriangle}
          tone="rose"
          to="/dashboard/admin/activity?severity=High"
        />
      </div>

      <Panel title="Recent audit trail" subtitle="Latest activity and system signals">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <input
            className="input-field"
            placeholder="Search action or description"
            value={logFilter.search}
            onChange={(event) => setLogFilter((current) => ({ ...current, search: event.target.value }))}
          />
          <select
            className="input-field"
            value={logFilter.severity}
            onChange={(event) => setLogFilter((current) => ({ ...current, severity: event.target.value }))}
          >
            <option value="All">All severities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <input
            className="input-field"
            placeholder="Filter by module"
            value={logFilter.module}
            onChange={(event) => setLogFilter((current) => ({ ...current, module: event.target.value }))}
          />
        </div>
        <DataTable
          rows={filteredLogs}
          columns={[
            {
              key: "createdAt",
              label: "Timestamp",
              render: (row) => formatDateTime(row.createdAt),
            },
            {
              key: "actor",
              label: "Actor",
              render: (row) => row.actor?.name || "System",
            },
            { key: "action", label: "Action" },
            { key: "module", label: "Module" },
            {
              key: "severity",
              label: "Severity",
              render: (row) => <StatusBadge value={row.severity} />,
            },
            { key: "description", label: "Description" },
          ]}
        />
      </Panel>
    </div>
  );
};

export default AdminDashboard;

