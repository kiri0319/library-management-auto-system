import { useEffect, useMemo, useState } from "react";
import { libraryApi } from "../../api/libraryApi";
import Panel from "../../components/common/Panel";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import { formatDateTime } from "../../utils/format";

const SeatBookingPage = () => {
  const [seats, setSeats] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [zone, setZone] = useState("");
  const [seatId, setSeatId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [message, setMessage] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);

  const loadData = () => {
    Promise.all([libraryApi.seats.list(zone ? { zone } : {}), libraryApi.seats.listBookings()]).then(([seatRes, bookingRes]) => {
      setSeats(seatRes.data);
      setBookings(bookingRes.data);
    });
  };

  useEffect(() => {
    loadData();
  }, [zone]);

  const activeSeatOptions = useMemo(() => seats.filter((s) => s.isActive), [seats]);

  const bookSeat = async (event) => {
    event.preventDefault();
    setMessage("");
    await libraryApi.seats.book({ seatId, startTime });
    setMessage("Seat booking created successfully.");
    setSeatId("");
    setStartTime("");
    loadData();
  };

  const cancelBooking = async (id) => {
    await libraryApi.seats.cancelBooking(id);
    setMessage("Seat booking cancelled.");
    loadData();
  };

  return (
    <div className="space-y-6">
      <Panel title="Seat booking" subtitle="Reserve reading seats in silent and group zones (2-hour slots)">
        <form className="grid gap-4 md:grid-cols-4" onSubmit={bookSeat}>
          <label className="block">
            <span className="label-text">Zone</span>
            <select className="input-field" value={zone} onChange={(event) => setZone(event.target.value)}>
              <option value="">All zones</option>
              <option value="Silent Zone">Silent Zone</option>
              <option value="Group Zone">Group Zone</option>
            </select>
          </label>
          <label className="block">
            <span className="label-text">Seat</span>
            <select className="input-field" value={seatId} onChange={(event) => setSeatId(event.target.value)} required>
              <option value="">Select seat</option>
              {activeSeatOptions.map((seat) => (
                <option key={seat._id} value={seat._id}>
                  {seat.code} ({seat.zone})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label-text">Start time</span>
            <input
              type="datetime-local"
              className="input-field"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              required
            />
          </label>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full">
              Reserve seat
            </button>
          </div>
        </form>
        {message ? <p className="mt-3 text-sm font-medium text-emerald-700">{message}</p> : null}
      </Panel>

      <Panel title="My seat bookings" subtitle="Check reservation status, QR token, and cancel active bookings">
        <DataTable
          rows={bookings}
          columns={[
            { key: "seat", label: "Seat", render: (row) => row.seat?.code },
            { key: "zone", label: "Zone", render: (row) => row.seat?.zone },
            { key: "startTime", label: "Start", render: (row) => formatDateTime(row.startTime) },
            { key: "endTime", label: "End", render: (row) => formatDateTime(row.endTime) },
            { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
            { key: "qrToken", label: "QR Token" },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary px-3 py-2" onClick={() => setSelectedBooking(row)}>
                    View
                  </button>
                  <button
                    type="button"
                    className="btn-secondary px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!["Reserved", "CheckedIn"].includes(row.status)}
                    onClick={() => cancelBooking(row._id)}
                  >
                    Cancel
                  </button>
                </div>
              ),
            },
          ]}
        />
        {selectedBooking ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Booking details</h3>
              <button type="button" className="btn-secondary px-3 py-1.5" onClick={() => setSelectedBooking(null)}>
                Close
              </button>
            </div>
            <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <p><span className="font-medium">Seat:</span> {selectedBooking.seat?.code || "-"}</p>
              <p><span className="font-medium">Zone:</span> {selectedBooking.seat?.zone || "-"}</p>
              <p><span className="font-medium">Status:</span> {selectedBooking.status}</p>
              <p><span className="font-medium">Booking start:</span> {formatDateTime(selectedBooking.startTime)}</p>
              <p><span className="font-medium">Booking end:</span> {formatDateTime(selectedBooking.endTime)}</p>
              <p><span className="font-medium">Expired/check-in deadline:</span> {formatDateTime(selectedBooking.checkInDeadline)}</p>
              <p><span className="font-medium">Checked-in at:</span> {formatDateTime(selectedBooking.checkedInAt)}</p>
              <p><span className="font-medium">Cancelled at:</span> {formatDateTime(selectedBooking.cancelledAt)}</p>
              <p><span className="font-medium">Auto-released at:</span> {formatDateTime(selectedBooking.releasedAt)}</p>
              <p><span className="font-medium">Reminder sent:</span> {selectedBooking.reminderSent ? "Yes" : "No"}</p>
              <p><span className="font-medium">QR token:</span> {selectedBooking.qrToken || "-"}</p>
            </div>
          </div>
        ) : null}
      </Panel>
    </div>
  );
};

export default SeatBookingPage;
