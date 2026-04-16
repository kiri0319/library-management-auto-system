import { useEffect, useState } from "react";
import { AlertTriangle, BookOpen, Coins, Users } from "lucide-react";
import { libraryApi } from "../../api/libraryApi";
import StatCard from "../../components/common/StatCard";
import LoadingState from "../../components/common/LoadingState";
import LineChartCard from "../../components/charts/LineChartCard";
import BarChartCard from "../../components/charts/BarChartCard";
import DoughnutChartCard from "../../components/charts/DoughnutChartCard";
import Panel from "../../components/common/Panel";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import { formatCurrency, formatDateTime } from "../../utils/format";

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    libraryApi.dashboard
      .admin()
      .then(({ data }) => setDashboard(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingState text="Loading admin analytics..." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={dashboard.stats.userCount} hint="All system accounts" icon={Users} tone="blue" />
        <StatCard
          label="Active Borrows"
          value={dashboard.stats.activeBorrows}
          hint="Books currently checked out"
          icon={BookOpen}
          tone="green"
        />
        <StatCard
          label="Unpaid Fines"
          value={formatCurrency(dashboard.stats.unpaidFineTotal)}
          hint="Outstanding collection total"
          icon={Coins}
          tone="orange"
        />
        <StatCard
          label="Suspicious Actions"
          value={dashboard.stats.suspiciousActions}
          hint="High-severity audit events"
          icon={AlertTriangle}
          tone="rose"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <LineChartCard
          title="Borrowing trend"
          subtitle="Monthly borrowing volume"
          labels={dashboard.charts.monthlyBorrowing.map((item) => item._id)}
          values={dashboard.charts.monthlyBorrowing.map((item) => item.count)}
        />
        <BarChartCard
          title="Category popularity"
          subtitle="Most borrowed categories"
          labels={dashboard.charts.categoryPopularity.map((item) => item._id)}
          values={dashboard.charts.categoryPopularity.map((item) => item.count)}
        />
        <DoughnutChartCard
          title="Role mix"
          subtitle="User distribution by role"
          labels={dashboard.charts.roleDistribution.map((item) => item._id)}
          values={dashboard.charts.roleDistribution.map((item) => item.count)}
        />
      </div>

      <Panel title="Recent audit trail" subtitle="Latest activity and system signals">
        <DataTable
          rows={dashboard.recentLogs}
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

