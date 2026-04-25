import { useEffect, useState } from "react";
import { libraryApi } from "../../api/libraryApi";
import BookCoverCell from "../../components/books/BookCoverCell";
import Panel from "../../components/common/Panel";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/format";

const FinesPage = () => {
  const [fines, setFines] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [actionMessage, setActionMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedFine, setSelectedFine] = useState(null);

  const loadFines = async () => {
    setErrorMessage("");
    const [finesRes] = await Promise.allSettled([libraryApi.fines.list()]);

    if (finesRes.status === "fulfilled") {
      setFines(finesRes.value.data || []);
    } else {
      setFines([]);
      setErrorMessage("Could not load fine records right now.");
    }
  };

  useEffect(() => {
    loadFines();
  }, []);

  const updateStatus = async (id, status) => {
    await libraryApi.fines.update(id, { status });
    setActionMessage("Payment completed");
    loadFines();
  };

  const statusOptions = [...new Set(fines.map((fine) => fine.status).filter(Boolean))];
  const filteredFines = statusFilter === "All"
    ? fines
    : fines.filter((fine) => fine.status === statusFilter);

  return (
    <div className="space-y-6">
      <Panel
        title="Fine management"
        subtitle="Track unpaid and paid penalties"
        action={(
          <select
            className="input-field min-w-40"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        )}
      >
        {actionMessage ? <p className="mb-3 text-sm font-medium text-emerald-700">{actionMessage}</p> : null}
        {errorMessage ? <p className="mb-3 text-sm font-medium text-rose-700">{errorMessage}</p> : null}
        <DataTable
          rows={filteredFines}
          columns={[
          {
            key: "user",
            label: "Student",
            render: (row) => row.user?.name,
          },
          {
            key: "borrow",
            label: "Book",
            render: (row) => <BookCoverCell book={row.borrow?.book} />,
          },
          {
            key: "amount",
            label: "Amount",
            render: (row) => formatCurrency(row.amount),
          },
          {
            key: "calculation",
            label: "Calculation",
            render: (row) => (
              <div className="text-xs text-slate-600">
                <div>{row.overdueDays} day(s) overdue</div>
                <div>
                  {formatCurrency(row.dailyRate)}/day
                  {row.calculatedAmount > 0 ? ` = ${formatCurrency(row.calculatedAmount)}` : ""}
                </div>
              </div>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (row) => <StatusBadge value={row.status} />,
          },
          {
            key: "createdAt",
            label: "Issued",
            render: (row) => formatDate(row.createdAt),
          },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary px-3 py-2"
                  onClick={() => setSelectedFine(row)}
                >
                  View
                </button>
                <button
                  type="button"
                  className="btn-secondary px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={row.status !== "Unpaid"}
                  onClick={() => updateStatus(row._id, "Paid")}
                >
                  Mark paid
                </button>
              </div>
            ),
          },
          ]}
        />
        {selectedFine ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Fine details</h3>
              <button type="button" className="btn-secondary px-3 py-1.5" onClick={() => setSelectedFine(null)}>
                Close
              </button>
            </div>
            <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <p><span className="font-medium">Student:</span> {selectedFine.user?.name || "-"}</p>
              <p><span className="font-medium">Book:</span> {selectedFine.borrow?.book?.title || "-"}</p>
              <p><span className="font-medium">Issued date:</span> {formatDate(selectedFine.borrow?.borrowDate)}</p>
              <p><span className="font-medium">Due date:</span> {formatDate(selectedFine.borrow?.dueDate)}</p>
              <p><span className="font-medium">Returned date:</span> {selectedFine.borrow?.returnedAt ? formatDate(selectedFine.borrow.returnedAt) : "Not returned yet"}</p>
              <p><span className="font-medium">Overdue days:</span> {selectedFine.overdueDays}</p>
              <p><span className="font-medium">Per-day fine:</span> {formatCurrency(selectedFine.dailyRate)}</p>
              <p><span className="font-medium">Calculated total:</span> {formatCurrency(selectedFine.calculatedAmount)}</p>
              <p><span className="font-medium">Recorded amount:</span> {formatCurrency(selectedFine.amount)}</p>
              <p><span className="font-medium">Status:</span> {selectedFine.status}</p>
            </div>
          </div>
        ) : null}
      </Panel>
    </div>
  );
};

export default FinesPage;

