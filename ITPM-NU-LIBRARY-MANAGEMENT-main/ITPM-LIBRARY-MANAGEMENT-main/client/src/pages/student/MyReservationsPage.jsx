import { useEffect, useState } from "react";
import { libraryApi } from "../../api/libraryApi";
import { useSocketApp } from "../../hooks/useSocketApp";
import BookCoverCell from "../../components/books/BookCoverCell";
import Panel from "../../components/common/Panel";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import { formatDate } from "../../utils/format";

const MyReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [message, setMessage] = useState("");
  const { reservationReady } = useSocketApp();

  const loadReservations = () => {
    libraryApi.reservations.list().then(({ data }) => setReservations(data));
  };

  useEffect(() => {
    loadReservations();
  }, []);

  useEffect(() => {
    if (reservationReady) {
      setMessage("A reserved book is now available for pickup.");
      loadReservations();
    }
  }, [reservationReady]);

  const cancelReservation = async (id) => {
    await libraryApi.reservations.cancel(id);
    loadReservations();
  };

  return (
    <div className="space-y-6">
      {message ? <div className="panel-card text-sm text-emerald-700">{message}</div> : null}
      <Panel title="My reservations" subtitle="Track queue position and pickup windows">
        <DataTable
          rows={reservations}
          columns={[
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
              label: "Pickup by",
              render: (row) => formatDate(row.expiresAt),
            },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <button type="button" className="btn-secondary px-3 py-2" onClick={() => cancelReservation(row._id)}>
                  Cancel
                </button>
              ),
            },
          ]}
        />
      </Panel>
    </div>
  );
};

export default MyReservationsPage;

