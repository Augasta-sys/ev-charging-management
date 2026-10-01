import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Eye,
  Filter,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

type SessionStatus =
  | "Not Started"
  | "Charging"
  | "Paused"
  | "Completed"
  | "Cancelled";

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
  energyConsumed?: number;
  unitsConsumed?: number;
  chargingCost?: number;
  totalAmount?: number;
  amount?: number;
  status: SessionStatus;
  createdDate?: string;
}

interface UserRecord {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
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
  chargerType?: string;
  connectorType?: string;
  powerOutput?: number;
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
}

const sessionStatuses: SessionStatus[] = [
  "Not Started",
  "Charging",
  "Paused",
  "Completed",
  "Cancelled",
];

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value?: string) {
  if (!value) return "—";

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

function formatAmount(value?: number) {
  if (value === undefined || value === null) {
    return "—";
  }

  return `₹${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function getStatusClasses(status: SessionStatus) {
  switch (status) {
    case "Not Started":
      return "border-blue-400/20 bg-blue-400/10 text-blue-700 dark:text-blue-300";

    case "Charging":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-700 dark:text-cyan-300";

    case "Paused":
      return "border-amber-400/20 bg-amber-400/10 text-amber-700 dark:text-amber-300";

    case "Completed":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300";

    case "Cancelled":
      return "border-red-400/20 bg-red-400/10 text-red-700 dark:text-red-300";

    default:
      return "border-[var(--border-primary)] bg-[var(--bg-tertiary)] dark:border-white/10 dark:bg-white/5 text-[var(--text-secondary)]";
  }
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
    <div className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] dark:border-white/10 dark:bg-[#0D1B2A] p-4 shadow-lg shadow-black/10 sm:p-5">
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

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/10 text-cyan-700 dark:text-cyan-300">
          {icon}
        </div>
      </div>
    </div>
  );
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
      title={label}
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] dark:border-white/10 dark:bg-white/5 text-[var(--text-primary)] transition hover:bg-white hover:text-black"
    >
      {children}
    </button>
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
        className="h-11 w-full appearance-none rounded-xl border border-[var(--border-primary)] bg-[var(--card-bg)] dark:border-white/10 dark:bg-[#0D1B2A] px-4 pr-11 text-sm text-[var(--text-primary)] outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-[#0D1B2A] text-[var(--text-primary)]"
          >
            {option === "All" ? placeholder : option}
          </option>
        ))}
      </select>

      <svg
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-primary)]"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08.02l-4.25-4.51a.75.75 0 01.02-1.06z"
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
    <div className="min-w-0 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] dark:border-white/10 dark:bg-white/[0.02] p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-medium text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

export default function StaffSessions() {
  const { user } = useAuth();

  const [sessions, setSessions] = useState<
    ChargingSession[]
  >([]);

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [station, setStation] = useState<Station | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    "All" | SessionStatus
  >("All");

  const [dateFilter, setDateFilter] = useState("");

  const [viewSession, setViewSession] =
    useState<ChargingSession | null>(null);

  const assignedStationId =
    user?.assignedStationId || "";

  const today = getTodayDate();

  const fetchSessions = async () => {
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
        sessionsResponse,
        usersResponse,
        stationsResponse,
        chargersResponse,
        bookingsResponse,
      ] = await Promise.all([
        api.get<ChargingSession[]>(
          "/chargingSessions"
        ),
        api.get<UserRecord[]>("/users"),
        api.get<Station[]>("/stations"),
        api.get<Charger[]>("/chargers"),
        api.get<Booking[]>("/bookings"),
      ]);

      const allStations =
        stationsResponse.data || [];

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

      setSessions(
        (sessionsResponse.data || []).filter(
          (session) =>
            stationMatches(session.stationId)
        )
      );

      setChargers(
        (chargersResponse.data || []).filter(
          (charger) =>
            stationMatches(charger.stationId)
        )
      );

      setBookings(
        (bookingsResponse.data || []).filter(
          (booking) =>
            stationMatches(booking.stationId)
        )
      );

      setUsers(usersResponse.data || []);
    } catch (err) {
      console.error(
        "Failed to load staff charging sessions:",
        err
      );

      setError(
        "Unable to load charging sessions. Please check JSON Server and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSessions();
  }, [assignedStationId]);

  /*
   * Lock background/page scrolling while the popup is open.
   */
  useEffect(() => {
    if (!viewSession) return;

    const originalBodyOverflow =
      document.body.style.overflow;

    const originalHtmlOverflow =
      document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        originalBodyOverflow;

      document.documentElement.style.overflow =
        originalHtmlOverflow;
    };
  }, [viewSession]);

  const getBooking = (
    session: ChargingSession
  ) =>
    bookings.find(
      (booking) =>
        booking.id === session.bookingId ||
        booking.bookingId === session.bookingId
    );

  const getCustomer = (
    session: ChargingSession
  ) => {
    const booking = getBooking(session);

    const customerId =
      session.userId ||
      session.customerId ||
      booking?.userId ||
      booking?.customerId;

    return users.find(
      (item) =>
        item.id === customerId ||
        item.userId === customerId
    );
  };

  const getCharger = (
    session: ChargingSession
  ) =>
    chargers.find(
      (charger) =>
        charger.id === session.chargerId ||
        charger.chargerId === session.chargerId
    );

  const getSessionDate = (
    session: ChargingSession
  ) =>
    session.startDate ||
    getBooking(session)?.bookingDate ||
    session.createdDate ||
    "";

  const getEnergy = (
    session: ChargingSession
  ) =>
    Number(
      session.energyConsumed ??
        session.unitsConsumed ??
        0
    );

  const getCost = (
    session: ChargingSession
  ) =>
    Number(
      session.chargingCost ??
        session.totalAmount ??
        session.amount ??
        0
    );

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sessions
      .filter((session) => {
        const booking = bookings.find(
          (item) =>
            item.id === session.bookingId ||
            item.bookingId === session.bookingId
        );

        const customerId =
          session.userId ||
          session.customerId ||
          booking?.userId ||
          booking?.customerId;

        const customer = users.find(
          (item) =>
            item.id === customerId ||
            item.userId === customerId
        );

        const charger = chargers.find(
          (item) =>
            item.id === session.chargerId ||
            item.chargerId === session.chargerId
        );

        const searchableText = [
          session.sessionId,
          session.bookingId || "",
          booking?.bookingId || "",
          customer?.name || "",
          customer?.email || "",
          charger?.chargerId ||
            session.chargerId ||
            "",
          session.status,
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !query ||
          searchableText.includes(query);

        const matchesStatus =
          statusFilter === "All" ||
          session.status === statusFilter;

        const sessionDate =
          session.startDate ||
          booking?.bookingDate ||
          session.createdDate;

        const matchesDate =
          !dateFilter ||
          normalizeDate(sessionDate) ===
            dateFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesDate
        );
      })
      .sort((a, b) => {
        const dateA =
          a.startDate ||
          a.createdDate ||
          "";

        const dateB =
          b.startDate ||
          b.createdDate ||
          "";

        return dateB.localeCompare(dateA);
      });
  }, [
    sessions,
    bookings,
    users,
    chargers,
    search,
    statusFilter,
    dateFilter,
  ]);

  const todaySessions = sessions.filter(
    (session) =>
      normalizeDate(getSessionDate(session)) ===
      today
  ).length;

  const chargingSessions = sessions.filter(
    (session) =>
      session.status === "Charging"
  ).length;

  const pausedSessions = sessions.filter(
    (session) => session.status === "Paused"
  ).length;

  const completedSessions = sessions.filter(
    (session) =>
      session.status === "Completed"
  ).length;

  const totalEnergy = sessions.reduce(
    (total, session) =>
      total + getEnergy(session),
    0
  );

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setDateFilter("");
  };

  const updateSessionStatus = async (
    session: ChargingSession,
    status: SessionStatus
  ) => {
    try {
      setSaving(true);
      setError("");

      const updates: Partial<ChargingSession> = {
        status,
      };

      /*
       * Add a completion timestamp when the session
       * is marked completed and no end date exists.
       */
      if (
        status === "Completed" &&
        !session.endDate
      ) {
        updates.endDate = new Date().toISOString();
      }

      await api.patch(
        `/chargingSessions/${session.id}`,
        updates
      );

      /*
       * Keep the associated booking status synchronized.
       */
      const booking = getBooking(session);

      if (booking) {
        if (status === "Charging") {
          await api.patch(
            `/bookings/${booking.id}`,
            {
              status: "Charging",
            }
          );
        }

        if (status === "Completed") {
          await api.patch(
            `/bookings/${booking.id}`,
            {
              status: "Completed",
            }
          );
        }

        if (status === "Cancelled") {
          await api.patch(
            `/bookings/${booking.id}`,
            {
              status: "Cancelled",
            }
          );
        }
      }

      /*
       * Keep charger status synchronized with
       * the charging session.
       */
      const charger = getCharger(session);

      if (charger) {
        if (status === "Charging") {
          await api.patch(
            `/chargers/${charger.id}`,
            {
              status: "Charging",
            }
          );
        }

        if (
          status === "Completed" ||
          status === "Cancelled"
        ) {
          await api.patch(
            `/chargers/${charger.id}`,
            {
              status: "Available",
            }
          );
        }
      }

      setViewSession(null);

      await fetchSessions();
    } catch (err) {
      console.error(
        "Failed to update charging session:",
        err
      );

      setError(
        "Unable to update charging session status."
      );
    } finally {
      setSaving(false);
    }
  };

  const renderStatusActions = (
    session: ChargingSession
  ) => {
    return (
      <div className="flex flex-wrap gap-2">
        {session.status === "Not Started" && (
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void updateSessionStatus(
                session,
                "Charging"
              )
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 text-xs font-semibold text-cyan-700 dark:text-cyan-300 transition hover:bg-cyan-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlayCircle className="h-4 w-4" />
            Start Charging
          </button>
        )}

        {session.status === "Charging" && (
          <>
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void updateSessionStatus(
                  session,
                  "Paused"
                )
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 text-xs font-semibold text-amber-700 dark:text-amber-300 transition hover:bg-amber-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PauseCircle className="h-4 w-4" />
              Pause
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void updateSessionStatus(
                  session,
                  "Completed"
                )
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition hover:bg-emerald-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Complete
            </button>
          </>
        )}

        {session.status === "Paused" && (
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void updateSessionStatus(
                session,
                "Charging"
              )
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 text-xs font-semibold text-cyan-700 dark:text-cyan-300 transition hover:bg-cyan-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlayCircle className="h-4 w-4" />
            Resume
          </button>
        )}

        {(session.status === "Not Started" ||
          session.status === "Charging" ||
          session.status === "Paused") && (
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void updateSessionStatus(
                session,
                "Cancelled"
              )
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 text-xs font-semibold text-red-700 dark:text-red-300 transition hover:bg-red-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-cyan-400" />

          <p className="text-sm text-[var(--text-secondary)]">
            Loading charging sessions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-white/10 bg-white dark:bg-gradient-to-br dark:from-[#0D1B2A] dark:via-[#0B1726] dark:to-[#111A35] p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-700 dark:text-cyan-300">
                Staff Operations
              </span>

              {station && (
                <span className="rounded-full border border-[var(--border-primary)] bg-[var(--bg-tertiary)] dark:border-white/10 dark:bg-white/5 px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                  {station.stationId}
                </span>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Charging Sessions
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Monitor and manage charging sessions at
              your assigned station.
            </p>

            {station && (
              <p className="mt-2 text-sm font-medium text-cyan-700 dark:text-cyan-300">
                {station.name}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              void fetchSessions()
            }
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] dark:border-white/10 dark:bg-white/5 px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white hover:text-black"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700 dark:text-red-300" />

          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError("")}
              className="mt-1 text-xs text-red-700 dark:text-red-300 underline underline-offset-2 hover:text-black"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Statistics */}
      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Today's Sessions"
          value={todaySessions}
          description="Sessions scheduled today"
          icon={
            <CalendarDays className="h-5 w-5" />
          }
        />

        <StatCard
          title="Charging"
          value={chargingSessions}
          description="Currently charging"
          icon={<Zap className="h-5 w-5" />}
        />

        <StatCard
          title="Paused"
          value={pausedSessions}
          description="Temporarily paused"
          icon={
            <PauseCircle className="h-5 w-5" />
          }
        />

        <StatCard
          title="Completed"
          value={completedSessions}
          description="Completed sessions"
          icon={
            <CheckCircle2 className="h-5 w-5" />
          }
        />

        <StatCard
          title="Energy"
          value={`${totalEnergy.toFixed(1)} kWh`}
          description="Total energy consumed"
          icon={<Activity className="h-5 w-5" />}
        />
      </section>

      {/* Search & filters */}
      <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] dark:border-white/10 dark:bg-[#0D1B2A] p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Search & Filters
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Search by session, booking, customer or
              charger.
            </p>
          </div>

          {(search ||
            statusFilter !== "All" ||
            dateFilter) && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-cyan-400 transition hover:text-black"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-primary)]" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search sessions..."
              className="h-11 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--card-bg)] dark:border-white/10 dark:bg-[#0D1B2A] pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
            />
          </div>

          <FilterSelect
            value={statusFilter}
            onChange={(value) =>
              setStatusFilter(
                value as
                  | "All"
                  | SessionStatus
              )
            }
            options={[
              "All",
              ...sessionStatuses,
            ]}
            placeholder="All Statuses"
          />

          <div className="relative min-w-0">
            <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-primary)]" />

            <input
              type="date"
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(
                  event.target.value
                )
              }
              className="h-11 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--card-bg)] dark:border-white/10 dark:bg-[#0D1B2A] pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
            />
          </div>
        </div>
      </section>

      {/* Sessions */}
      <section className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] dark:border-white/10 dark:bg-[#0D1B2A]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-primary)] dark:border-white/10 p-5">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Charging Sessions
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Showing {filteredSessions.length} of{" "}
              {sessions.length} sessions
            </p>
          </div>

          <Filter className="h-5 w-5 shrink-0 text-cyan-400" />
        </div>

        {filteredSessions.length === 0 ? (
          <div className="p-6">
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] dark:border-white/10 dark:bg-white/[0.02] p-8 text-center">
              <Zap className="mx-auto h-8 w-8 text-slate-600" />

              <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
                No charging sessions found
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Try changing your search or filters.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[15%]" />
                  <col className="w-[14%]" />
                  <col className="w-[19%]" />
                  <col className="w-[14%]" />
                  <col className="w-[13%]" />
                  <col className="w-[10%]" />
                  <col className="w-[9%]" />
                  <col className="w-[6%]" />
                </colgroup>

                <thead>
                  <tr className="border-b border-[var(--border-primary)] dark:border-white/10">
                    <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Session
                    </th>

                    <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Booking
                    </th>

                    <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Customer
                    </th>

                    <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Charger
                    </th>

                    <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Date
                    </th>

                    <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Energy
                    </th>

                    <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Status
                    </th>

                    <th className="px-3 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border-primary)] dark:divide-y dark:divide-white/5">
                  {filteredSessions.map(
                    (session) => {
                      const booking =
                        getBooking(session);

                      const customer =
                        getCustomer(session);

                      const charger =
                        getCharger(session);

                      return (
                        <tr
                          key={session.id}
                          className="transition hover:bg-slate-100 dark:hover:bg-white/[0.02]"
                        >
                          <td className="px-3 py-5">
                            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                              {session.sessionId}
                            </p>
                          </td>

                          <td className="px-3 py-5">
                            <p className="truncate text-sm text-[var(--text-secondary)]">
                              {booking?.bookingId ||
                                session.bookingId ||
                                "—"}
                            </p>
                          </td>

                          <td className="px-3 py-5">
                            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                              {customer?.name ||
                                "Customer"}
                            </p>

                            <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                              {customer?.email ||
                                "—"}
                            </p>
                          </td>

                          <td className="px-3 py-5">
                            <p className="truncate text-sm text-[var(--text-secondary)]">
                              {charger?.chargerId ||
                                session.chargerId ||
                                "—"}
                            </p>
                          </td>

                          <td className="px-3 py-5">
                            <p className="text-sm text-[var(--text-secondary)]">
                              {formatDate(
                                getSessionDate(
                                  session
                                )
                              )}
                            </p>
                          </td>

                          <td className="px-3 py-5">
                            <p className="text-sm text-[var(--text-secondary)]">
                              {getEnergy(
                                session
                              ).toFixed(1)}{" "}
                              kWh
                            </p>
                          </td>

                          <td className="px-3 py-5">
                            <span
                              className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-medium ${getStatusClasses(
                                session.status
                              )}`}
                            >
                              {session.status}
                            </span>
                          </td>

                          <td className="px-3 py-5">
                            <div className="flex justify-end">
                              <ActionButton
                                label="View Session"
                                onClick={() =>
                                  setViewSession(
                                    session
                                  )
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </ActionButton>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="grid gap-3 p-4 md:hidden">
              {filteredSessions.map(
                (session) => {
                  const customer =
                    getCustomer(session);

                  const charger =
                    getCharger(session);

                  return (
                    <div
                      key={session.id}
                      className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] dark:border-white/10 dark:bg-white/[0.02] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                            {session.sessionId}
                          </p>

                          <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                            {customer?.name ||
                              "Customer"}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-medium ${getStatusClasses(
                            session.status
                          )}`}
                        >
                          {session.status}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <DetailItem
                          label="Charger"
                          value={
                            charger?.chargerId ||
                            session.chargerId ||
                            "—"
                          }
                        />

                        <DetailItem
                          label="Date"
                          value={formatDate(
                            getSessionDate(
                              session
                            )
                          )}
                        />

                        <DetailItem
                          label="Energy"
                          value={`${getEnergy(
                            session
                          ).toFixed(1)} kWh`}
                        />

                        <DetailItem
                          label="Cost"
                          value={formatAmount(
                            getCost(session)
                          )}
                        />
                      </div>

                      <div className="mt-4 flex justify-end">
                        <ActionButton
                          label="View Session"
                          onClick={() =>
                            setViewSession(
                              session
                            )
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </ActionButton>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}
      </section>

      {/* View popup */}
      {viewSession && (
        <div className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center overflow-hidden bg-black/70 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[var(--card-bg)] dark:bg-[#0D1A2A] shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-2rem)]">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-primary)] dark:border-white/10 px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Charging Session Details
                </h2>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {viewSession.sessionId}
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setViewSession(null)
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] dark:border-white/10 dark:bg-white/5 text-[var(--text-primary)] transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Popup body */}
            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
              <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
                <DetailItem
                  label="Session ID"
                  value={viewSession.sessionId}
                />

                <DetailItem
                  label="Status"
                  value={viewSession.status}
                />

                <DetailItem
                  label="Booking ID"
                  value={
                    getBooking(viewSession)
                      ?.bookingId ||
                    viewSession.bookingId ||
                    "—"
                  }
                />

                <DetailItem
                  label="Customer"
                  value={
                    getCustomer(viewSession)
                      ?.name || "Customer"
                  }
                />

                <DetailItem
                  label="Customer Email"
                  value={
                    getCustomer(viewSession)
                      ?.email || "—"
                  }
                />

                <DetailItem
                  label="Station"
                  value={station?.name || "—"}
                />

                <DetailItem
                  label="Charger"
                  value={
                    getCharger(viewSession)
                      ?.chargerId ||
                    viewSession.chargerId ||
                    "—"
                  }
                />

                <DetailItem
                  label="Charger Type"
                  value={
                    getCharger(viewSession)
                      ?.chargerType || "—"
                  }
                />

                <DetailItem
                  label="Connector"
                  value={
                    getCharger(viewSession)
                      ?.connectorType || "—"
                  }
                />

                <DetailItem
                  label="Date"
                  value={formatDate(
                    getSessionDate(viewSession)
                  )}
                />

                <DetailItem
                  label="Start Time"
                  value={formatTime(
                    viewSession.startTime
                  )}
                />

                <DetailItem
                  label="End Time"
                  value={formatTime(
                    viewSession.endTime
                  )}
                />

                <DetailItem
                  label="Energy Consumed"
                  value={`${getEnergy(
                    viewSession
                  ).toFixed(1)} kWh`}
                />

                <DetailItem
                  label="Charging Cost"
                  value={formatAmount(
                    getCost(viewSession)
                  )}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 flex-col gap-3 border-t border-white/10 bg-[var(--card-bg)] dark:bg-[#0D1A2A] px-4 py-4 sm:px-6">
              {renderStatusActions(
                viewSession
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    setViewSession(null)
                  }
                  className="h-10 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] dark:border-white/10 dark:bg-white/5 px-5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}