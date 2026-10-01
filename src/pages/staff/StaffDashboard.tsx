import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
  UserCheck,
  Wrench,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

interface Station {
  id: string;
  stationId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  status?: string;
  operatingHours?: string;
}

interface Charger {
  id: string;
  chargerId: string;
  stationId: string;
  chargerType?: string;
  connectorType?: string;
  status?: string;
}

interface Booking {
  id: string;
  bookingId: string;
  userId?: string;
  customerId?: string;
  stationId: string;
  chargerId?: string;
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  createdDate?: string;
}

interface ChargingSession {
  id: string;
  sessionId: string;
  bookingId?: string;
  userId?: string;
  customerId?: string;
  stationId: string;
  chargerId?: string;
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  energyConsumed?: number;
  unitsConsumed?: number;
  createdDate?: string;
}

interface MaintenanceRecord {
  id: string;
  maintenanceId: string;
  stationId: string;
  chargerId?: string;
  issue?: string;
  description?: string;
  issueDescription?: string;
  priority?: string;
  status?: string;
  reportedDate?: string;
  createdDate?: string;
}

interface UserRecord {
  id: string;
  userId?: string;
  name: string;
  email?: string;
}

function normalizeDate(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(value?: string) {
  if (!value) return "—";

  /*
   * Handles simple seed-data values such as 10:00,
   * while also supporting complete date-time strings.
   */
  if (/^\d{2}:\d{2}/.test(value)) {
    const [hoursText, minutesText] = value.split(":");

    const hours = Number(hoursText);
    const minutes = Number(minutesText);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return value;
    }

    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;

    return `${displayHour}:${String(minutes).padStart(
      2,
      "0"
    )} ${period}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 shadow-lg shadow-black/10 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            {title}
          </p>

          <p className="mt-2 break-words text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            {value}
          </p>

          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/10 text-cyan-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

function getBookingStatusClasses(status?: string) {
  switch (status) {
    case "Pending":
      return "border-amber-400/20 bg-amber-400/10 text-amber-700 dark:text-amber-300";

    case "Confirmed":
      return "border-blue-400/20 bg-blue-400/10 text-blue-700 dark:text-blue-300";

    case "Checked In":
      return "border-violet-400/20 bg-violet-400/10 text-violet-700 dark:text-violet-300";

    case "Charging":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-700 dark:text-cyan-300";

    case "Completed":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300";

    case "Cancelled":
    case "No Show":
      return "border-red-400/20 bg-red-400/10 text-red-700 dark:text-red-300";

    default:
      return "border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]";
  }
}

function getChargerStatusClasses(status?: string) {
  switch (status) {
    case "Available":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300";

    case "Booked":
      return "border-blue-400/20 bg-blue-400/10 text-blue-700 dark:text-blue-300";

    case "Charging":
    case "Occupied":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-700 dark:text-cyan-300";

    case "Maintenance":
      return "border-amber-400/20 bg-amber-400/10 text-amber-700 dark:text-amber-300";

    case "Offline":
      return "border-red-400/20 bg-red-400/10 text-red-700 dark:text-red-300";

    default:
      return "border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]";
  }
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
      <p className="min-w-0 text-sm text-[var(--text-secondary)]">
        {label}
      </p>

      <p className="shrink-0 text-sm font-semibold text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

export default function StaffDashboard() {
  const { user } = useAuth();

  const [station, setStation] = useState<Station | null>(
    null
  );

  const [chargers, setChargers] = useState<Charger[]>(
    []
  );

  const [bookings, setBookings] = useState<Booking[]>(
    []
  );

  const [sessions, setSessions] = useState<
    ChargingSession[]
  >([]);

  const [maintenance, setMaintenance] = useState<
    MaintenanceRecord[]
  >([]);

  const [users, setUsers] = useState<UserRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const assignedStationId =
    user?.assignedStationId || "";

  const fetchDashboardData = async () => {
    if (!assignedStationId) {
      setError(
        "No station is assigned to this staff account."
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        stationsResponse,
        chargersResponse,
        bookingsResponse,
        sessionsResponse,
        maintenanceResponse,
        usersResponse,
      ] = await Promise.all([
        api.get<Station[]>("/stations"),
        api.get<Charger[]>("/chargers"),
        api.get<Booking[]>("/bookings"),
        api.get<ChargingSession[]>(
          "/chargingSessions"
        ),
        api.get<MaintenanceRecord[]>(
          "/maintenance"
        ),
        api.get<UserRecord[]>("/users"),
      ]);

      const allStations =
        stationsResponse.data || [];

      const allChargers =
        chargersResponse.data || [];

      const allBookings =
        bookingsResponse.data || [];

      const allSessions =
        sessionsResponse.data || [];

      const allMaintenance =
        maintenanceResponse.data || [];

      const assignedStation =
        allStations.find(
          (item) =>
            item.stationId === assignedStationId ||
            item.id === assignedStationId
        ) || null;

      setStation(assignedStation);

      const stationMatches = (
        stationId?: string
      ) =>
        stationId === assignedStationId ||
        stationId === assignedStation?.id ||
        stationId === assignedStation?.stationId;

      setChargers(
        allChargers.filter((charger) =>
          stationMatches(charger.stationId)
        )
      );

      setBookings(
        allBookings.filter((booking) =>
          stationMatches(booking.stationId)
        )
      );

      setSessions(
        allSessions.filter((session) =>
          stationMatches(session.stationId)
        )
      );

      setMaintenance(
        allMaintenance.filter((record) =>
          stationMatches(record.stationId)
        )
      );

      setUsers(usersResponse.data || []);
    } catch (err) {
      console.error(
        "Failed to load staff dashboard:",
        err
      );

      setError(
        "Unable to load dashboard data. Please check JSON Server and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboardData();
  }, [assignedStationId]);

  const today = getTodayDate();

  const todayBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          normalizeDate(
            booking.bookingDate ||
              booking.createdDate
          ) === today
      ),
    [bookings, today]
  );

  const todaySessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          normalizeDate(
            session.startDate ||
              session.startTime ||
              session.createdDate
          ) === today
      ),
    [sessions, today]
  );

  const checkedInCustomers =
    todayBookings.filter(
      (booking) =>
        booking.status === "Checked In"
    ).length;

  const activeSessions = sessions.filter(
    (session) => session.status === "Charging"
  ).length;

  const completedTodaySessions =
    todaySessions.filter(
      (session) =>
        session.status === "Completed"
    ).length;

  const availableChargers =
    chargers.filter(
      (charger) =>
        charger.status === "Available"
    ).length;

  const occupiedChargers =
    chargers.filter(
      (charger) =>
        charger.status === "Booked" ||
        charger.status === "Charging" ||
        charger.status === "Occupied"
    ).length;

  const maintenanceChargers =
    chargers.filter(
      (charger) =>
        charger.status === "Maintenance"
    ).length;

  const openMaintenance =
    maintenance.filter(
      (record) =>
        record.status === "Reported" ||
        record.status === "Scheduled" ||
        record.status === "In Progress"
    );

  const getCustomerName = (
    booking: Booking
  ) => {
    const customerId =
      booking.userId || booking.customerId;

    const customer = users.find(
      (item) =>
        item.id === customerId ||
        item.userId === customerId
    );

    return customer?.name || "Customer";
  };

  const getChargerName = (
    chargerId?: string
  ) => {
    if (!chargerId) return "—";

    const charger = chargers.find(
      (item) =>
        item.id === chargerId ||
        item.chargerId === chargerId
    );

    return charger?.chargerId || chargerId;
  };

  const sortedTodayBookings = useMemo(
    () =>
      [...todayBookings].sort((a, b) =>
        (a.startTime || "").localeCompare(
          b.startTime || ""
        )
      ),
    [todayBookings]
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-cyan-700 dark:text-cyan-400" />

          <p className="text-sm text-[var(--text-secondary)]">
            Loading staff dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6 text-[var(--text-primary)]">
      <style>{`
        html.dark .staff-dashboard-banner {
          background-color: #0D1B2A !important;
          color: #FFFFFF !important;
        }

        html.dark .staff-dashboard-banner h1,
        html.dark .staff-dashboard-banner p,
        html.dark .staff-dashboard-banner span {
          color: #FFFFFF !important;
        }

        html.dark .staff-dashboard-banner .text-cyan-300 {
          color: #22D3EE !important;
        }
      `}</style>
      {/* Header */}
      <section className="staff-dashboard-banner rounded-2xl border border-[var(--border-primary)] bg-white p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
                Staff Operations
              </span>

              {station && (
                <span className="rounded-full border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                  {station.stationId}
                </span>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Staff Dashboard
            </h1>

            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Welcome, {user?.name || "Staff"}. Manage
              today's charging station operations.
            </p>

            {station && (
              <div className="mt-3 flex items-center gap-2 text-sm text-cyan-300">
                <MapPin className="h-4 w-4 shrink-0" />

                <span className="break-words">
                  {station.name}
                  {station.city
                    ? `, ${station.city}`
                    : ""}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              void fetchDashboardData()
            }
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white hover:text-black"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <section className="rounded-xl border border-red-400/20 bg-red-400/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />

            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-200">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  void fetchDashboardData()
                }
                className="mt-2 text-xs font-medium text-red-300 underline underline-offset-2 transition hover:text-[var(--text-primary)]"
              >
                Try again
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Statistics */}
      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Bookings"
          value={todayBookings.length}
          description="Bookings scheduled today"
          icon={
            <CalendarDays className="h-5 w-5" />
          }
        />

        <StatCard
          title="Checked In"
          value={checkedInCustomers}
          description="Customers ready to charge"
          icon={
            <UserCheck className="h-5 w-5" />
          }
        />

        <StatCard
          title="Active Sessions"
          value={activeSessions}
          description="Currently charging"
          icon={<Zap className="h-5 w-5" />}
        />

        <StatCard
          title="Completed Today"
          value={completedTodaySessions}
          description="Sessions completed today"
          icon={
            <CheckCircle2 className="h-5 w-5" />
          }
        />
      </section>

      {/* Station and charger overview */}
      <section className="grid min-w-0 gap-5 xl:grid-cols-2">
        {/* Assigned station */}
        <div className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Assigned Station
              </h2>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Your current station assignment.
              </p>
            </div>

            <MapPin className="h-5 w-5 shrink-0 text-cyan-700 dark:text-cyan-400" />
          </div>

          {station ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4">
                <p className="text-lg font-semibold text-[var(--text-primary)]">
                  {station.name}
                </p>

                <p className="mt-1 text-xs font-medium text-cyan-300">
                  {station.stationId}
                </p>

                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                  {[
                    station.address,
                    station.city,
                    station.state,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Address unavailable"}
                </p>
              </div>

              <SummaryItem
                label="Station Status"
                value={station.status || "—"}
              />

              <SummaryItem
                label="Operating Hours"
                value={
                  station.operatingHours || "—"
                }
              />

              <SummaryItem
                label="Total Chargers"
                value={chargers.length}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                Station information is unavailable.
              </p>
            </div>
          )}
        </div>

        {/* Charger overview */}
        <div className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Charger Overview
              </h2>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Current charger availability.
              </p>
            </div>

            <Zap className="h-5 w-5 shrink-0 text-cyan-700 dark:text-cyan-400" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryItem
              label="Total Chargers"
              value={chargers.length}
            />

            <SummaryItem
              label="Available"
              value={availableChargers}
            />

            <SummaryItem
              label="In Use"
              value={occupiedChargers}
            />

            <SummaryItem
              label="Maintenance"
              value={maintenanceChargers}
            />
          </div>

          <div className="mt-5 space-y-3">
            {chargers.length === 0 ? (
              <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5 text-center text-sm text-[var(--text-muted)]">
                No chargers found.
              </div>
            ) : (
              chargers.slice(0, 5).map((charger) => (
                <div
                  key={charger.id}
                  className="flex min-w-0 items-center justify-between gap-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                      <Zap className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {charger.chargerId}
                      </p>

                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {charger.chargerType ||
                          charger.connectorType ||
                          "EV Charger"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium ${getChargerStatusClasses(
                      charger.status
                    )}`}
                  >
                    {charger.status || "Unknown"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Today's bookings */}
      <section className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-primary)] p-5">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Today's Bookings
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Today's scheduled customer bookings.
            </p>
          </div>

          <CalendarDays className="h-5 w-5 shrink-0 text-cyan-700 dark:text-cyan-400" />
        </div>

        {sortedTodayBookings.length === 0 ? (
          <div className="p-5">
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-8 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-[var(--text-muted)]" />

              <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
                No bookings today
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Today's bookings will appear here.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[17%]" />
                  <col className="w-[22%]" />
                  <col className="w-[16%]" />
                  <col className="w-[17%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                </colgroup>

                <thead>
                  <tr className="border-b border-[var(--border-primary)]">
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Booking
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Customer
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Charger
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Time
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Status
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Slot
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border-primary)]">
                  {sortedTodayBookings.map(
                    (booking) => (
                      <tr
                        key={booking.id}
                        className="transition hover:bg-[var(--bg-secondary)]"
                      >
                        <td className="px-4 py-5">
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                            {booking.bookingId}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <p className="truncate text-sm text-[var(--text-secondary)]">
                            {getCustomerName(
                              booking
                            )}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <p className="truncate text-sm text-[var(--text-secondary)]">
                            {getChargerName(
                              booking.chargerId
                            )}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <Clock3 className="h-4 w-4 shrink-0 text-[var(--text-primary)]" />

                            <span className="truncate">
                              {formatTime(
                                booking.startTime
                              )}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-5">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${getBookingStatusClasses(
                              booking.status
                            )}`}
                          >
                            {booking.status ||
                              "Unknown"}
                          </span>
                        </td>

                        <td className="px-4 py-5 text-sm text-[var(--text-secondary)]">
                          {formatTime(
                            booking.endTime
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="grid gap-3 p-4 md:hidden">
              {sortedTodayBookings.map(
                (booking) => (
                  <div
                    key={booking.id}
                    className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                          {booking.bookingId}
                        </p>

                        <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                          {getCustomerName(booking)}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-medium ${getBookingStatusClasses(
                          booking.status
                        )}`}
                      >
                        {booking.status ||
                          "Unknown"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-[var(--border-primary)] bg-black/5 dark:bg-black/10 p-3">
                        <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                          Charger
                        </p>

                        <p className="mt-1 truncate text-xs font-medium text-[var(--text-primary)]">
                          {getChargerName(
                            booking.chargerId
                          )}
                        </p>
                      </div>

                      <div className="rounded-lg border border-[var(--border-primary)] bg-black/5 dark:bg-black/10 p-3">
                        <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                          Time
                        </p>

                        <p className="mt-1 text-xs font-medium text-[var(--text-primary)]">
                          {formatTime(
                            booking.startTime
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </section>

      {/* Active sessions + maintenance */}
      <section className="grid min-w-0 gap-5 xl:grid-cols-2">
        {/* Active sessions */}
        <div className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Active Charging Sessions
              </h2>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Sessions currently charging.
              </p>
            </div>

            <Zap className="h-5 w-5 shrink-0 text-cyan-700 dark:text-cyan-400" />
          </div>

          <div className="space-y-3">
            {sessions.filter(
              (session) =>
                session.status === "Charging"
            ).length === 0 ? (
              <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6 text-center">
                <p className="text-sm text-[var(--text-muted)]">
                  No active charging sessions.
                </p>
              </div>
            ) : (
              sessions
                .filter(
                  (session) =>
                    session.status === "Charging"
                )
                .slice(0, 5)
                .map((session) => (
                  <div
                    key={session.id}
                    className="flex min-w-0 items-center justify-between gap-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                        <Zap className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                          {session.sessionId}
                        </p>

                        <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                          {getChargerName(
                            session.chargerId
                          )}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-medium text-cyan-700 dark:text-cyan-300">
                      Charging
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Maintenance */}
        <div className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Maintenance & Issues
              </h2>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Open charger maintenance records.
              </p>
            </div>

            <Wrench className="h-5 w-5 shrink-0 text-amber-400" />
          </div>

          <div className="space-y-3">
            {openMaintenance.length === 0 ? (
              <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-6 text-center">
                <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-400" />

                <p className="mt-3 text-sm font-medium text-emerald-300">
                  No open maintenance issues
                </p>
              </div>
            ) : (
              openMaintenance
                .slice(0, 5)
                .map((record) => (
                  <div
                    key={record.id}
                    className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                          {record.maintenanceId}
                        </p>

                        <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                          {getChargerName(
                            record.chargerId
                          )}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                        {record.status ||
                          "Reported"}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--text-secondary)]">
                      {record.issue ||
                        record.issueDescription ||
                        record.description ||
                        "Maintenance issue"}
                    </p>

                    {record.priority && (
                      <p className="mt-2 text-[11px] font-medium text-[var(--text-muted)]">
                        Priority:{" "}
                        <span className="text-[var(--text-primary)]">
                          {record.priority}
                        </span>
                      </p>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}