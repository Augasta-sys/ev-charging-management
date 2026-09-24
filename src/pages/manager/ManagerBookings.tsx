import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  RefreshCw,
  Search,
  User,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

type BookingStatus =
  | "Pending"
  | "Confirmed"
  | "Checked In"
  | "Charging"
  | "Completed"
  | "Cancelled"
  | "No Show";

interface Booking {
  id: string;
  bookingId: string;
  userId?: string;
  customerId?: string;
  stationId: string;
  chargerId?: string;
  slotId?: string;
  vehicleId?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  amount?: number;
  totalAmount?: number;
  createdDate?: string;
}

interface UserRecord {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  role?: string;
}

interface Station {
  id: string;
  stationId: string;
  name: string;
}

interface Charger {
  id: string;
  chargerId: string;
  stationId: string;
}

interface Vehicle {
  id: string;
  vehicleId: string;
  userId?: string;
  customerId?: string;
  vehicleNumber?: string;
  registrationNumber?: string;
  vehicleType?: string;
  make?: string;
  model?: string;
}

const bookingStatuses: BookingStatus[] = [
  "Pending",
  "Confirmed",
  "Checked In",
  "Charging",
  "Completed",
  "Cancelled",
  "No Show",
];

function getStatusClasses(status: BookingStatus) {
  switch (status) {
    case "Pending":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    case "Confirmed":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
    case "Checked In":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";
    case "Charging":
      return "border-violet-400/20 bg-violet-400/10 text-violet-300";
    case "Completed":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    case "Cancelled":
      return "border-red-400/20 bg-red-400/10 text-red-300";
    case "No Show":
      return "border-slate-400/20 bg-slate-400/10 text-slate-300";
    default:
      return "border-white/10 bg-white/5 text-slate-300";
  }
}

function getStatusIcon(status: BookingStatus) {
  switch (status) {
    case "Completed":
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "Cancelled":
    case "No Show":
      return <XCircle className="h-3.5 w-3.5" />;
    case "Charging":
      return <Zap className="h-3.5 w-3.5" />;
    default:
      return <CalendarDays className="h-3.5 w-3.5" />;
  }
}

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value?: string) {
  if (!value) return "—";

  const parts = value.split(":");

  if (parts.length < 2) return value;

  const date = new Date();
  date.setHours(Number(parts[0]), Number(parts[1]), 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAmount(value?: number) {
  if (value === undefined || value === null) return "₹0";

  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function ActionButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:bg-white hover:text-black"
    >
      {children}
    </button>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-[#0D1B2A] p-4 shadow-lg shadow-black/10 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/10 text-cyan-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="relative min-w-0">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#0D1B2A] px-4 pr-11 text-sm text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
        style={{ colorScheme: "dark" }}
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-[#0D1B2A] text-white"
          >
            {option === "All" ? placeholder : option}
          </option>
        ))}
      </select>

      <svg
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 1.04l-4.25-4.51a.75.75 0 01-1.06-.02z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-medium text-white">
        {value}
      </p>
    </div>
  );
}

function MobileDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-medium text-slate-200">
        {value}
      </p>
    </div>
  );
}

export default function ManagerBookings() {
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [station, setStation] = useState<Station | null>(null);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | BookingStatus
  >("All");
  const [dateFilter, setDateFilter] = useState("");

  const [viewBooking, setViewBooking] = useState<Booking | null>(
    null
  );

  const [savingStatus, setSavingStatus] = useState(false);

  const assignedStationId = user?.assignedStationId || "";

  const fetchBookings = async () => {
    if (!assignedStationId) {
      setError("No station is assigned to this manager.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        bookingsResponse,
        usersResponse,
        stationsResponse,
        chargersResponse,
        vehiclesResponse,
      ] = await Promise.all([
        api.get<Booking[]>("/bookings"),
        api.get<UserRecord[]>("/users"),
        api.get<Station[]>("/stations"),
        api.get<Charger[]>("/chargers"),
        api.get<Vehicle[]>("/vehicles"),
      ]);

      const allBookings = bookingsResponse.data || [];
      const allUsers = usersResponse.data || [];
      const allStations = stationsResponse.data || [];
      const allChargers = chargersResponse.data || [];
      const allVehicles = vehiclesResponse.data || [];

      const assignedStation =
        allStations.find(
          (item) =>
            item.stationId === assignedStationId ||
            item.id === assignedStationId
        ) || null;

      setStation(assignedStation);
      setUsers(allUsers);

      const stationChargers = allChargers.filter(
        (charger) =>
          charger.stationId === assignedStationId ||
          charger.stationId === assignedStation?.id
      );

      setChargers(stationChargers);

      setVehicles(allVehicles);

      setBookings(
        allBookings.filter(
          (booking) =>
            booking.stationId === assignedStationId ||
            booking.stationId === assignedStation?.id
        )
      );
    } catch (err) {
      console.error("Failed to load manager bookings:", err);
      setError("Unable to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBookings();
  }, [assignedStationId]);

  /*
   * Lock the entire background whenever a booking popup is open.
   */
  useEffect(() => {
    if (!viewBooking) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow =
      document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [viewBooking]);

  const today = new Date().toISOString().split("T")[0];

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const customer = users.find(
        (item) =>
          item.id === booking.userId ||
          item.id === booking.customerId ||
          item.userId === booking.userId ||
          item.userId === booking.customerId
      );

      const charger = chargers.find(
        (item) =>
          item.id === booking.chargerId ||
          item.chargerId === booking.chargerId
      );

      const vehicle = vehicles.find(
        (item) =>
          item.id === booking.vehicleId ||
          item.vehicleId === booking.vehicleId
      );

      const customerName = customer?.name || "";
      const customerEmail = customer?.email || "";
      const chargerId = charger?.chargerId || "";
      const vehicleNumber =
        vehicle?.vehicleNumber ||
        vehicle?.registrationNumber ||
        "";

      const searchableText = [
        booking.bookingId,
        customerName,
        customerEmail,
        chargerId,
        vehicleNumber,
        booking.status,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        booking.status === statusFilter;

      const matchesDate =
        !dateFilter ||
        booking.bookingDate?.slice(0, 10) === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [
    bookings,
    users,
    chargers,
    vehicles,
    search,
    statusFilter,
    dateFilter,
  ]);

  const todayBookings = bookings.filter(
    (booking) => booking.bookingDate?.slice(0, 10) === today
  );

  const pendingBookings = bookings.filter(
    (booking) => booking.status === "Pending"
  );

  const confirmedBookings = bookings.filter(
    (booking) =>
      booking.status === "Confirmed" ||
      booking.status === "Checked In"
  );

  const activeBookings = bookings.filter(
    (booking) => booking.status === "Charging"
  );

  const completedBookings = bookings.filter(
    (booking) => booking.status === "Completed"
  );

  const cancelledBookings = bookings.filter(
    (booking) =>
      booking.status === "Cancelled" ||
      booking.status === "No Show"
  );

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setDateFilter("");
  };

  const getCustomer = (booking: Booking) =>
    users.find(
      (item) =>
        item.id === booking.userId ||
        item.id === booking.customerId ||
        item.userId === booking.userId ||
        item.userId === booking.customerId
    );

  const getCharger = (booking: Booking) =>
    chargers.find(
      (item) =>
        item.id === booking.chargerId ||
        item.chargerId === booking.chargerId
    );

  const getVehicle = (booking: Booking) =>
    vehicles.find(
      (item) =>
        item.id === booking.vehicleId ||
        item.vehicleId === booking.vehicleId
    );

  const handleStatusChange = async (
    booking: Booking,
    status: BookingStatus
  ) => {
    try {
      setSavingStatus(true);
      setError("");

      await api.patch(`/bookings/${booking.id}`, {
        status,
      });

      setViewBooking(null);

      await fetchBookings();
    } catch (err) {
      console.error("Failed to update booking status:", err);
      setError("Unable to update booking status.");
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-cyan-400" />

          <p className="text-sm text-slate-400">
            Loading bookings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0D1B2A] via-[#0B1726] to-[#111A35] p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
                Manager
              </span>

              {station && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                  {station.stationId}
                </span>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Booking Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Manage bookings for your assigned charging station.
            </p>

            {station && (
              <p className="mt-2 text-sm font-medium text-cyan-300">
                {station.name}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => void fetchBookings()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white hover:text-black"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />

          <div className="min-w-0">
            <p className="text-sm font-medium text-red-200">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError("")}
              className="mt-1 text-xs text-red-300 underline underline-offset-2 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Today's Bookings"
          value={todayBookings.length}
          description="Bookings scheduled today"
        />

        <StatCard
          icon={<Clock3 className="h-5 w-5" />}
          label="Pending"
          value={pendingBookings.length}
          description="Waiting for confirmation"
        />

        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Confirmed"
          value={confirmedBookings.length}
          description="Confirmed or checked in"
        />

        <StatCard
          icon={<Zap className="h-5 w-5" />}
          label="Charging"
          value={activeBookings.length}
          description="Currently charging"
        />
      </section>

      {/* Secondary stats */}
      <section className="grid min-w-0 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#0D1B2A] p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Completed
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {completedBookings.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Successfully completed bookings
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0D1B2A] p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Cancelled / No Show
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {cancelledBookings.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Cancelled or missed bookings
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0D1B2A] p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Total Bookings
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {bookings.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            All station bookings
          </p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="rounded-2xl border border-white/10 bg-[#0D1B2A] p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Search & Filters
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Find bookings by customer, booking ID, charger or status.
            </p>
          </div>

          {(search || statusFilter !== "All" || dateFilter) && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-cyan-400 transition hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 !text-white" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search bookings..."
              className="h-11 w-full rounded-xl border border-white/10 bg-[#0D1B2A] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
            />
          </div>

          <FilterSelect
            value={statusFilter}
            onChange={(value) =>
              setStatusFilter(value as "All" | BookingStatus)
            }
            options={["All", ...bookingStatuses]}
            placeholder="All Statuses"
          />

          <div className="relative min-w-0">
            <CalendarDays className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-white" />

            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="h-11 w-full rounded-xl border border-white/10 bg-[#0D1B2A] px-4 pl-11 text-sm text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
              style={{ colorScheme: "dark" }}
            />
          </div>
        </div>
      </section>

      {/* Booking Table */}
      <section className="min-w-0 rounded-2xl border border-white/10 bg-[#0D1B2A] shadow-lg shadow-black/10">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 p-5">
          <div>
            <h2 className="text-base font-semibold text-white">
              Bookings
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Showing {filteredBookings.length} of {bookings.length} bookings
            </p>
          </div>

          <Filter className="h-5 w-5 shrink-0 text-cyan-400" />
        </div>

        {filteredBookings.length === 0 ? (
          <div className="p-6">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-slate-600" />

              <p className="mt-3 text-sm font-medium text-white">
                No bookings found
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Try changing your search or filter selections.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[13%]" />
                  <col className="w-[18%]" />
                  <col className="w-[17%]" />
                  <col className="w-[16%]" />
                  <col className="w-[15%]" />
                  <col className="w-[21%]" />
                </colgroup>

                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Booking ID
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Customer
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date & Time
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Charger
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {filteredBookings.map((booking) => {
                    const customer = getCustomer(booking);
                    const charger = getCharger(booking);

                    return (
                      <tr
                        key={booking.id}
                        className="transition hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-5">
                          <p className="truncate text-sm font-semibold text-white">
                            {booking.bookingId}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {booking.slotId || "No slot ID"}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                              <User className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white">
                                {customer?.name || "Unknown customer"}
                              </p>

                              <p className="truncate text-xs text-slate-500">
                                {customer?.email || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-5">
                          <div className="flex items-start gap-2">
                            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-white" />

                            <div>
                              <p className="text-sm text-slate-200">
                                {formatDate(booking.bookingDate)}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {formatTime(booking.startTime)} -{" "}
                                {formatTime(booking.endTime)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-5">
                          <p className="text-sm font-medium text-white">
                            {charger?.chargerId ||
                              booking.chargerId ||
                              "—"}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                              booking.status
                            )}`}
                          >
                            {getStatusIcon(booking.status)}
                            {booking.status}
                          </span>
                        </td>

                        <td className="px-4 py-5">
                          <div className="flex items-center justify-end gap-2.5">
                            <ActionButton
                              label="View Booking"
                              onClick={() => setViewBooking(booking)}
                            >
                              <Eye className="h-4 w-4" />
                            </ActionButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="grid gap-3 p-4 md:hidden">
              {filteredBookings.map((booking) => {
                const customer = getCustomer(booking);
                const charger = getCharger(booking);

                return (
                  <div
                    key={booking.id}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {booking.bookingId}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {customer?.name || "Unknown customer"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium ${getStatusClasses(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <MobileDetail
                        label="Date"
                        value={formatDate(booking.bookingDate)}
                      />

                      <MobileDetail
                        label="Time"
                        value={`${formatTime(
                          booking.startTime
                        )} - ${formatTime(booking.endTime)}`}
                      />

                      <MobileDetail
                        label="Charger"
                        value={
                          charger?.chargerId ||
                          booking.chargerId ||
                          "—"
                        }
                      />

                      <MobileDetail
                        label="Amount"
                        value={formatAmount(
                          booking.totalAmount ?? booking.amount
                        )}
                      />
                    </div>

                    <div className="mt-4 flex justify-end">
                      <ActionButton
                        label="View Booking"
                        onClick={() => setViewBooking(booking)}
                      >
                        <Eye className="h-4 w-4" />
                      </ActionButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* View Booking Popup */}
      {viewBooking && (
        <div className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center overflow-hidden bg-black/70 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex h-auto max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0D1A2A] shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-2rem)]">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-white">
                  Booking Details
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {viewBooking.bookingId}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewBooking(null)}
                disabled={savingStatus}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
              <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
                <DetailItem
                  label="Booking ID"
                  value={viewBooking.bookingId}
                />

                <DetailItem
                  label="Status"
                  value={viewBooking.status}
                />

                <DetailItem
                  label="Customer"
                  value={
                    getCustomer(viewBooking)?.name ||
                    "Unknown customer"
                  }
                />

                <DetailItem
                  label="Customer Email"
                  value={
                    getCustomer(viewBooking)?.email || "—"
                  }
                />

                <DetailItem
                  label="Station"
                  value={station?.name || "—"}
                />

                <DetailItem
                  label="Station ID"
                  value={station?.stationId || "—"}
                />

                <DetailItem
                  label="Charger"
                  value={
                    getCharger(viewBooking)?.chargerId ||
                    viewBooking.chargerId ||
                    "—"
                  }
                />

                <DetailItem
                  label="Slot"
                  value={viewBooking.slotId || "—"}
                />

                <DetailItem
                  label="Booking Date"
                  value={formatDate(viewBooking.bookingDate)}
                />

                <DetailItem
                  label="Start Time"
                  value={formatTime(viewBooking.startTime)}
                />

                <DetailItem
                  label="End Time"
                  value={formatTime(viewBooking.endTime)}
                />

                <DetailItem
                  label="Vehicle"
                  value={
                    getVehicle(viewBooking)?.vehicleNumber ||
                    getVehicle(viewBooking)?.registrationNumber ||
                    viewBooking.vehicleId ||
                    "—"
                  }
                />

                <DetailItem
                  label="Vehicle Type"
                  value={
                    getVehicle(viewBooking)?.vehicleType || "—"
                  }
                />

                <DetailItem
                  label="Amount"
                  value={formatAmount(
                    viewBooking.totalAmount ??
                      viewBooking.amount
                  )}
                />

                <DetailItem
                  label="Created Date"
                  value={formatDate(viewBooking.createdDate)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 flex-col gap-3 border-t border-white/10 bg-[#0D1A2A] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex flex-wrap gap-2">
                {viewBooking.status === "Pending" && (
                  <button
                    type="button"
                    disabled={savingStatus}
                    onClick={() =>
                      void handleStatusChange(
                        viewBooking,
                        "Confirmed"
                      )
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Confirm
                  </button>
                )}

                {viewBooking.status === "Confirmed" && (
                  <button
                    type="button"
                    disabled={savingStatus}
                    onClick={() =>
                      void handleStatusChange(
                        viewBooking,
                        "Checked In"
                      )
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-400/20 bg-blue-400/10 px-4 text-xs font-semibold text-blue-300 transition hover:bg-blue-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Check In
                  </button>
                )}

                {viewBooking.status === "Checked In" && (
                  <button
                    type="button"
                    disabled={savingStatus}
                    onClick={() =>
                      void handleStatusChange(
                        viewBooking,
                        "Charging"
                      )
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-violet-400/10 px-4 text-xs font-semibold text-violet-300 transition hover:bg-violet-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Zap className="h-4 w-4" />
                    Start Charging
                  </button>
                )}

                {viewBooking.status === "Charging" && (
                  <button
                    type="button"
                    disabled={savingStatus}
                    onClick={() =>
                      void handleStatusChange(
                        viewBooking,
                        "Completed"
                      )
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Complete
                  </button>
                )}

                {[
                  "Pending",
                  "Confirmed",
                  "Checked In",
                ].includes(viewBooking.status) && (
                  <button
                    type="button"
                    disabled={savingStatus}
                    onClick={() =>
                      void handleStatusChange(
                        viewBooking,
                        "Cancelled"
                      )
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 text-xs font-semibold text-red-300 transition hover:bg-red-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel
                  </button>
                )}
              </div>

              <button
                type="button"
                disabled={savingStatus}
                onClick={() => setViewBooking(null)}
                className="h-10 rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-medium text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}