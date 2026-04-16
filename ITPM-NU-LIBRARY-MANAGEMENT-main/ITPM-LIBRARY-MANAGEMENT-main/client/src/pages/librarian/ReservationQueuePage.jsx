import { useEffect, useState } from "react";
import { libraryApi } from "../../api/libraryApi";
import BookCoverCell from "../../components/books/BookCoverCell";
import Panel from "../../components/common/Panel";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import { formatDate } from "../../utils/format";

const ReservationQueuePage = () => {
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    libraryApi.reservations.list().then(({ data }) => setReservations(data));
  }, []);

  return (
    <Panel title="Waiting queue" subtitle="Track student reservations and current queue order">
      <DataTable
        rows={reservations}
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

