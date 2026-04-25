import { useEffect, useState } from "react";
import { libraryApi } from "../../api/libraryApi";
import BookCoverCell from "../../components/books/BookCoverCell";
import Panel from "../../components/common/Panel";
import DataTable from "../../components/common/DataTable";
import FormField from "../../components/common/FormField";
import StatusBadge from "../../components/common/StatusBadge";
import QrScannerPanel from "../../components/qr/QrScannerPanel";
import { formatDate } from "../../utils/format";

const BorrowDeskPage = () => {
  const [statusFilter, setStatusFilter] = useState("All");
  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [issueForm, setIssueForm] = useState({ userId: "", bookId: "" });
  const [returnForm, setReturnForm] = useState({ borrowId: "", qrToken: "" });
  const [message, setMessage] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedProfile, setScannedProfile] = useState(null);

  const loadAll = () => {
    Promise.all([
      libraryApi.users.list({ role: "Student" }),
      libraryApi.books.list(),
      libraryApi.borrows.list(),
    ]).then(([usersRes, booksRes, borrowsRes]) => {
      setStudents(usersRes.data.filter((user) => user.role === "Student"));
      setBooks(booksRes.data);
      setBorrows(borrowsRes.data);
    });
  };

  useEffect(() => {
    loadAll();
  }, []);

  const issueBook = async (event) => {
    event.preventDefault();
    const { data } = await libraryApi.borrows.issue(issueForm);
    setMessage(`Issued "${data.book.title}" to ${data.user.name}.`);
    setIssueForm({ userId: "", bookId: "" });
    loadAll();
  };

  const returnBook = async (event) => {
    event.preventDefault();
    const payload = returnForm.borrowId ? { borrowId: returnForm.borrowId } : { qrToken: returnForm.qrToken };
    const { data } = await libraryApi.borrows.returnBook(payload);
    setMessage(
      data.fine
        ? `Return processed. Fine added: Rs. ${data.fine.amount}.`
        : "Return processed successfully."
    );
    setReturnForm({ borrowId: "", qrToken: "" });
    loadAll();
  };

  const filteredBorrows = statusFilter === "All"
    ? borrows
    : borrows.filter((borrow) => borrow.status === statusFilter);

  return (
    <div className="space-y-6">
      {message ? <div className="panel-card text-sm text-emerald-700">{message}</div> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Issue book" subtitle="Assign an available title to a student">
          <form className="space-y-4" onSubmit={issueBook}>
            <label className="block">
              <span className="label-text">Student</span>
              <select
                className="input-field"
                value={issueForm.userId}
                onChange={(event) => setIssueForm((current) => ({ ...current, userId: event.target.value }))}
                required
              >
                <option value="">Select student</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name} ({student.status})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label-text">Book</span>
              <select
                className="input-field"
                value={issueForm.bookId}
                onChange={(event) => setIssueForm((current) => ({ ...current, bookId: event.target.value }))}
                required
              >
                <option value="">Select book</option>
                {books
                  .filter((book) => book.availableCopies > 0)
                  .map((book) => (
                    <option key={book._id} value={book._id}>
                      {book.title} ({book.availableCopies} available)
                    </option>
                  ))}
              </select>
            </label>
            <button type="submit" className="btn-primary">
              Issue now
            </button>
          </form>
        </Panel>

        <Panel
          title="Return book"
          subtitle="Process manual or QR-based returns"
          action={
            <button type="button" className="btn-secondary" onClick={() => setScannerOpen((current) => !current)}>
              {scannerOpen ? "Hide scanner" : "Open scanner"}
            </button>
          }
        >
          <form className="space-y-4" onSubmit={returnBook}>
            <FormField
              label="Borrow ID"
              name="borrowId"
              value={returnForm.borrowId}
              onChange={(event) => setReturnForm((current) => ({ ...current, borrowId: event.target.value }))}
            />
            <FormField
              label="QR token"
              name="qrToken"
              value={returnForm.qrToken}
              onChange={(event) => setReturnForm((current) => ({ ...current, qrToken: event.target.value }))}
            />
            <button type="submit" className="btn-primary">
              Complete return
            </button>
          </form>
          <div className="mt-4">
            <QrScannerPanel
              enabled={scannerOpen}
              onScan={(value) => {
                try {
                  const parsed = JSON.parse(value);
                  if (parsed?.type === "student_profile") {
                    setScannedProfile(parsed);
                    const matched = students.find(
                      (student) =>
                        student.membershipCode === parsed.membershipCode ||
                        student.studentId === parsed.studentId ||
                        student.email === parsed.email
                    );
                    if (matched?._id) {
                      setIssueForm((current) => ({ ...current, userId: matched._id }));
                    }
                    setReturnForm((current) => ({ ...current, qrToken: "" }));
                  } else {
                    setScannedProfile(null);
                    setReturnForm({ borrowId: "", qrToken: value });
                  }
                } catch {
                  setScannedProfile(null);
                  setReturnForm({ borrowId: "", qrToken: value });
                }
                setScannerOpen(false);
              }}
            />
            {scannedProfile ? (
              <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm dark:border-indigo-900/40 dark:bg-indigo-950/20">
                <p className="mb-2 font-semibold text-indigo-700 dark:text-indigo-300">Scanned student profile</p>
                <div className="grid gap-1 text-slate-700 dark:text-slate-200">
                  <p>Name: {scannedProfile.name || "N/A"}</p>
                  <p>Email: {scannedProfile.email || "N/A"}</p>
                  <p>Membership ID: {scannedProfile.membershipCode || "N/A"}</p>
                  <p>Student ID: {scannedProfile.studentId || "N/A"}</p>
                  <p>Phone: {scannedProfile.phone || "N/A"}</p>
                  <p>Address: {scannedProfile.address || "N/A"}</p>
                  <p>Role: {scannedProfile.role || "N/A"}</p>
                  <p>Status: {scannedProfile.status || "N/A"}</p>
                </div>
              </div>
            ) : null}
          </div>
        </Panel>
      </div>

      <Panel
        title="Recent borrow transactions"
        subtitle="Track active, returned, and overdue records"
        action={(
          <select
            className="input-field min-w-40"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Overdue">Overdue</option>
            <option value="Returned">Returned</option>
          </select>
        )}
      >
        <DataTable
          rows={filteredBorrows}
          columns={[
            {
              key: "user",
              label: "Student",
              render: (row) => row.user?.name,
            },
            {
              key: "book",
              label: "Book",
              render: (row) => <BookCoverCell book={row.book} />,
            },
            {
              key: "dueDate",
              label: "Due date",
              render: (row) => formatDate(row.dueDate),
            },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusBadge value={row.status} />,
            },
            { key: "qrToken", label: "QR Token" },
          ]}
        />
      </Panel>
    </div>
  );
};

export default BorrowDeskPage;

