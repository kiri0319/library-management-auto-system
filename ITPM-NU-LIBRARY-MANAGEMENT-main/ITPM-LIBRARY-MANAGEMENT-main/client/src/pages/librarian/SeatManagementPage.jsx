import { useEffect, useState } from "react";
import { libraryApi } from "../../api/libraryApi";
import Panel from "../../components/common/Panel";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import { formatDateTime } from "../../utils/format";

const emptySeatForm = {
  code: "",
  zone: "Silent Zone",
  floor: 1,
  capacity: 1,
  hasPower: false,
  isActive: true,
};

const SeatManagementPage = () => {
  const [seats, setSeats] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingStatusFilter, setBookingStatusFilter] = useState("All");
  const [seatForm, setSeatForm] = useState(emptySeatForm);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const loadData = () => {
    Promise.all([libraryApi.seats.list(), libraryApi.seats.listBookings()])
      .then(([seatRes, bookingRes]) => {
        setSeats(seatRes.data);
        setBookings(bookingRes.data);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const createSeat = async (event) => {
    event.preventDefault();
    await libraryApi.seats.create({
      ...seatForm,
      floor: Number(seatForm.floor),
      capacity: Number(seatForm.capacity),
    });
    setSeatForm(emptySeatForm);
    loadData();
  };

  const checkIn = async (id) => {
    await libraryApi.seats.checkIn(id);
    loadData();
  };

  const dynamicBookingStatuses = bookings.map((booking) => booking.status).filter(Boolean);
  const bookingStatusOptions = [
    ...new Set(["Reserved", "CheckedIn", "Cancelled", "AutoReleased", "Completed", ...dynamicBookingStatuses]),
  ];
  const filteredBookings = bookingStatusFilter === "All"
    ? bookings
    : bookings.filter((booking) => booking.status === bookingStatusFilter);

  return (
    <div className="space-y-6">
      <Panel title="Seat management" subtitle="Configure silent/group zones and seat availability">
        <form className="grid gap-4 md:grid-cols-3" onSubmit={createSeat}>
          <label className="block">
            <span className="label-text">Seat code (optional)</span>
            <input
              className="input-field"
              value={seatForm.code}
              onChange={(event) => setSeatForm((current) => ({ ...current, code: event.target.value }))}
              placeholder="Leave blank to auto-generate"
            />
          </label>
          <label className="block">
            <span className="label-text">Zone</span>
            <select
              className="input-field"
              value={seatForm.zone}
              onChange={(event) => setSeatForm((current) => ({ ...current, zone: event.target.value }))}
            >
              <option value="Silent Zone">Silent Zone</option>
              <option value="Group Zone">Group Zone</option>
            </select>
          </label>
          <label className="block">
            <span className="label-text">Floor</span>
            <input
              type="number"
              className="input-field"
              value={seatForm.floor}
              onChange={(event) => setSeatForm((current) => ({ ...current, floor: event.target.value }))}
              min={1}
            />
          </label>
          <label className="block">
            <span className="label-text">Capacity</span>
            <input
              type="number"
              className="input-field"
              value={seatForm.capacity}
              onChange={(event) => setSeatForm((current) => ({ ...current, capacity: event.target.value }))}
              min={1}
            />
          </label>
          <label className="flex items-center gap-2 pt-7">
            <input
              type="checkbox"
              checked={seatForm.hasPower}
              onChange={(event) => setSeatForm((current) => ({ ...current, hasPower: event.target.checked }))}
            />
            <span className="text-sm text-slate-600">Power socket</span>
          </label>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full">
              Add seat
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Seat inventory" subtitle="All reading seats and zones">
        <DataTable
          rows={seats}
          columns={[
            { key: "code", label: "Seat" },
            { key: "zone", label: "Zone" },
            { key: "floor", label: "Floor" },
            { key: "capacity", label: "Capacity" },
            { key: "power", label: "Power", render: (row) => (row.hasPower ? "Yes" : "No") },
            { key: "active", label: "Active", render: (row) => <StatusBadge value={row.isActive ? "Active" : "Inactive"} /> },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <button type="button" className="btn-secondary px-3 py-2" onClick={() => setSelectedSeat(row)}>
                  View
                </button>
              ),
            },
          ]}
        />
        {selectedSeat ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Seat details</h3>
              <button type="button" className="btn-secondary px-3 py-1.5" onClick={() => setSelectedSeat(null)}>
                Close
              </button>
            </div>
            <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <p><span className="font-medium">Seat code:</span> {selectedSeat.code}</p>
              <p><span className="font-medium">Zone:</span> {selectedSeat.zone}</p>
              <p><span className="font-medium">Floor:</span> {selectedSeat.floor}</p>
              <p><span className="font-medium">Capacity:</span> {selectedSeat.capacity}</p>
              <p><span className="font-medium">Power socket:</span> {selectedSeat.hasPower ? "Yes" : "No"}</p>
              <p><span className="font-medium">Active:</span> {selectedSeat.isActive ? "Yes" : "No"}</p>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-slate-800">Recent bookings for this seat</p>
              <div className="space-y-2 text-sm text-slate-700">
                {bookings
                  .filter((booking) => booking.seat?._id === selectedSeat._id)
                  .slice(0, 5)
                  .map((booking) => (
                    <div key={booking._id} className="rounded-lg border border-slate-100 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span>{booking.user?.name || "-"}</span>
                        <StatusBadge value={booking.status} />
                      </div>
                      <p className="text-xs text-slate-500">
                        Booking time: {formatDateTime(booking.startTime)} - {formatDateTime(booking.endTime)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Expires at: {formatDateTime(booking.checkInDeadline)}
                      </p>
                    </div>
                  ))}
                {!bookings.some((booking) => booking.seat?._id === selectedSeat._id) ? (
                  <p className="text-xs text-slate-500">No bookings found for this seat.</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </Panel>

      <Panel
        title="Seat bookings monitor"
        subtitle="Check-ins and no-show auto-release visibility"
        action={(
          <select
            className="input-field min-w-40"
            value={bookingStatusFilter}
            onChange={(event) => setBookingStatusFilter(event.target.value)}
          >
            <option value="All">All statuses</option>
            {bookingStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        )}
      >
        <DataTable
          rows={filteredBookings}
          columns={[
            { key: "student", label: "Student", render: (row) => row.user?.name },
            { key: "seat", label: "Seat", render: (row) => row.seat?.code },
            { key: "zone", label: "Zone", render: (row) => row.seat?.zone },
            { key: "startTime", label: "Start", render: (row) => formatDateTime(row.startTime) },
            { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
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
                    disabled={row.status !== "Reserved"}
                    onClick={() => checkIn(row._id)}
                  >
                    Check in
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
              <p><span className="font-medium">Student:</span> {selectedBooking.user?.name || "-"}</p>
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

export default SeatManagementPage;
