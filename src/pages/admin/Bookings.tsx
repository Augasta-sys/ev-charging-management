import type {
  ElementType,
  ReactNode,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  IndianRupee,
  Search,
  Trash2,
  UserRound,
  X,
  Zap,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

/* =========================================================
   TYPES
========================================================= */

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

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

interface Station {
  id: string;
  stationId: string;
  stationName: string;
  city: string;
}

interface Charger {
  id: string;
  chargerId: string;
  chargerNumber: string;
  stationId: string;
  chargerType: string;
  connectorType: string;
  powerOutput: number;
}

interface Vehicle {
  id: string;
  vehicleId: string;
  userId?: string;
  customerId?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  brand?: string;
  model?: string;
}

/* =========================================================
   CONSTANTS
========================================================= */

const bookingStatuses: BookingStatus[] = [
  "Pending",
  "Confirmed",
  "Checked In",
  "Charging",
  "Completed",
  "Cancelled",
  "No Show",
];

/* =========================================================
   COMPONENT
========================================================= */

function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [viewBooking, setViewBooking] =
    useState<Booking | null>(null);

  const [deleteId, setDeleteId] =
    useState<string | null>(null);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {
    void loadData();
  }, []);

  /* =======================================================
     BODY SCROLL LOCK
  ======================================================= */

  useEffect(() => {
    if (!viewBooking && !deleteId) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [viewBooking, deleteId]);

  /* =======================================================
     FETCH DATA
  ======================================================= */

  const loadData = async () => {
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
  api.get("/bookings"),
  api.get("/users"),
  api.get("/stations"),
  api.get("/chargers"),
  api.get("/vehicles"),
]);

      setBookings(bookingsResponse.data);
      setUsers(usersResponse.data);
      setStations(stationsResponse.data);
      setChargers(chargersResponse.data);
      setVehicles(vehiclesResponse.data);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load booking data. Please make sure JSON Server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     HELPERS
  ======================================================= */

  const getUser = (
    booking: Booking
  ) => {
    const userId =
      booking.userId ?? booking.customerId;

    if (!userId) {
      return undefined;
    }

    return users.find(
      (user) =>
        user.id === userId ||
        user.id === String(userId)
    );
  };

  const getCustomerName = (
    booking: Booking
  ) => {
    return (
      getUser(booking)?.name ??
      "Unknown Customer"
    );
  };

  const getCustomerEmail = (
    booking: Booking
  ) => {
    return getUser(booking)?.email ?? "";
  };

  const getStation = (
    stationId?: string
  ) => {
    if (!stationId) {
      return undefined;
    }

    return stations.find(
      (station) =>
        station.stationId === stationId ||
        station.id === stationId
    );
  };

  const getStationName = (
    stationId?: string
  ) => {
    return (
      getStation(stationId)?.stationName ??
      stationId ??
      "Unknown Station"
    );
  };

  const getStationCity = (
    stationId?: string
  ) => {
    return (
      getStation(stationId)?.city ??
      ""
    );
  };

  const getCharger = (
    chargerId?: string
  ) => {
    if (!chargerId) {
      return undefined;
    }

    return chargers.find(
      (charger) =>
        charger.chargerId === chargerId ||
        charger.id === chargerId
    );
  };

  const getChargerName = (
    chargerId?: string
  ) => {
    const charger = getCharger(chargerId);

    if (!charger) {
      return chargerId ?? "—";
    }

    return (
      charger.chargerNumber ||
      charger.chargerId
    );
  };

  const getVehicle = (
    vehicleId?: string
  ) => {
    if (!vehicleId) {
      return undefined;
    }

    return vehicles.find(
      (vehicle) =>
        vehicle.vehicleId === vehicleId ||
        vehicle.id === vehicleId
    );
  };

  const getAmount = (
    booking: Booking
  ) => {
    return Number(
      booking.amount ??
        booking.totalAmount ??
        0
    );
  };

  const formatDate = (
    date: string
  ) => {
    if (!date) {
      return "—";
    }

    const parsed = new Date(
      `${date}T00:00:00`
    );

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatTime = (
    time: string
  ) => {
    if (!time) {
      return "—";
    }

    const [hours, minutes] =
      time.split(":");

    const hour = Number(hours);

    if (Number.isNaN(hour)) {
      return time;
    }

    const suffix =
      hour >= 12 ? "PM" : "AM";

    const displayHour =
      hour % 12 || 12;

    return `${displayHour}:${minutes} ${suffix}`;
  };

  /* =======================================================
     STATISTICS
  ======================================================= */

  const stats = useMemo(() => {
    const activeStatuses: BookingStatus[] = [
      "Pending",
      "Confirmed",
      "Checked In",
      "Charging",
    ];

    const today = new Date()
      .toISOString()
      .split("T")[0];

    const todayBookings = bookings.filter(
      (booking) =>
        booking.bookingDate === today
    ).length;

    const activeBookings = bookings.filter(
      (booking) =>
        activeStatuses.includes(
          booking.status
        )
    ).length;

    const completedBookings =
      bookings.filter(
        (booking) =>
          booking.status === "Completed"
      ).length;

    const cancelledBookings =
      bookings.filter(
        (booking) =>
          booking.status === "Cancelled"
      ).length;

    const revenue = bookings
      .filter(
        (booking) =>
          booking.status === "Completed"
      )
      .reduce(
        (sum, booking) =>
          sum + getAmount(booking),
        0
      );

    const pendingBookings =
      bookings.filter(
        (booking) =>
          booking.status === "Pending"
      ).length;

    return {
      total: bookings.length,
      today: todayBookings,
      active: activeBookings,
      pending: pendingBookings,
      completed: completedBookings,
      cancelled: cancelledBookings,
      revenue,
    };
  }, [bookings]);

  /* =======================================================
     FILTERED BOOKINGS
  ======================================================= */

  const filteredBookings = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return bookings
      .filter((booking) => {
        const customer =
          getCustomerName(
            booking
          ).toLowerCase();

        const email =
          getCustomerEmail(
            booking
          ).toLowerCase();

        const station =
          getStationName(
            booking.stationId
          ).toLowerCase();

        const charger =
          getChargerName(
            booking.chargerId
          ).toLowerCase();

        const vehicle =
          getVehicle(
            booking.vehicleId
          );

        const vehicleNumber =
          vehicle?.vehicleNumber
            ?.toLowerCase() ?? "";

        const matchesSearch =
          !query ||
          booking.bookingId
            .toLowerCase()
            .includes(query) ||
          customer.includes(query) ||
          email.includes(query) ||
          station.includes(query) ||
          charger.includes(query) ||
          vehicleNumber.includes(query);

        const matchesStation =
          !stationFilter ||
          booking.stationId ===
            stationFilter;

        const matchesStatus =
          !statusFilter ||
          booking.status ===
            statusFilter;

        const matchesDate =
          !dateFilter ||
          booking.bookingDate ===
            dateFilter;

        return (
          matchesSearch &&
          matchesStation &&
          matchesStatus &&
          matchesDate
        );
      })
      .sort((a, b) =>
        `${a.bookingDate}${a.startTime}`.localeCompare(
          `${b.bookingDate}${b.startTime}`
        )
      );
  }, [
    bookings,
    users,
    stations,
    chargers,
    vehicles,
    search,
    stationFilter,
    statusFilter,
    dateFilter,
  ]);

  /* =======================================================
     UPDATE BOOKING STATUS
  ======================================================= */

  const handleStatusChange = async (
    booking: Booking,
    status: BookingStatus
  ) => {
    try {
      setError("");

      const response =
        await api.patch<Booking>(
          `/bookings/${booking.id}`,
          {
            status,
          }
        );

      setBookings((previous) =>
        previous.map((item) =>
          item.id === booking.id
            ? response.data
            : item
        )
      );

      setSuccess(
        `${booking.bookingId} is now ${status}.`
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to update booking status."
      );
    }
  };

  /* =======================================================
     DELETE BOOKING
  ======================================================= */

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/bookings/${deleteId}`
      );

      setBookings((previous) =>
        previous.filter(
          (item) =>
            item.id !== deleteId
        )
      );

      setDeleteId(null);

      setSuccess(
        "Booking deleted successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to delete booking."
      );
    }
  };

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters = () => {
    setSearch("");
    setStationFilter("");
    setStatusFilter("");
    setDateFilter("");
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
            <CalendarDays className="h-6 w-6 animate-pulse text-cyan-400" />
          </div>

          <p className="text-sm text-[var(--text-secondary)]">
            Loading bookings...
          </p>

        </div>
      </div>
    );
  }

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">

      {/* HEADER */}

      <div className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">

        <div className="min-w-0">

          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
            <CalendarDays className="h-4 w-4 text-[var(--text-primary)]" />
            Booking Management
          </div>

          <h1 className="truncate text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            Bookings
          </h1>

          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Manage charging station bookings
            and customer reservations.
          </p>

        </div>

      </div>

      {/* ALERTS */}

      {error && (
        <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {/* =====================================================
          STATS
      ===================================================== */}

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total Bookings"
          value={stats.total}
          description="All booking records"
          icon={CalendarDays}
          iconClass="text-cyan-400"
          iconBg="bg-cyan-400/10"
        />

        <StatCard
          title="Today's Bookings"
          value={stats.today}
          description="Bookings scheduled today"
          icon={Clock3}
          iconClass="text-violet-400"
          iconBg="bg-violet-400/10"
        />

        <StatCard
          title="Active Bookings"
          value={stats.active}
          description="Currently active"
          icon={Zap}
          iconClass="text-emerald-400"
          iconBg="bg-emerald-400/10"
        />

        <StatCard
          title="Booking Revenue"
          value={`₹${stats.revenue.toFixed(2)}`}
          description="Completed booking revenue"
          icon={IndianRupee}
          iconClass="text-cyan-400"
          iconBg="bg-cyan-400/10"
        />

      </div>

      {/* =====================================================
          SEARCH & FILTERS
      ===================================================== */}

      <section className="mt-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 sm:p-5">

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Search & Filters
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Find bookings by customer,
              station, date or status.
            </p>
          </div>

          {(search ||
            stationFilter ||
            statusFilter ||
            dateFilter) && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-cyan-400 transition hover:text-[var(--text-primary)]"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}

        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">

          {/* Search */}

          <div className="relative min-w-0">

            <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 !text-white" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search bookings..."
              className="input-field !pl-11"
            />

          </div>

          {/* Station */}

          <select
            value={stationFilter}
            onChange={(event) =>
              setStationFilter(
                event.target.value
              )
            }
            className="input-field"
          >
            <option value="">
              All Stations
            </option>

            {stations.map((station) => (
              <option
                key={station.stationId}
                value={station.stationId}
              >
                {station.stationName}
              </option>
            ))}
          </select>

          {/* Date */}

          <input
            type="date"
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(
                event.target.value
              )
            }
            className="input-field"
          />

          {/* Status */}

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="input-field"
          >
            <option value="">
              All Statuses
            </option>

            {bookingStatuses.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              )
            )}
          </select>

        </div>

      </section>

      {/* RESULT COUNT */}

      <div className="mt-4">
        <p className="text-xs text-[var(--text-muted)]">
          Showing{" "}
          <span className="font-semibold text-[var(--text-secondary)]">
            {filteredBookings.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-[var(--text-secondary)]">
            {bookings.length}
          </span>{" "}
          bookings
        </p>
      </div>

      {/* =====================================================
          DESKTOP TABLE
      ===================================================== */}

      <div className="mt-4 hidden w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] lg:block">

        <table className="w-full table-fixed border-collapse">

          <colgroup>
            <col className="w-[11%]" />
            <col className="w-[16%]" />
            <col className="w-[17%]" />
            <col className="w-[15%]" />
            <col className="w-[13%]" />
            <col className="w-[10%]" />
            <col className="w-[18%]" />
          </colgroup>

          <thead>
            <tr className="border-b border-[var(--border-primary)] text-left">

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:px-4">
                Booking ID
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:px-4">
                Customer
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:px-4">
                Station
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:px-4">
                Charger / Slot
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:px-4">
                Date & Time
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:px-4">
                Status
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:px-4">
                Actions
              </th>

            </tr>
          </thead>

          <tbody>

            {filteredBookings.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-16 text-center"
                >
                  <CalendarDays className="mx-auto h-8 w-8 text-[var(--text-muted)]" />

                  <p className="mt-3 text-sm font-medium text-[var(--text-secondary)]">
                    No bookings found
                  </p>

                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Try changing your search
                    or filters.
                  </p>
                </td>
              </tr>
            ) : (
              filteredBookings.map(
                (booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-[var(--border-primary)] last:border-b-0 transition-colors hover:bg-[var(--bg-tertiary)]"
                  >

                    {/* Booking ID */}

                    <td className="px-3 py-5 align-middle xl:px-4">

                      <div className="flex min-w-0 items-center gap-2">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
                          <CalendarDays className="h-4 w-4 text-[var(--text-primary)]" />
                        </div>

                        <span
                          className="truncate text-sm font-semibold text-[var(--text-primary)]"
                          title={booking.bookingId}
                        >
                          {booking.bookingId}
                        </span>

                      </div>

                    </td>

                    {/* Customer */}

                    <td className="px-3 py-5 align-middle xl:px-4">

                      <div className="min-w-0">

                        <div className="flex min-w-0 items-center gap-2">

                          <UserRound className="h-4 w-4 shrink-0 text-[var(--text-primary)]" />

                          <p
                            className="truncate text-sm font-semibold text-[var(--text-primary)]"
                            title={getCustomerName(
                              booking
                            )}
                          >
                            {getCustomerName(
                              booking
                            )}
                          </p>

                        </div>

                        <p className="mt-1 truncate pl-6 text-[11px] text-[var(--text-muted)]">
                          {getCustomerEmail(
                            booking
                          )}
                        </p>

                      </div>

                    </td>

                    {/* Station */}

                    <td className="px-3 py-5 align-middle xl:px-4">

                      <div className="min-w-0">

                        <p
                          className="truncate text-sm font-semibold text-[var(--text-primary)]"
                          title={getStationName(
                            booking.stationId
                          )}
                        >
                          {getStationName(
                            booking.stationId
                          )}
                        </p>

                        <p className="mt-1 truncate text-[11px] text-[var(--text-muted)]">
                          {getStationCity(
                            booking.stationId
                          )}
                        </p>

                      </div>

                    </td>

                    {/* Charger / Slot */}

                    <td className="px-3 py-5 align-middle xl:px-4">

                      <div className="min-w-0">

                        <div className="flex items-center gap-2">

                          <Zap className="h-4 w-4 shrink-0 text-[var(--text-primary)]" />

                          <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                            {getChargerName(
                              booking.chargerId
                            )}
                          </span>

                        </div>

                        <p className="mt-1 truncate pl-6 text-[11px] text-[var(--text-muted)]">
                          {booking.slotId
                            ? `Slot ${booking.slotId}`
                            : "Slot not assigned"}
                        </p>

                      </div>

                    </td>

                    {/* Date & Time */}

                    <td className="px-3 py-5 align-middle xl:px-4">

                      <div className="min-w-0">

                        <div className="flex items-center gap-2">

                          <CalendarDays className="h-4 w-4 shrink-0 text-[var(--text-primary)]" />

                          <span className="truncate text-xs font-medium text-[var(--text-primary)]">
                            {formatDate(
                              booking.bookingDate
                            )}
                          </span>

                        </div>

                        <div className="mt-1 flex items-center gap-2">

                          <Clock3 className="h-4 w-4 shrink-0 text-[var(--text-primary)]" />

                          <span className="truncate text-[11px] text-[var(--text-muted)]">
                            {formatTime(
                              booking.startTime
                            )}{" "}
                            -
                            {formatTime(
                              booking.endTime
                            )}
                          </span>

                        </div>

                      </div>

                    </td>

                    {/* Status */}

                    <td className="px-3 py-5 pl-5 align-middle xl:px-4 xl:pl-6">

                      <StatusBadge
                        status={booking.status}
                      />

                    </td>

                    {/* Actions */}

                    <td className="px-3 py-5 align-middle xl:px-4">

                      <div className="flex items-center gap-2">

                        <ActionButton
                          label="View booking"
                          onClick={() =>
                            setViewBooking(
                              booking
                            )
                          }
                        >
                          <Eye className="h-4 w-4 text-[var(--text-primary)]" />
                        </ActionButton>

                        {booking.status ===
                          "Pending" && (
                          <ActionButton
                            label="Confirm booking"
                            onClick={() =>
                              void handleStatusChange(
                                booking,
                                "Confirmed"
                              )
                            }
                            className="hover:border-emerald-400/30 hover:bg-emerald-400/10"
                          >
                            <CheckCircle2 className="h-4 w-4 text-[var(--text-primary)]" />
                          </ActionButton>
                        )}

                        {booking.status !==
                          "Cancelled" &&
                          booking.status !==
                            "Completed" && (
                            <ActionButton
                              label="Cancel booking"
                              onClick={() =>
                                void handleStatusChange(
                                  booking,
                                  "Cancelled"
                                )
                              }
                              className="hover:border-red-400/30 hover:bg-red-400/10"
                            >
                              <X className="h-4 w-4 text-[var(--text-primary)]" />
                            </ActionButton>
                          )}

                        <ActionButton
                          label="Delete booking"
                          onClick={() =>
                            setDeleteId(
                              booking.id
                            )
                          }
                          className="hover:border-red-400/30 hover:bg-red-400/10"
                        >
                          <Trash2 className="h-4 w-4 text-[var(--text-primary)]" />
                        </ActionButton>

                      </div>

                    </td>

                  </tr>
                )
              )
            )}

          </tbody>

        </table>

      </div>

      {/* =====================================================
          MOBILE CARDS
      ===================================================== */}

      <section className="mt-4 grid gap-4 lg:hidden">

        {filteredBookings.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] px-5 py-14 text-center">

            <CalendarDays className="mx-auto h-8 w-8 text-[var(--text-muted)]" />

            <p className="mt-3 text-sm font-medium text-[var(--text-secondary)]">
              No bookings found
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Try changing your search
              or filters.
            </p>

          </div>
        ) : (
          filteredBookings.map(
            (booking) => (
              <div
                key={booking.id}
                className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 transition hover:border-cyan-400/20"
              >

                {/* Header */}

                <div className="flex items-start justify-between gap-3">

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                      <CalendarDays className="h-5 w-5 text-[var(--text-primary)]" />
                    </div>

                    <div className="min-w-0">

                      <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                        {booking.bookingId}
                      </p>

                      <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                        {getCustomerName(
                          booking
                        )}
                      </p>

                    </div>

                  </div>

                  <StatusBadge
                    status={booking.status}
                  />

                </div>

                {/* Details */}

                <div className="mt-5 grid grid-cols-2 gap-3">

                  <InfoItem
                    label="Station"
                    value={getStationName(
                      booking.stationId
                    )}
                  />

                  <InfoItem
                    label="Charger"
                    value={getChargerName(
                      booking.chargerId
                    )}
                    icon={
                      <Zap className="h-3.5 w-3.5 text-[var(--text-primary)]" />
                    }
                  />

                  <InfoItem
                    label="Date"
                    value={formatDate(
                      booking.bookingDate
                    )}
                    icon={
                      <CalendarDays className="h-3.5 w-3.5 text-[var(--text-primary)]" />
                    }
                  />

                  <InfoItem
                    label="Time"
                    value={`${formatTime(
                      booking.startTime
                    )} - ${formatTime(
                      booking.endTime
                    )}`}
                    icon={
                      <Clock3 className="h-3.5 w-3.5 text-[var(--text-primary)]" />
                    }
                  />

                  <InfoItem
                    label="Amount"
                    value={`₹${getAmount(
                      booking
                    ).toFixed(2)}`}
                    icon={
                      <IndianRupee className="h-3.5 w-3.5 text-[var(--text-primary)]" />
                    }
                  />

                  <InfoItem
                    label="Slot"
                    value={
                      booking.slotId ??
                      "Not assigned"
                    }
                  />

                </div>

                {/* Actions */}

                <div className="mt-5 flex items-center justify-end gap-2 border-t border-[var(--border-primary)] pt-4">

                  <ActionButton
                    label="View booking"
                    onClick={() =>
                      setViewBooking(
                        booking
                      )
                    }
                  >
                    <Eye className="h-4 w-4 !text-white" />
                  </ActionButton>

                  {booking.status ===
                    "Pending" && (
                    <ActionButton
                      label="Confirm booking"
                      onClick={() =>
                        void handleStatusChange(
                          booking,
                          "Confirmed"
                        )
                      }
                      className="hover:border-emerald-400/30 hover:bg-emerald-400/10"
                    >
                      <CheckCircle2 className="h-4 w-4 !text-white" />
                    </ActionButton>
                  )}

                  {booking.status !==
                    "Cancelled" &&
                    booking.status !==
                      "Completed" && (
                      <ActionButton
                        label="Cancel booking"
                        onClick={() =>
                          void handleStatusChange(
                            booking,
                            "Cancelled"
                          )
                        }
                        className="hover:border-red-400/30 hover:bg-red-400/10"
                      >
                        <X className="h-4 w-4 !text-white" />
                      </ActionButton>
                    )}

                  <ActionButton
                    label="Delete booking"
                    onClick={() =>
                      setDeleteId(
                        booking.id
                      )
                    }
                    className="hover:border-red-400/30 hover:bg-red-400/10"
                  >
                    <Trash2 className="h-4 w-4 !text-white" />
                  </ActionButton>

                </div>

              </div>
            )
          )
        )}

      </section>

      {/* =====================================================
          VIEW BOOKING MODAL
      ===================================================== */}

    {viewBooking && (
  <div className="fixed inset-0 z-[100] flex min-h-0 items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4">

    <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-2rem)]">

            {/* Header */}

            <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-5 py-4 sm:px-6">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  Booking Details
                </p>

                <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                  {viewBooking.bookingId}
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setViewBooking(null)
                }
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition hover:bg-white hover:text-slate-950"
              >
                <X className="h-4 w-4" />
              </button>

            </div>

            {/* Details */}

           <div className="scrollbar-hidden grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2 sm:gap-4 sm:p-5">

              <DetailItem
                label="Customer"
                value={getCustomerName(
                  viewBooking
                )}
              />

              <DetailItem
                label="Email"
                value={
                  getCustomerEmail(
                    viewBooking
                  ) || "—"
                }
              />

              <DetailItem
                label="Station"
                value={getStationName(
                  viewBooking.stationId
                )}
              />

              <DetailItem
                label="City"
                value={
                  getStationCity(
                    viewBooking.stationId
                  ) || "—"
                }
              />

              <DetailItem
                label="Charger"
                value={getChargerName(
                  viewBooking.chargerId
                )}
              />

              <DetailItem
                label="Slot"
                value={
                  viewBooking.slotId ??
                  "Not assigned"
                }
              />

              <DetailItem
                label="Booking Date"
                value={formatDate(
                  viewBooking.bookingDate
                )}
              />

              <DetailItem
                label="Time"
                value={`${formatTime(
                  viewBooking.startTime
                )} - ${formatTime(
                  viewBooking.endTime
                )}`}
              />

              <DetailItem
                label="Vehicle"
                value={
                  getVehicle(
                    viewBooking.vehicleId
                  )?.vehicleNumber ??
                  "—"
                }
              />

              <DetailItem
                label="Amount"
                value={`₹${getAmount(
                  viewBooking
                ).toFixed(2)}`}
              />

              <DetailItem
                label="Status"
                value={viewBooking.status}
              />

            </div>

            <div className="border-t border-[var(--border-primary)] px-5 py-4 sm:px-6">

              <button
                type="button"
                onClick={() =>
                  setViewBooking(null)
                }
                className="h-11 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white hover:text-slate-950"
              >
                Close
              </button>

            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          DELETE MODAL
      ===================================================== */}

      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-6 shadow-2xl shadow-black/60">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-400/10">
              <Trash2 className="h-5 w-5 text-red-400" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-[var(--text-primary)]">
              Delete Booking?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              This booking will be permanently
              removed from the system. This action
              cannot be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() =>
                  setDeleteId(null)
                }
                className="h-11 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white hover:text-slate-950"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleDelete()
                }
                className="h-11 rounded-xl bg-red-500 px-5 text-sm font-bold text-[var(--text-primary)] transition hover:bg-red-400"
              >
                Delete Booking
              </button>

            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          STYLES
      ===================================================== */}

      <style>{`
        .input-field {
          width: 100%;
          height: 44px;
          min-width: 0;
          max-width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--border-primary);
          background: var(--input-bg);
          padding: 0 0.875rem;
          font-size: 0.875rem;
          color: var(--input-text);
          outline: none;
          transition: all 0.2s ease;
        }

        .input-field::placeholder {
          color: var(--text-muted);
        }

        .input-field:focus {
          border-color: rgba(34,211,238,0.40);
          box-shadow: 0 0 0 2px rgba(34,211,238,0.08);
        }

        .input-field option {
          background: var(--input-bg);
          color: var(--input-text);
        }

        input[type="date"].input-field {
          color-scheme: inherit;
        }

        input[type="date"].input-field::-webkit-calendar-picker-indicator {
          opacity: 1 !important;
          cursor: pointer;
        }

        html.dark input[type="date"].input-field::-webkit-calendar-picker-indicator {
          filter: brightness(0) invert(1) !important;
        }

        html.light input[type="date"].input-field::-webkit-calendar-picker-indicator {
          filter: none !important;
        }

        select.input-field {
          color-scheme: inherit;
        }

        html.dark input[type="date"],
        html.dark select {
          color-scheme: dark;
        }

        html.light input[type="date"],
        html.light select {
          color-scheme: light;
        }
      `}</style>

    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: ElementType;
  iconClass: string;
  iconBg: string;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
  iconBg,
}: StatCardProps) {
  return (
    <div className="group min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5 shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/20 hover:bg-[var(--bg-tertiary)]">

      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0">

          <p className="truncate text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            {value}
          </p>

          <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
            {description}
          </p>

        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon
            className={`h-5 w-5 ${iconClass}`}
          />
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

interface StatusBadgeProps {
  status: BookingStatus;
}

function StatusBadge({
  status,
}: StatusBadgeProps) {
  const statusStyles: Record<
    BookingStatus,
    string
  > = {
    Pending:
      "border-amber-400/20 bg-amber-400/10 text-amber-300",

    Confirmed:
      "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",

    "Checked In":
      "border-violet-400/20 bg-violet-400/10 text-violet-300",

    Charging:
      "border-blue-400/20 bg-blue-400/10 text-blue-300",

    Completed:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",

    Cancelled:
      "border-red-400/20 bg-red-400/10 text-red-300",

    "No Show":
      "border-slate-400/20 bg-slate-400/10 text-[var(--text-secondary)]",
  };

  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

/* =========================================================
   ACTION BUTTON
========================================================= */

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}

function ActionButton({
  label,
  onClick,
  className = "",
  children,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`
        flex
        h-9
        w-9
        shrink-0
        items-center
        justify-center
        rounded-lg
        border
        border-[var(--border-primary)]
        bg-[var(--bg-tertiary)]
        text-[var(--text-primary)]
        transition
        hover:bg-[var(--bg-tertiary)]
        ${className}
      `}
    >
      {children}
    </button>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

interface InfoItemProps {
  label: string;
  value: string;
  icon?: ReactNode;
}

function InfoItem({
  label,
  value,
  icon,
}: InfoItemProps) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3">

      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </p>

      <div className="mt-1 flex min-w-0 items-center gap-1.5">

        {icon}

        <p className="truncate text-xs font-medium text-[var(--text-secondary)]">
          {value}
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   DETAIL ITEM
========================================================= */

interface DetailItemProps {
  label: string;
  value: string;
}

function DetailItem({
  label,
  value,
}: DetailItemProps) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4">

      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </p>

      <p className="mt-2 truncate text-sm font-medium text-[var(--text-primary)]">
        {value}
      </p>

    </div>
  );
}

export default Bookings;