import type { ElementType, ReactNode } from "react";
import {
  BatteryCharging,
  CalendarDays,
  CheckCircle2,
  Clock3,
  IndianRupee,
  Search,
  Trash2,
  UserRound,
  X,
  Zap,
  Eye,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

/* =========================================================
   TYPES
========================================================= */

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

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
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
  chargerType?: string;
  connectorType?: string;
  powerOutput?: number;
}

/* =========================================================
   CONSTANTS
========================================================= */

const sessionStatuses: SessionStatus[] = [
  "Not Started",
  "Charging",
  "Paused",
  "Completed",
  "Cancelled",
];

/* =========================================================
   COMPONENT
========================================================= */

function ChargingSessions() {
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [chargers, setChargers] = useState<Charger[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [viewSession, setViewSession] =
    useState<ChargingSession | null>(null);

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
    if (viewSession || deleteId) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [viewSession, deleteId]);

  /* =======================================================
     FETCH DATA
  ======================================================= */

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        sessionsResponse,
        usersResponse,
        stationsResponse,
        chargersResponse,
      ] = await Promise.all([
        api.get("/chargingSessions"),
        api.get("/users"),
        api.get("/stations"),
        api.get("/chargers"),
      ]);

      setSessions(sessionsResponse.data);
      setUsers(usersResponse.data);
      setStations(stationsResponse.data);
      setChargers(chargersResponse.data);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load charging session data. Please make sure JSON Server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     HELPERS
  ======================================================= */

  const getUser = (session: ChargingSession) => {
    const userId =
      session.userId ?? session.customerId;

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
    session: ChargingSession
  ) => {
    return (
      getUser(session)?.name ??
      "Unknown Customer"
    );
  };

  const getCustomerEmail = (
    session: ChargingSession
  ) => {
    return getUser(session)?.email ?? "";
  };

  const getStation = (stationId?: string) => {
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
    return getStation(stationId)?.city ?? "";
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

  const getEnergy = (
    session: ChargingSession
  ) => {
    return Number(
      session.energyConsumed ??
        session.unitsConsumed ??
        0
    );
  };

  const getAmount = (
    session: ChargingSession
  ) => {
    return Number(
      session.chargingCost ??
        session.totalAmount ??
        session.amount ??
        0
    );
  };

  const formatDate = (
    date?: string
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

  const formatDateTime = (
    date?: string,
    time?: string
  ) => {
    if (!date && !time) {
      return "—";
    }

    if (date && time) {
      return `${formatDate(date)} ${formatTime(time)}`;
    }

    return date
      ? formatDate(date)
      : formatTime(time);
  };

  const formatTime = (
    time?: string
  ) => {
    if (!time) {
      return "—";
    }

    const parts = time.split(":");

    if (parts.length < 2) {
      return time;
    }

    const hour = Number(parts[0]);
    const minutes = parts[1];

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
    const activeStatuses: SessionStatus[] = [
      "Not Started",
      "Charging",
      "Paused",
    ];

    const chargingCount = sessions.filter(
      (session) =>
        session.status === "Charging"
    ).length;

    const activeCount = sessions.filter(
      (session) =>
        activeStatuses.includes(
          session.status
        )
    ).length;

    const completedCount = sessions.filter(
      (session) =>
        session.status === "Completed"
    ).length;

    const today = new Date()
      .toISOString()
      .split("T")[0];

    const todayCount = sessions.filter(
      (session) =>
        session.startDate === today ||
        session.createdDate?.startsWith(today)
    ).length;

    const energy = sessions.reduce(
      (sum, session) =>
        sum + getEnergy(session),
      0
    );

    const revenue = sessions
      .filter(
        (session) =>
          session.status === "Completed"
      )
      .reduce(
        (sum, session) =>
          sum + getAmount(session),
        0
      );

    return {
      total: sessions.length,
      active: activeCount,
      charging: chargingCount,
      completed: completedCount,
      today: todayCount,
      energy,
      revenue,
    };
  }, [sessions]);

  /* =======================================================
     FILTERED SESSIONS
  ======================================================= */

  const filteredSessions = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return sessions
      .filter((session) => {
        const customer =
          getCustomerName(session).toLowerCase();

        const email =
          getCustomerEmail(session).toLowerCase();

        const station =
          getStationName(
            session.stationId
          ).toLowerCase();

        const charger =
          getChargerName(
            session.chargerId
          ).toLowerCase();

        const sessionId =
          session.sessionId.toLowerCase();

        const bookingId =
          session.bookingId
            ?.toLowerCase() ?? "";

        const matchesSearch =
          !query ||
          sessionId.includes(query) ||
          bookingId.includes(query) ||
          customer.includes(query) ||
          email.includes(query) ||
          station.includes(query) ||
          charger.includes(query);

        const matchesStation =
          !stationFilter ||
          session.stationId ===
            stationFilter;

        const matchesStatus =
          !statusFilter ||
          session.status ===
            statusFilter;

        const matchesDate =
          !dateFilter ||
          session.startDate ===
            dateFilter ||
          session.endDate ===
            dateFilter;

        return (
          matchesSearch &&
          matchesStation &&
          matchesStatus &&
          matchesDate
        );
      })
      .sort((a, b) =>
        `${a.startDate ?? ""}${a.startTime ?? ""}`.localeCompare(
          `${b.startDate ?? ""}${b.startTime ?? ""}`
        )
      );
  }, [
    sessions,
    users,
    stations,
    chargers,
    search,
    stationFilter,
    statusFilter,
    dateFilter,
  ]);

  /* =======================================================
     UPDATE STATUS
  ======================================================= */

  const handleStatusChange = async (
    session: ChargingSession,
    status: SessionStatus
  ) => {
    try {
      setError("");

      const response =
        await api.patch<ChargingSession>(
          `/chargingSessions/${session.id}`,
          {
            status,
          }
        );

      setSessions((previous) =>
        previous.map((item) =>
          item.id === session.id
            ? response.data
            : item
        )
      );

      setSuccess(
        `${session.sessionId} is now ${status}.`
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to update charging session status."
      );
    }
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/chargingSessions/${deleteId}`
      );

      setSessions((previous) =>
        previous.filter(
          (item) =>
            item.id !== deleteId
        )
      );

      setDeleteId(null);

      setSuccess(
        "Charging session deleted successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to delete charging session."
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
            <BatteryCharging className="h-6 w-6 animate-pulse text-cyan-400" />
          </div>

          <p className="text-sm text-[var(--text-secondary)]">
            Loading charging sessions...
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
            <BatteryCharging className="h-4 w-4 !text-[var(--text-primary)]" />
            Charging Management
          </div>

          <h1 className="truncate text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            Charging Sessions
          </h1>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Monitor and manage active and completed charging sessions.
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

      {/* STATS */}

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total Sessions"
          value={stats.total}
          description="All charging sessions"
          icon={BatteryCharging}
          iconClass="text-cyan-400"
          iconBg="bg-cyan-400/10"
        />

        <StatCard
          title="Active Sessions"
          value={stats.active}
          description="Currently active"
          icon={Zap}
          iconClass="text-emerald-400"
          iconBg="bg-emerald-400/10"
        />

        <StatCard
          title="Charging Now"
          value={stats.charging}
          description="Currently charging"
          icon={BatteryCharging}
          iconClass="text-violet-400"
          iconBg="bg-violet-400/10"
        />

        <StatCard
          title="Today's Sessions"
          value={stats.today}
          description="Sessions started today"
          icon={CalendarDays}
          iconClass="text-cyan-400"
          iconBg="bg-cyan-400/10"
        />

      </div>

      {/* SECONDARY STATS */}

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

        <StatCard
          title="Completed Sessions"
          value={stats.completed}
          description="Successfully completed"
          icon={CheckCircle2}
          iconClass="text-emerald-400"
          iconBg="bg-emerald-400/10"
        />

        <StatCard
          title="Energy Consumed"
          value={`${stats.energy.toFixed(2)} kWh`}
          description="Total energy consumed"
          icon={Zap}
          iconClass="text-amber-400"
          iconBg="bg-amber-400/10"
        />

        <StatCard
          title="Charging Revenue"
          value={`₹${stats.revenue.toFixed(2)}`}
          description="Completed session revenue"
          icon={IndianRupee}
          iconClass="text-cyan-400"
          iconBg="bg-cyan-400/10"
        />

      </div>

      {/* SEARCH & FILTERS */}

      <section className="mt-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 sm:p-5">

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Search & Filters
            </h2>

            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Find sessions by customer, station, date or status.
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

          {/* SEARCH */}

          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 !text-[var(--text-primary)]" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search sessions..."
              className="input-field !pl-11"
            />
          </div>

          {/* STATION */}

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

          {/* DATE */}

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

          {/* STATUS */}

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

            {sessionStatuses.map(
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
        <p className="text-xs text-[var(--text-secondary)]">
          Showing{" "}
          <span className="font-semibold text-[var(--text-secondary)]">
            {filteredSessions.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-[var(--text-secondary)]">
            {sessions.length}
          </span>{" "}
          charging sessions
        </p>
      </div>

      {/* DESKTOP TABLE */}

      <div className="mt-4 hidden w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] lg:block">

        <table className="w-full table-fixed border-collapse">

          <colgroup>
            <col className="w-[12%]" />
            <col className="w-[16%]" />
            <col className="w-[17%]" />
            <col className="w-[14%]" />
            <col className="w-[15%]" />
            <col className="w-[10%]" />
            <col className="w-[16%]" />
          </colgroup>

          <thead>
            <tr className="border-b border-[var(--border-primary)] text-left">

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] xl:px-4">
                Session ID
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] xl:px-4">
                Customer
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] xl:px-4">
                Station
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] xl:px-4">
                Charger
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] xl:px-4">
                Start / End
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] xl:px-4">
                Status
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] xl:px-4">
                Actions
              </th>

            </tr>
          </thead>

          <tbody>

            {filteredSessions.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-16 text-center"
                >
                  <BatteryCharging className="mx-auto h-8 w-8 text-[var(--text-muted)]" />

                  <p className="mt-3 text-sm font-medium text-[var(--text-secondary)]">
                    No charging sessions found
                  </p>

                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Try changing your search or filters.
                  </p>
                </td>
              </tr>
            ) : (
              filteredSessions.map(
                (session) => (
                  <tr
                    key={session.id}
                    className="border-b border-[var(--border-primary)] last:border-b-0 transition-colors hover:bg-[var(--bg-tertiary)]"
                  >

                    {/* SESSION ID */}

                    <td className="px-3 py-5 align-middle xl:px-4">
                      <div className="flex min-w-0 items-center gap-2">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
                          <BatteryCharging className="h-4 w-4 !text-[var(--text-primary)]" />
                        </div>

                        <span
                          className="truncate text-sm font-semibold text-[var(--text-primary)]"
                          title={session.sessionId}
                        >
                          {session.sessionId}
                        </span>

                      </div>
                    </td>

                    {/* CUSTOMER */}

                    <td className="px-3 py-5 align-middle xl:px-4">
                      <div className="min-w-0">

                        <div className="flex min-w-0 items-center gap-2">
                          <UserRound className="h-4 w-4 shrink-0 !text-[var(--text-primary)]" />

                          <p
                            className="truncate text-sm font-semibold text-[var(--text-primary)]"
                            title={getCustomerName(session)}
                          >
                            {getCustomerName(session)}
                          </p>
                        </div>

                        <p className="mt-1 truncate pl-6 text-[11px] text-[var(--text-secondary)]">
                          {getCustomerEmail(session)}
                        </p>

                      </div>
                    </td>

                    {/* STATION */}

                    <td className="px-3 py-5 align-middle xl:px-4">
                      <div className="min-w-0">

                        <p
                          className="truncate text-sm font-semibold text-[var(--text-primary)]"
                          title={getStationName(session.stationId)}
                        >
                          {getStationName(session.stationId)}
                        </p>

                        <p className="mt-1 truncate text-[11px] text-[var(--text-secondary)]">
                          {getStationCity(session.stationId)}
                        </p>

                      </div>
                    </td>

                    {/* CHARGER */}

                    <td className="px-3 py-5 align-middle xl:px-4">
                      <div className="flex min-w-0 items-center gap-2">

                        <Zap className="h-4 w-4 shrink-0 !text-[var(--text-primary)]" />

                        <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                          {getChargerName(
                            session.chargerId
                          )}
                        </span>

                      </div>
                    </td>

                    {/* START / END */}

                    <td className="px-3 py-5 align-middle xl:px-4">
                      <div className="min-w-0">

                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 shrink-0 !text-[var(--text-primary)]" />

                          <span className="truncate text-xs font-medium text-[var(--text-primary)]">
                            {formatDateTime(
                              session.startDate,
                              session.startTime
                            )}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-2">
                          <Clock3 className="h-4 w-4 shrink-0 !text-[var(--text-primary)]" />

                          <span className="truncate text-[11px] text-[var(--text-secondary)]">
                            {session.endDate || session.endTime
                              ? formatDateTime(
                                  session.endDate ??
                                    session.startDate,
                                  session.endTime
                                )
                              : "In progress"}
                          </span>
                        </div>

                      </div>
                    </td>

                    {/* STATUS */}

                    <td className="px-3 py-5 pl-5 align-middle xl:px-4 xl:pl-6">
                      <StatusBadge
                        status={session.status}
                      />
                    </td>

                    {/* ACTIONS */}

                    <td className="px-3 py-5 align-middle xl:px-4">
                      <div className="flex items-center gap-2">

                        <ActionButton
                          label="View session"
                          onClick={() =>
                            setViewSession(session)
                          }
                        >
                          <Eye className="h-4 w-4 !text-[var(--text-primary)]" />
                        </ActionButton>

                        {session.status ===
                          "Not Started" && (
                          <ActionButton
                            label="Start charging"
                            onClick={() =>
                              void handleStatusChange(
                                session,
                                "Charging"
                              )
                            }
                            className="hover:border-emerald-400/30 hover:bg-emerald-400/10"
                          >
                            <Zap className="h-4 w-4 !text-[var(--text-primary)]" />
                          </ActionButton>
                        )}

                        {session.status ===
                          "Charging" && (
                          <ActionButton
                            label="Complete session"
                            onClick={() =>
                              void handleStatusChange(
                                session,
                                "Completed"
                              )
                            }
                            className="hover:border-emerald-400/30 hover:bg-emerald-400/10"
                          >
                            <CheckCircle2 className="h-4 w-4 !text-[var(--text-primary)]" />
                          </ActionButton>
                        )}

                        {session.status !==
                          "Completed" &&
                          session.status !==
                            "Cancelled" && (
                            <ActionButton
                              label="Cancel session"
                              onClick={() =>
                                void handleStatusChange(
                                  session,
                                  "Cancelled"
                                )
                              }
                              className="hover:border-red-400/30 hover:bg-red-400/10"
                            >
                              <X className="h-4 w-4 !text-[var(--text-primary)]" />
                            </ActionButton>
                          )}

                        <ActionButton
                          label="Delete session"
                          onClick={() =>
                            setDeleteId(
                              session.id
                            )
                          }
                          className="hover:border-red-400/30 hover:bg-red-400/10"
                        >
                          <Trash2 className="h-4 w-4 !text-[var(--text-primary)]" />
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

      {/* MOBILE CARDS */}

      <section className="mt-4 grid gap-4 lg:hidden">

        {filteredSessions.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] px-5 py-14 text-center">

            <BatteryCharging className="mx-auto h-8 w-8 text-[var(--text-muted)]" />

            <p className="mt-3 text-sm font-medium text-[var(--text-secondary)]">
              No charging sessions found
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Try changing your search or filters.
            </p>

          </div>
        ) : (
          filteredSessions.map(
            (session) => (
              <div
                key={session.id}
                className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 transition hover:border-cyan-400/20"
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                      <BatteryCharging className="h-5 w-5 !text-[var(--text-primary)]" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                        {session.sessionId}
                      </p>

                      <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
                        {getCustomerName(session)}
                      </p>
                    </div>

                  </div>

                  <StatusBadge
                    status={session.status}
                  />

                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">

                  <InfoItem
                    label="Station"
                    value={getStationName(
                      session.stationId
                    )}
                  />

                  <InfoItem
                    label="Charger"
                    value={getChargerName(
                      session.chargerId
                    )}
                    icon={
                      <Zap className="h-3.5 w-3.5 !text-[var(--text-primary)]" />
                    }
                  />

                  <InfoItem
                    label="Start"
                    value={formatDateTime(
                      session.startDate,
                      session.startTime
                    )}
                    icon={
                      <CalendarDays className="h-3.5 w-3.5 !text-[var(--text-primary)]" />
                    }
                  />

                  <InfoItem
                    label="Energy"
                    value={`${getEnergy(session).toFixed(2)} kWh`}
                    icon={
                      <Zap className="h-3.5 w-3.5 !text-[var(--text-primary)]" />
                    }
                  />

                  <InfoItem
                    label="Amount"
                    value={`₹${getAmount(session).toFixed(2)}`}
                    icon={
                      <IndianRupee className="h-3.5 w-3.5 !text-[var(--text-primary)]" />
                    }
                  />

                  <InfoItem
                    label="Booking"
                    value={
                      session.bookingId ??
                      "Not linked"
                    }
                  />

                </div>

                <div className="mt-5 flex items-center justify-end gap-1 border-t border-[var(--border-primary)] pt-4">

                  <ActionButton
                    label="View session"
                    onClick={() =>
                      setViewSession(session)
                    }
                  >
                    <Eye className="h-4 w-4 !text-[var(--text-primary)]" />
                  </ActionButton>

                  {session.status ===
                    "Not Started" && (
                    <ActionButton
                      label="Start charging"
                      onClick={() =>
                        void handleStatusChange(
                          session,
                          "Charging"
                        )
                      }
                      className="hover:border-emerald-400/30 hover:bg-emerald-400/10"
                    >
                      <Zap className="h-4 w-4 !text-[var(--text-primary)]" />
                    </ActionButton>
                  )}

                  {session.status ===
                    "Charging" && (
                    <ActionButton
                      label="Complete session"
                      onClick={() =>
                        void handleStatusChange(
                          session,
                          "Completed"
                        )
                      }
                      className="hover:border-emerald-400/30 hover:bg-emerald-400/10"
                    >
                      <CheckCircle2 className="h-4 w-4 !text-[var(--text-primary)]" />
                    </ActionButton>
                  )}

                  {session.status !==
                    "Completed" &&
                    session.status !==
                      "Cancelled" && (
                      <ActionButton
                        label="Cancel session"
                        onClick={() =>
                          void handleStatusChange(
                            session,
                            "Cancelled"
                          )
                        }
                        className="hover:border-red-400/30 hover:bg-red-400/10"
                      >
                        <X className="h-4 w-4 !text-[var(--text-primary)]" />
                      </ActionButton>
                    )}

                  <ActionButton
                    label="Delete session"
                    onClick={() =>
                      setDeleteId(session.id)
                    }
                    className="hover:border-red-400/30 hover:bg-red-400/10"
                  >
                    <Trash2 className="h-4 w-4 !text-[var(--text-primary)]" />
                  </ActionButton>

                </div>

              </div>
            )
          )
        )}

      </section>

      {/* =====================================================
          VIEW SESSION MODAL
      ===================================================== */}

      {viewSession && (
        <div className="fixed inset-0 z-[100] flex min-h-0 items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4">

          <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-2rem)]">

            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-primary)] px-5 py-4 sm:px-6">

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  Charging Session
                </p>

                <h2 className="mt-1 truncate text-lg font-bold text-[var(--text-primary)]">
                  {viewSession.sessionId}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewSession(null)
                }
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition hover:bg-white hover:text-slate-950"
              >
                <X className="h-4 w-4" />
              </button>

            </div>

            {/* DETAILS */}

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden p-4 sm:grid-cols-2 sm:gap-4 sm:p-5">

              <DetailItem
                label="Customer"
                value={getCustomerName(
                  viewSession
                )}
              />

              <DetailItem
                label="Email"
                value={
                  getCustomerEmail(
                    viewSession
                  ) || "—"
                }
              />

              <DetailItem
                label="Station"
                value={getStationName(
                  viewSession.stationId
                )}
              />

              <DetailItem
                label="City"
                value={
                  getStationCity(
                    viewSession.stationId
                  ) || "—"
                }
              />

              <DetailItem
                label="Charger"
                value={getChargerName(
                  viewSession.chargerId
                )}
              />

              <DetailItem
                label="Booking ID"
                value={
                  viewSession.bookingId ??
                  "—"
                }
              />

              <DetailItem
                label="Start"
                value={formatDateTime(
                  viewSession.startDate,
                  viewSession.startTime
                )}
              />

              <DetailItem
                label="End"
                value={
                  viewSession.endDate ||
                  viewSession.endTime
                    ? formatDateTime(
                        viewSession.endDate ??
                          viewSession.startDate,
                        viewSession.endTime
                      )
                    : "In progress"
                }
              />

              <DetailItem
                label="Energy Consumed"
                value={`${getEnergy(
                  viewSession
                ).toFixed(2)} kWh`}
              />

              <DetailItem
                label="Charging Cost"
                value={`₹${getAmount(
                  viewSession
                ).toFixed(2)}`}
              />

              <DetailItem
                label="Status"
                value={viewSession.status}
              />

            </div>

            {/* FOOTER */}

            <div className="flex shrink-0 justify-end border-t border-[var(--border-primary)] px-5 py-4 sm:px-6">

              <button
                type="button"
                onClick={() =>
                  setViewSession(null)
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
              Delete Charging Session?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              This charging session will be permanently removed from the system. This action cannot be undone.
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
                className="h-11 rounded-xl bg-red-500 px-5 text-sm font-bold text-white transition hover:bg-red-400"
              >
                Delete Session
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

        html.dark input[type="date"].input-field,
        html.dark select.input-field {
          color-scheme: dark;
        }

        html.light input[type="date"].input-field,
        html.light select.input-field {
          color-scheme: light;
        }

        html.dark input[type="date"].input-field::-webkit-calendar-picker-indicator {
          filter: brightness(0) invert(1) !important;
          opacity: 1 !important;
          cursor: pointer;
        }

        html.light input[type="date"].input-field::-webkit-calendar-picker-indicator {
          filter: none !important;
          opacity: 1 !important;
          cursor: pointer;
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
          <p className="truncate text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
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
  status: SessionStatus;
}

function StatusBadge({
  status,
}: StatusBadgeProps) {
  const statusStyles: Record<
    SessionStatus,
    string
  > = {
    "Not Started":
      "border-slate-400/20 bg-slate-400/10 text-[var(--text-secondary)]",

    Charging:
      "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",

    Paused:
      "border-amber-400/20 bg-amber-400/10 text-amber-300",

    Completed:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",

    Cancelled:
      "border-red-400/20 bg-red-400/10 text-red-300",
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
        hover:bg-white/10
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

        <p
          className="truncate text-xs font-medium text-[var(--text-secondary)]"
          title={value}
        >
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

      <p
        className="mt-2 truncate text-sm font-medium text-[var(--text-primary)]"
        title={value}
      >
        {value}
      </p>

    </div>
  );
}

export default ChargingSessions;