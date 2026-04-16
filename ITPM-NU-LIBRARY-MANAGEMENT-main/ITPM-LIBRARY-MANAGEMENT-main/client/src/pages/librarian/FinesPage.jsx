import { useEffect, useState } from "react";
import { libraryApi } from "../../api/libraryApi";
import BookCoverCell from "../../components/books/BookCoverCell";
import Panel from "../../components/common/Panel";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/format";

const FinesPage = () => {
  const [fines, setFines] = useState([]);

  const loadFines = () => {
    libraryApi.fines.list().then(({ data }) => setFines(data));
  };

  useEffect(() => {
    loadFines();
  }, []);

  const updateStatus = async (id, status) => {
    await libraryApi.fines.update(id, { status });
    loadFines();
  };

  return (
    <Panel title="Fine management" subtitle="Track unpaid, paid, and waived penalties">
      <DataTable
        rows={fines}
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
                <button type="button" className="btn-secondary px-3 py-2" onClick={() => updateStatus(row._id, "Paid")}>
                  Mark paid
                </button>
                <button type="button" className="btn-secondary px-3 py-2" onClick={() => updateStatus(row._id, "Waived")}>
                  Waive
                </button>
              </div>
            ),
          },
        ]}
      />
    </Panel>
  );
};

export default FinesPage;

