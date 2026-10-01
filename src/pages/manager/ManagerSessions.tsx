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

interface Booking {
  id: string;
  bookingId: string;
  stationId: string;
}

const sessionStatuses: SessionStatus[] = [
  "Not Started",
  "Charging",
  "Paused",
  "Completed",
  "Cancelled",
];

function getStatusClasses(status: SessionStatus) {
  switch (status) {
    case "Not Started":
      return "border-slate-400/20 bg-slate-400/10 text-[var(--text-secondary)]";
    case "Charging":
      return "border-violet-400/20 bg-violet-400/10 text-violet-300";
    case "Paused":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    case "Completed":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    case "Cancelled":
      return "border-red-400/20 bg-red-400/10 text-red-300";
    default:
      return "border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]";
  }
}

function getStatusIcon(status: SessionStatus) {
  switch (status) {
    case "Completed":
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "Cancelled":
      return <XCircle className="h-3.5 w-3.5" />;
    case "Charging":
      return <Zap className="h-3.5 w-3.5" />;
    case "Paused":
      return <Clock3 className="h-3.5 w-3.5" />;
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

function formatEnergy(value?: number) {
  if (value === undefined || value === null) return "0 kWh";

  return `${value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} kWh`;
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
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition hover:bg-[var(--text-primary)] hover:text-black"
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
  value: string | number;
  description: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 shadow-lg shadow-black/10 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            {label}
          </p>

          <p className="mt-2 truncate text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            {value}
          </p>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
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
        className="h-11 w-full appearance-none rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-4 pr-11 text-sm text-[var(--input-text)] outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-[var(--input-bg)] text-[var(--input-text)]"
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
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08.02z"
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
    <div className="min-w-0 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-medium text-[var(--text-primary)]">
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
    <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3">
      <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-medium text-[var(--text-secondary)]">
        {value}
      </p>
    </div>
  );
}

export default function ManagerSessions() {
  const { user } = useAuth();

  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [station, setStation] = useState<Station | null>(null);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | SessionStatus
  >("All");
  const [dateFilter, setDateFilter] = useState("");

  const [viewSession, setViewSession] =
    useState<ChargingSession | null>(null);

  const [savingStatus, setSavingStatus] = useState(false);

  const assignedStationId = user?.assignedStationId || "";

  const fetchSessions = async () => {
    if (!assignedStationId) {
      setError("No station is assigned to this manager.");
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
        api.get<ChargingSession[]>("/chargingSessions"),
        api.get<UserRecord[]>("/users"),
        api.get<Station[]>("/stations"),
        api.get<Charger[]>("/chargers"),
        api.get<Booking[]>("/bookings"),
      ]);

      const allSessions = sessionsResponse.data || [];
      const allUsers = usersResponse.data || [];
      const allStations = stationsResponse.data || [];
      const allChargers = chargersResponse.data || [];
      const allBookings = bookingsResponse.data || [];

      const assignedStation =
        allStations.find(
          (item) =>
            item.stationId === assignedStationId ||
            item.id === assignedStationId
        ) || null;

      setStation(assignedStation);
      setUsers(allUsers);

      setChargers(
        allChargers.filter(
          (charger) =>
            charger.stationId === assignedStationId ||
            charger.stationId === assignedStation?.id
        )
      );

      setBookings(allBookings);

      setSessions(
        allSessions.filter(
          (session) =>
            session.stationId === assignedStationId ||
            session.stationId === assignedStation?.id
        )
      );
    } catch (err) {
      console.error("Failed to load manager sessions:", err);
      setError("Unable to load charging sessions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSessions();
  }, [assignedStationId]);

  /*
   * Lock the complete background whenever the session popup is open.
   */
  useEffect(() => {
    if (!viewSession) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow =
      document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [viewSession]);

  const today = new Date().toISOString().split("T")[0];

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sessions.filter((session) => {
      const customer = users.find(
        (item) =>
          item.id === session.userId ||
          item.id === session.customerId ||
          item.userId === session.userId ||
          item.userId === session.customerId
      );

      const charger = chargers.find(
        (item) =>
          item.id === session.chargerId ||
          item.chargerId === session.chargerId
      );

      const booking = bookings.find(
        (item) =>
          item.id === session.bookingId ||
          item.bookingId === session.bookingId
      );

      const searchableText = [
        session.sessionId,
        session.bookingId,
        customer?.name || "",
        customer?.email || "",
        charger?.chargerId || "",
        session.chargerId || "",
        booking?.bookingId || "",
        session.status,
      ]
        .join(" ")
        .toLowerCase();

      const sessionDate =
        session.startDate ||
        session.endDate ||
        session.createdDate ||
        "";

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        session.status === statusFilter;

      const matchesDate =
        !dateFilter ||
        sessionDate.slice(0, 10) === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [
    sessions,
    users,
    chargers,
    bookings,
    search,
    statusFilter,
    dateFilter,
  ]);

  const todaySessions = sessions.filter((session) => {
    const date =
      session.startDate ||
      session.endDate ||
      session.createdDate ||
      "";

    return date.slice(0, 10) === today;
  });

const chargingSessions = sessions.filter(
  (session) => session.status === "Charging"
);

const pausedSessions = sessions.filter(
  (session) => session.status === "Paused"
);

const completedSessions = sessions.filter(
  (session) => session.status === "Completed"
);

const totalEnergy = sessions.reduce(
  (sum, session) =>
    sum +
    Number(
      session.energyConsumed ??
        session.unitsConsumed ??
        0
    ),
  0
);

  const totalRevenue = sessions.reduce(
    (sum, session) =>
      sum +
      Number(
        session.totalAmount ??
          session.chargingCost ??
          session.amount ??
          0
      ),
    0
  );

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setDateFilter("");
  };

  const getCustomer = (session: ChargingSession) =>
    users.find(
      (item) =>
        item.id === session.userId ||
        item.id === session.customerId ||
        item.userId === session.userId ||
        item.userId === session.customerId
    );

  const getCharger = (session: ChargingSession) =>
    chargers.find(
      (item) =>
        item.id === session.chargerId ||
        item.chargerId === session.chargerId
    );

  const getBooking = (session: ChargingSession) =>
    bookings.find(
      (item) =>
        item.id === session.bookingId ||
        item.bookingId === session.bookingId
    );

  const getSessionDate = (session: ChargingSession) =>
    session.startDate ||
    session.endDate ||
    session.createdDate ||
    "";

  const getEnergy = (session: ChargingSession) =>
    session.energyConsumed ?? session.unitsConsumed ?? 0;

  const getCost = (session: ChargingSession) =>
    session.totalAmount ??
    session.chargingCost ??
    session.amount ??
    0;

  const handleStatusChange = async (
    session: ChargingSession,
    status: SessionStatus
  ) => {
    try {
      setSavingStatus(true);
      setError("");

      await api.patch(`/chargingSessions/${session.id}`, {
        status,
      });

      setViewSession(null);

      await fetchSessions();
    } catch (err) {
      console.error("Failed to update session status:", err);
      setError("Unable to update session status.");
    } finally {
      setSavingStatus(false);
    }
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
      <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-300">
                Manager
              </span>

              {station && (
                <span className="rounded-full border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                  {station.stationId}
                </span>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Charging Sessions
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Monitor and manage charging sessions for your assigned
              station.
            </p>

            {station && (
              <p className="mt-2 text-sm font-medium text-cyan-300">
                {station.name}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => void fetchSessions()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--text-primary)] hover:text-black"
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
              className="mt-1 text-xs text-red-300 underline underline-offset-2 hover:text-[var(--text-primary)]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Primary stats */}
      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Today's Sessions"
          value={todaySessions.length}
          description="Sessions recorded today"
        />

        <StatCard
          icon={<Zap className="h-5 w-5" />}
          label="Charging"
          value={chargingSessions.length}
          description="Currently charging"
        />

        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Completed"
          value={completedSessions.length}
          description="Completed sessions"
        />

        <StatCard
          icon={<Clock3 className="h-5 w-5" />}
          label="Paused"
          value={pausedSessions.length}
          description="Paused sessions"
        />
      </section>

      {/* Secondary stats */}
      <section className="grid min-w-0 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Total Sessions
          </p>

          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            {sessions.length}
          </p>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            All sessions for this station
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Energy Consumed
          </p>

          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            {formatEnergy(totalEnergy)}
          </p>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Across recorded sessions
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Session Revenue
          </p>

          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            {formatAmount(totalRevenue)}
          </p>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Total charging session amount
          </p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Search & Filters
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Find sessions by session ID, customer, booking or charger.
            </p>
          </div>

          {(search || statusFilter !== "All" || dateFilter) && (
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

        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 !text-[var(--text-primary)]" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search sessions..."
              className="h-11 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] pl-11 pr-4 text-sm text-[var(--input-text)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
            />
          </div>

          <FilterSelect
            value={statusFilter}
            onChange={(value) =>
              setStatusFilter(value as "All" | SessionStatus)
            }
            options={["All", ...sessionStatuses]}
            placeholder="All Statuses"
          />

          <div className="relative min-w-0">
            <CalendarDays className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 !text-[var(--text-primary)]" />

            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-4 pl-11 text-sm text-[var(--input-text)] outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
                  />
          </div>
        </div>
      </section>

      {/* Sessions table */}
      <section className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-lg shadow-black/10">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-primary)] p-5">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Charging Sessions
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Showing {filteredSessions.length} of {sessions.length} sessions
            </p>
          </div>

          <Filter className="h-5 w-5 shrink-0 text-cyan-400" />
        </div>

        {filteredSessions.length === 0 ? (
          <div className="p-6">
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-8 text-center">
              <Zap className="mx-auto h-8 w-8 text-[var(--text-muted)]" />

              <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
                No charging sessions found
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Try changing your search or filter selections.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[14%]" />
                  <col className="w-[17%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                  <col className="w-[13%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                </colgroup>

                <thead>
                  <tr className="border-b border-[var(--border-primary)] text-left">
                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Session ID
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Customer
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Charger
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Date & Time
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Energy
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Status
                    </th>

                    <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border-primary)]">
                  {filteredSessions.map((session) => {
                    const customer = getCustomer(session);
                    const charger = getCharger(session);

                    return (
                      <tr
                        key={session.id}
                        className="transition hover:bg-[var(--bg-tertiary)]"
                      >
                        <td className="px-4 py-5">
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                            {session.sessionId}
                          </p>

                          <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                            {session.bookingId || "No booking"}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                              <User className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                                {customer?.name || "Unknown customer"}
                              </p>

                              <p className="truncate text-xs text-[var(--text-muted)]">
                                {customer?.email || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-5">
                          <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                            {charger?.chargerId ||
                              session.chargerId ||
                              "—"}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <div className="flex items-start gap-2">
                            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-primary)]" />

                            <div className="min-w-0">
                              <p className="truncate text-sm text-[var(--text-secondary)]">
                                {formatDate(getSessionDate(session))}
                              </p>

                              <p className="mt-1 text-xs text-[var(--text-muted)]">
                                {formatTime(session.startTime)} -{" "}
                                {formatTime(session.endTime)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-5">
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {formatEnergy(getEnergy(session))}
                          </p>

                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            {formatAmount(getCost(session))}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <span
                            className={`manager-session-status inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                              session.status
                            )}`}
                          >
                            {getStatusIcon(session.status)}
                            {session.status}
                          </span>
                        </td>

                        <td className="px-4 py-5">
                          <div className="flex items-center justify-end">
                            <ActionButton
                              label="View Session"
                              onClick={() => setViewSession(session)}
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

            {/* Mobile cards */}
            <div className="grid gap-3 p-4 md:hidden">
              {filteredSessions.map((session) => {
                const customer = getCustomer(session);
                const charger = getCharger(session);

                return (
                  <div
                    key={session.id}
                    className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                          {session.sessionId}
                        </p>

                        <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                          {customer?.name || "Unknown customer"}
                        </p>
                      </div>

                      <span
                        className={`manager-session-status inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium ${getStatusClasses(
                          session.status
                        )}`}
                      >
                        {session.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <MobileDetail
                        label="Charger"
                        value={
                          charger?.chargerId ||
                          session.chargerId ||
                          "—"
                        }
                      />

                      <MobileDetail
                        label="Date"
                        value={formatDate(getSessionDate(session))}
                      />

                      <MobileDetail
                        label="Energy"
                        value={formatEnergy(getEnergy(session))}
                      />

                      <MobileDetail
                        label="Amount"
                        value={formatAmount(getCost(session))}
                      />
                    </div>

                    <div className="mt-4 flex justify-end">
                      <ActionButton
                        label="View Session"
                        onClick={() => setViewSession(session)}
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

      {/* View session popup */}
      {viewSession && (
        <div className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center overflow-hidden bg-black/70 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex h-auto max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-2rem)]">
            {/* Popup header */}
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-primary)] px-4 py-4 sm:px-6">
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
                onClick={() => setViewSession(null)}
                disabled={savingStatus}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition hover:bg-[var(--text-primary)] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Popup content */}
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
                  label="Customer"
                  value={
                    getCustomer(viewSession)?.name ||
                    "Unknown customer"
                  }
                />

                <DetailItem
                  label="Customer Email"
                  value={
                    getCustomer(viewSession)?.email || "—"
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
                    getCharger(viewSession)?.chargerId ||
                    viewSession.chargerId ||
                    "—"
                  }
                />

                <DetailItem
                  label="Booking"
                  value={
                    getBooking(viewSession)?.bookingId ||
                    viewSession.bookingId ||
                    "—"
                  }
                />

                <DetailItem
                  label="Start Date"
                  value={formatDate(viewSession.startDate)}
                />

                <DetailItem
                  label="Start Time"
                  value={formatTime(viewSession.startTime)}
                />

                <DetailItem
                  label="End Date"
                  value={formatDate(viewSession.endDate)}
                />

                <DetailItem
                  label="End Time"
                  value={formatTime(viewSession.endTime)}
                />

                <DetailItem
                  label="Energy Consumed"
                  value={formatEnergy(getEnergy(viewSession))}
                />

                <DetailItem
                  label="Charging Cost"
                  value={formatAmount(
                    viewSession.chargingCost
                  )}
                />

                <DetailItem
                  label="Total Amount"
                  value={formatAmount(getCost(viewSession))}
                />

                <DetailItem
                  label="Created Date"
                  value={formatDate(viewSession.createdDate)}
                />
              </div>
            </div>

            {/* Popup actions */}
            <div className="flex shrink-0 flex-col gap-3 border-t border-[var(--border-primary)] bg-[var(--card-bg)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex flex-wrap gap-2">
                {viewSession.status === "Not Started" && (
                  <button
                    type="button"
                    disabled={savingStatus}
                    onClick={() =>
                      void handleStatusChange(
                        viewSession,
                        "Charging"
                      )
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-violet-400/10 px-4 text-xs font-semibold text-violet-300 transition hover:bg-violet-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Zap className="h-4 w-4" />
                    Start Charging
                  </button>
                )}

                {viewSession.status === "Charging" && (
                  <>
                    <button
                      type="button"
                      disabled={savingStatus}
                      onClick={() =>
                        void handleStatusChange(
                          viewSession,
                          "Paused"
                        )
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 text-xs font-semibold text-amber-300 transition hover:bg-amber-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Clock3 className="h-4 w-4" />
                      Pause
                    </button>

                    <button
                      type="button"
                      disabled={savingStatus}
                      onClick={() =>
                        void handleStatusChange(
                          viewSession,
                          "Completed"
                        )
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Complete
                    </button>
                  </>
                )}

                {viewSession.status === "Paused" && (
                  <button
                    type="button"
                    disabled={savingStatus}
                    onClick={() =>
                      void handleStatusChange(
                        viewSession,
                        "Charging"
                      )
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-violet-400/10 px-4 text-xs font-semibold text-violet-300 transition hover:bg-violet-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Zap className="h-4 w-4" />
                    Resume
                  </button>
                )}

                {(viewSession.status === "Not Started" ||
                  viewSession.status === "Charging" ||
                  viewSession.status === "Paused") && (
                  <button
                    type="button"
                    disabled={savingStatus}
                    onClick={() =>
                      void handleStatusChange(
                        viewSession,
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
                onClick={() => setViewSession(null)}
                className="h-10 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--text-primary)] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
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