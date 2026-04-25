import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { libraryApi } from "../../api/libraryApi";
import Panel from "../../components/common/Panel";
import DataTable from "../../components/common/DataTable";
import FormField from "../../components/common/FormField";
import StatusBadge from "../../components/common/StatusBadge";
import { formatDateTime } from "../../utils/format";
import { useSocketApp } from "../../hooks/useSocketApp";

const ActivityLogsPage = () => {
  const [searchParams] = useSearchParams();
  const severityParam = searchParams.get("severity") || "";
  const [filters, setFilters] = useState({ search: "", severity: "", module: "" });
  const [logs, setLogs] = useState([]);
  const { liveActivities } = useSocketApp();

  useEffect(() => {
    if (!severityParam) return;
    setFilters((current) => ({ ...current, severity: severityParam }));
  }, [severityParam]);

  const loadLogs = () => {
    libraryApi.activityLogs.list(filters).then(({ data }) => setLogs(data));
  };

  useEffect(() => {
    loadLogs();
  }, [filters.search, filters.severity, filters.module]);

  useEffect(() => {
    if (liveActivities.length) {
      setLogs((current) => [liveActivities[0], ...current].slice(0, 200));
    }
  }, [liveActivities]);

  const onChange = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  return (
    <div className="space-y-6">
      <Panel title="Audit & activity logs" subtitle="Search events, monitor suspicious actions, and review access patterns">
        <div className="grid gap-4 md:grid-cols-4">
          <FormField label="Search" name="search" value={filters.search} onChange={onChange} />
          <label className="block">
            <span className="label-text">Severity</span>
            <select name="severity" value={filters.severity} onChange={onChange} className="input-field">
              <option value="">All</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>
          <FormField label="Module" name="module" value={filters.module} onChange={onChange} />
          <div className="flex items-end">
            <button type="button" className="btn-primary w-full" onClick={loadLogs}>
              Apply filters
            </button>
          </div>
        </div>
      </Panel>

      <Panel title="Log stream" subtitle="Latest 200 matching events">
        <DataTable
          rows={logs}
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
            { key: "module", label: "Module" },
            { key: "action", label: "Action" },
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

export default ActivityLogsPage;

