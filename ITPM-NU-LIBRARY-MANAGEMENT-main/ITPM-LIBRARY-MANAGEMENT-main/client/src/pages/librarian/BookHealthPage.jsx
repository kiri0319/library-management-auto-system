import { useEffect, useMemo, useState } from "react";
import { libraryApi } from "../../api/libraryApi";
import Panel from "../../components/common/Panel";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import { formatDateTime } from "../../utils/format";

const healthStatuses = ["Good", "Damaged", "Old"];

const emptyForm = {
  bookId: "",
  status: "Good",
  remarks: "",
};

const BookHealthPage = () => {
  const [books, setBooks] = useState([]);
  const [healthRows, setHealthRows] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedHealth, setSelectedHealth] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = async () => {
    setErrorMessage("");
    const [booksRes, healthRes, alertRes] = await Promise.allSettled([
      libraryApi.books.list(),
      libraryApi.bookHealth.list(),
      libraryApi.bookHealth.alerts(),
    ]);

    if (booksRes.status === "fulfilled") {
      setBooks(booksRes.value.data || []);
    }
    if (healthRes.status === "fulfilled") {
      setHealthRows(healthRes.value.data || []);
    } else {
      setHealthRows([]);
      setErrorMessage("Could not load book health records right now.");
    }
    if (alertRes.status === "fulfilled") {
      setAlerts(alertRes.value.data || []);
    } else {
      setAlerts([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRows = useMemo(() => {
    if (statusFilter === "All") {
      return healthRows;
    }
    return healthRows.filter((item) => item.status === statusFilter);
  }, [healthRows, statusFilter]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await libraryApi.bookHealth.update(form.bookId, {
      status: form.status,
      remarks: form.remarks,
    });
    setMessage("Book condition updated.");
    setForm(emptyForm);
    loadData();
  };

  return (
    <div className="space-y-6">
      <Panel title="Book health alerts" subtitle="Books needing repair or replacement">
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-600">No alerts right now. All books are in good condition.</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert._id} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-800">
                  {alert.book?.title || "Unknown book"} - {alert.status}
                </p>
                <p className="text-xs text-slate-600">
                  Suggestion: {alert.suggestion} | Updated: {formatDateTime(alert.updatedAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Update book condition" subtitle="Manually update health status with remarks">
        {message ? <p className="mb-3 text-sm font-medium text-emerald-700">{message}</p> : null}
        {errorMessage ? <p className="mb-3 text-sm font-medium text-rose-700">{errorMessage}</p> : null}
        <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
          <label className="block md:col-span-1">
            <span className="label-text">Book</span>
            <select
              className="input-field"
              value={form.bookId}
              onChange={(event) => setForm((current) => ({ ...current, bookId: event.target.value }))}
              required
            >
              <option value="">Select book</option>
              {books.map((book) => (
                <option key={book._id} value={book._id}>
                  {book.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label-text">Status</span>
            <select
              className="input-field"
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              required
            >
              {healthStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-3">
            <span className="label-text">Remarks</span>
            <textarea
              className="input-field"
              rows={3}
              value={form.remarks}
              onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))}
              placeholder="Example: Torn pages near spine."
            />
          </label>
          <div className="md:col-span-3">
            <button type="submit" className="btn-primary">
              Save condition
            </button>
          </div>
        </form>
      </Panel>

      <Panel
        title="Book health dashboard"
        subtitle="Track current condition, suggestions, and condition history"
        action={(
          <select
            className="input-field min-w-40"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All statuses</option>
            {healthStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        )}
      >
        <DataTable
          rows={filteredRows}
          columns={[
            { key: "book", label: "Book", render: (row) => row.book?.title || "-" },
            { key: "author", label: "Author", render: (row) => row.book?.author?.name || "-" },
            { key: "status", label: "Health", render: (row) => <StatusBadge value={row.status} /> },
            {
              key: "suggestion",
              label: "Action",
              render: (row) => <StatusBadge value={row.suggestion} />,
            },
            {
              key: "updatedAt",
              label: "Last updated",
              render: (row) => formatDateTime(row.updatedAt),
            },
            {
              key: "remarks",
              label: "Latest remarks",
              render: (row) => row.history?.[row.history.length - 1]?.remarks || "-",
            },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <button
                  type="button"
                  className="btn-secondary px-3 py-2"
                  onClick={() => setSelectedHealth(row)}
                >
                  History
                </button>
              ),
            },
          ]}
        />
        {selectedHealth ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                Condition history - {selectedHealth.book?.title || "Book"}
              </h3>
              <button type="button" className="btn-secondary px-3 py-1.5" onClick={() => setSelectedHealth(null)}>
                Close
              </button>
            </div>
            <div className="space-y-2 text-sm text-slate-700">
              {(selectedHealth.history || []).length === 0 ? (
                <p className="text-xs text-slate-500">No manual updates yet.</p>
              ) : (
                selectedHealth.history
                  .slice()
                  .reverse()
                  .map((entry, index) => (
                    <div key={`${entry.updatedAt || "entry"}-${index}`} className="rounded-lg border border-slate-100 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <StatusBadge value={entry.status} />
                        <span className="text-xs text-slate-500">{formatDateTime(entry.updatedAt)}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{entry.remarks || "No remarks."}</p>
                    </div>
                  ))
              )}
            </div>
          </div>
        ) : null}
      </Panel>
    </div>
  );
};

export default BookHealthPage;
