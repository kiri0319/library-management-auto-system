import { useEffect, useState } from "react";
import { BookCopy, ClockAlert, HandCoins, LibraryBig } from "lucide-react";
import { libraryApi } from "../../api/libraryApi";
import StatCard from "../../components/common/StatCard";
import LoadingState from "../../components/common/LoadingState";
import LineChartCard from "../../components/charts/LineChartCard";
import BarChartCard from "../../components/charts/BarChartCard";
import Panel from "../../components/common/Panel";
import DataTable from "../../components/common/DataTable";
import { formatCurrency } from "../../utils/format";

const LibrarianDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    libraryApi.dashboard
      .librarian()
      .then(({ data }) => setDashboard(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingState text="Loading librarian dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Books" value={dashboard.stats.bookCount} hint="Total catalog items" icon={LibraryBig} tone="blue" />
        <StatCard
          label="Available Copies"
          value={dashboard.stats.availableCopies}
          hint="Copies currently on shelf"
          icon={BookCopy}
          tone="green"
        />
        <StatCard
          label="Overdue"
          value={dashboard.stats.overdueBorrows}
          hint="Check-ins requiring attention"
          icon={ClockAlert}
          tone="rose"
        />
        <StatCard
          label="Unpaid Fines"
          value={formatCurrency(dashboard.stats.fineCollection.Unpaid || 0)}
          hint="Outstanding borrower dues"
          icon={HandCoins}
          tone="orange"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <LineChartCard
          title="Daily circulation"
          subtitle="Borrow volume across the last seven active days"
          labels={dashboard.charts.dailyBorrowing.map((item) => item._id)}
          values={dashboard.charts.dailyBorrowing.map((item) => item.count)}
        />
        <BarChartCard
          title="Top requested books"
          subtitle="Most borrowed books in the current catalog"
          labels={dashboard.charts.topBooks.map((item) => item.title)}
          values={dashboard.charts.topBooks.map((item) => item.borrowedCount)}
        />
      </div>

      <Panel title="Top books" subtitle="High-demand titles and shelf availability">
        <DataTable
          rows={dashboard.charts.topBooks}
          columns={[
            { key: "title", label: "Title" },
            { key: "borrowedCount", label: "Borrowed" },
            { key: "availableCopies", label: "Available Copies" },
          ]}
        />
      </Panel>
    </div>
  );
};

export default LibrarianDashboard;

