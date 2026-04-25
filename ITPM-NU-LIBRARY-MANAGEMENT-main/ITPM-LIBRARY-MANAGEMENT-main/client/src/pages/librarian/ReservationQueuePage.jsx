import { useEffect, useState } from "react";
import { libraryApi } from "../../api/libraryApi";
import BookCoverCell from "../../components/books/BookCoverCell";
import Panel from "../../components/common/Panel";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import { formatDate } from "../../utils/format";

const ReservationQueuePage = () => {
  const [reservations, setReservations] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    libraryApi.reservations.list().then(({ data }) => setReservations(data));
  }, []);

  const statusOptions = [...new Set(reservations.map((reservation) => reservation.status).filter(Boolean))];
  const filteredReservations = statusFilter === "All"
    ? reservations
    : reservations.filter((reservation) => reservation.status === statusFilter);

  return (
    <Panel
      title="Waiting queue"
      subtitle="Track student reservations and current queue order"
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
      <DataTable
        rows={filteredReservations}
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
          { key: "position", label: "Position" },
          {
            key: "status",
            label: "Status",
            render: (row) => <StatusBadge value={row.status} />,
          },
          {
            key: "expiresAt",
            label: "Pickup deadline",
            render: (row) => formatDate(row.expiresAt),
          },
        ]}
      />
    </Panel>
  );
};

export default ReservationQueuePage;

