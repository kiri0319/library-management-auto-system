import { useEffect, useState } from "react";
import { libraryApi } from "../../api/libraryApi";
import BookCoverCell from "../../components/books/BookCoverCell";
import Panel from "../../components/common/Panel";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/format";

const MyBorrowsPage = () => {
  const [borrows, setBorrows] = useState([]);
  const [fines, setFines] = useState([]);

  useEffect(() => {
    Promise.all([libraryApi.borrows.list(), libraryApi.fines.list()]).then(([borrowsRes, finesRes]) => {
      setBorrows(borrowsRes.data);
      setFines(finesRes.data);
    });
  }, []);

  const totalUnpaid = fines
    .filter((fine) => fine.status === "Unpaid")
    .reduce((sum, fine) => sum + fine.amount, 0);

  return (
    <div className="space-y-6">
      <div className="panel-card text-sm text-slate-600">Outstanding fines: {formatCurrency(totalUnpaid)}</div>
      <Panel title="My borrowed books" subtitle="Current and past circulation records with QR tokens">
        <DataTable
          rows={borrows}
          columns={[
            {
              key: "book",
              label: "Book",
              render: (row) => <BookCoverCell book={row.book} />,
            },
            {
              key: "borrowDate",
              label: "Borrowed",
              render: (row) => formatDate(row.borrowDate),
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
            {
              key: "fineAccrued",
              label: "Fine",
              render: (row) => formatCurrency(row.fineAccrued),
            },
            { key: "qrToken", label: "Return QR token" },
          ]}
        />
      </Panel>
    </div>
  );
};

export default MyBorrowsPage;

