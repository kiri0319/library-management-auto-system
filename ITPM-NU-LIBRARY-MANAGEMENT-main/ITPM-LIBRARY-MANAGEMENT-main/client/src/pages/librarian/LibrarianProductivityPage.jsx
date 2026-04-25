import { useEffect, useState } from "react";
import { libraryApi } from "../../api/libraryApi";
import Panel from "../../components/common/Panel";
import StatCard from "../../components/common/StatCard";
import LineChartCard from "../../components/charts/LineChartCard";

const LibrarianProductivityPage = () => {
  const [range, setRange] = useState("daily");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [activityType, setActivityType] = useState("Task");
  const [taskCount, setTaskCount] = useState(1);
  const [taskName, setTaskName] = useState("");
  const [message, setMessage] = useState("");
  const [activeDetail, setActiveDetail] = useState("books");
  const [stats, setStats] = useState({
    summary: {
      booksHandled: 0,
      tasksCompleted: 0,
      efficiency: 0,
      booksIssued: 0,
      booksReturned: 0,
      workingHours: 0,
    },
    topPerformer: null,
    chart: { labels: [], values: [] },
  });

  const loadStats = () => {
    libraryApi.librarianProductivity
      .stats({ range, date })
      .then(({ data }) => setStats(data));
  };

  useEffect(() => {
    loadStats();
  }, [range, date]);

  const recordActivity = async (event) => {
    event.preventDefault();
    await libraryApi.librarianProductivity.record({
      activityType,
      count: Number(taskCount) || 1,
      taskName: activityType === "Task" ? taskName : "",
    });
    setTaskCount(1);
    setTaskName("");
    setActivityType("Task");
    setMessage("Activity recorded.");
    loadStats();
  };

  return (
    <div className="space-y-6">
      <Panel title="Productivity filters" subtitle="Track daily, weekly, or monthly performance">
        {message ? <p className="mb-3 text-sm font-medium text-emerald-700">{message}</p> : null}
        <div className="grid gap-3 md:grid-cols-3">
          <select className="input-field" value={range} onChange={(event) => setRange(event.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <input type="date" className="input-field" value={date} onChange={(event) => setDate(event.target.value)} />
          <button type="button" className="btn-primary" onClick={loadStats}>
            Refresh stats
          </button>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Books handled"
          value={stats.summary?.booksHandled || 0}
          hint={`Issued: ${stats.summary?.booksIssued || 0}, Returned: ${stats.summary?.booksReturned || 0}`}
          onClick={() => setActiveDetail("books")}
        />
        <StatCard
          label="Tasks completed"
          value={stats.summary?.tasksCompleted || 0}
          hint="Manual librarian tasks logged"
          onClick={() => setActiveDetail("tasks")}
        />
        <StatCard
          label="Efficiency score"
          value={stats.summary?.efficiency || 0}
          hint={`Working hours: ${stats.summary?.workingHours || 0}`}
          onClick={() => setActiveDetail("efficiency")}
        />
      </div>

      <Panel title="Selected stat details" subtitle="Click a stat card to view full breakdown">
        {activeDetail === "books" ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Books handled</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stats.summary?.booksHandled || 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Books issued</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stats.summary?.booksIssued || 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Books returned</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stats.summary?.booksReturned || 0}</p>
            </div>
          </div>
        ) : null}
        {activeDetail === "tasks" ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p><span className="font-medium">Tasks completed:</span> {stats.summary?.tasksCompleted || 0}</p>
            <p>Includes manually logged librarian task activities in the selected time range.</p>
          </div>
        ) : null}
        {activeDetail === "efficiency" ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p><span className="font-medium">Efficiency score:</span> {stats.summary?.efficiency || 0}</p>
            <p><span className="font-medium">Working hours:</span> {stats.summary?.workingHours || 0}</p>
            <p>Efficiency uses completed work compared against working hours for the selected period.</p>
          </div>
        ) : null}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-3">
        <LineChartCard
          title="Daily/weekly productivity"
          subtitle="Books handled + tasks completed"
          labels={stats.chart?.labels || []}
          values={stats.chart?.values || []}
          label="Productivity score"
        />
        <Panel title="Top-performing librarian" subtitle="Best efficiency score in selected range">
          {stats.topPerformer ? (
            <div className="space-y-1 text-sm text-slate-700">
              <p><span className="font-medium">Name:</span> {stats.topPerformer.librarian?.name || "-"}</p>
              <p><span className="font-medium">Books handled:</span> {stats.topPerformer.booksHandled}</p>
              <p><span className="font-medium">Tasks completed:</span> {stats.topPerformer.tasksCompleted}</p>
              <p><span className="font-medium">Efficiency:</span> {stats.topPerformer.efficiency}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No activity data in this period.</p>
          )}
        </Panel>
        <Panel title="Record activity manually" subtitle="Manually log issue, return, or task activities">
          <form className="space-y-3" onSubmit={recordActivity}>
            <select
              className="input-field"
              value={activityType}
              onChange={(event) => setActivityType(event.target.value)}
            >
              <option value="Issue">Books issued</option>
              <option value="Return">Books returned</option>
              <option value="Task">Task completed</option>
            </select>
            {activityType === "Task" ? (
              <input
                className="input-field"
                placeholder="Task name (optional)"
                value={taskName}
                onChange={(event) => setTaskName(event.target.value)}
              />
            ) : null}
            <input
              type="number"
              min={1}
              className="input-field"
              value={taskCount}
              onChange={(event) => setTaskCount(event.target.value)}
            />
            <button type="submit" className="btn-primary w-full">
              Record activity
            </button>
          </form>
        </Panel>
      </div>
    </div>
  );
};

export default LibrarianProductivityPage;
