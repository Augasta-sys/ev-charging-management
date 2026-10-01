import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BatteryCharging,
  Eye,
  RefreshCw,
  Search,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

/* =========================
   TYPES
========================= */

type SessionStatus =
  | "Not Started"
  | "Charging"
  | "Paused"
  | "Completed"
  | "Cancelled";

interface Station {
  id: string;
  stationId?: string;
  stationCode?: string;
  stationName: string;
  address?: string;
  city?: string;
  state?: string;
}

interface Charger {
  id: string;
  chargerId?: string;
  stationId: string;
  chargerNumber?: string;
  chargerType?: string;
  connectorType?: string;
  powerOutput?: number;
  pricePerKwh?: number;
  status?: string;
}

interface Vehicle {
  id: string;
  vehicleId?: string;
  customerId?: string;
  userId?: string;
  vehicleNumber?: string;
  brand?: string;
  model?: string;
  connectorType?: string;
}

interface Booking {
  id: string;
  bookingId?: string;
  customerId?: string;
  userId?: string;
  vehicleId?: string;
  stationId?: string;
  chargerId?: string;
  bookingDate?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
}

interface ChargingSession {
  id: string;
  sessionId?: string;
  bookingId?: string;
  customerId?: string;
  userId?: string;
  vehicleId?: string;
  stationId?: string;
  chargerId?: string;

  startTime?: string;
  endTime?: string;

  startDateTime?: string;
  endDateTime?: string;

  energyConsumed?: number;
  pricePerKwh?: number;

  totalCost?: number;
  amount?: number;

  status?: SessionStatus | string;
  createdDate?: string;
}

/* =========================
   HELPERS
========================= */

function normalizeDate(value?: string) {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(
    parsed.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    parsed.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value?: string) {
  const normalized = normalizeDate(value);

  if (!normalized) return "—";

  const [year, month, day] = normalized
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value?: string) {
  if (!value) return "—";

  /*
   * Full ISO/date-time value
   */
  if (
    value.includes("T") ||
    value.includes(" ")
  ) {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString(
        "en-IN",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    }
  }

  /*
   * HH:mm value
   */
  const parts = value.split(":");

  if (parts.length < 2) {
    return value;
  }

  const hour = Number(parts[0]);
  const minute = Number(parts[1]);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return value;
  }

  const period =
    hour >= 12 ? "PM" : "AM";

  const displayHour =
    hour % 12 || 12;

  return `${displayHour}:${String(
    minute
  ).padStart(2, "0")} ${period}`;
}

function formatDateTime(value?: string) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(value?: number) {
  return `₹${Number(
    value || 0
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatEnergy(value?: number) {
  return `${Number(
    value || 0
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} kWh`;
}

function getStatusClasses(
  status?: string
) {
  switch (status) {
    case "Not Started":
      return "border-slate-400/20 bg-slate-400/10 text-[var(--text-secondary)]";

    case "Charging":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";

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

/* =========================
   COMPONENT
========================= */

export default function CustomerSessions() {
  const { user } = useAuth();

  const customerId =
    user?.id || "";

  const [
    sessions,
    setSessions,
  ] = useState<ChargingSession[]>([]);

  const [
    bookings,
    setBookings,
  ] = useState<Booking[]>([]);

  const [
    stations,
    setStations,
  ] = useState<Station[]>([]);

  const [
    chargers,
    setChargers,
  ] = useState<Charger[]>([]);

  const [
    vehicles,
    setVehicles,
  ] = useState<Vehicle[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [
    viewSession,
    setViewSession,
  ] =
    useState<ChargingSession | null>(
      null
    );

  /* =========================
     FETCH
  ========================= */

  const fetchData = async () => {
    if (!customerId) {
      setLoading(false);

      setError(
        "Unable to identify the logged-in customer."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        sessionsResponse,
        bookingsResponse,
        stationsResponse,
        chargersResponse,
        vehiclesResponse,
      ] = await Promise.all([
        api.get<ChargingSession[]>(
          "/chargingSessions"
        ),

        api.get<Booking[]>(
          "/bookings"
        ),

        api.get<Station[]>(
          "/stations"
        ),

        api.get<Charger[]>(
          "/chargers"
        ),

        api.get<Vehicle[]>(
          "/vehicles"
        ),
      ]);

      const allBookings =
        bookingsResponse.data || [];

      const customerBookings =
        allBookings.filter(
          (booking) =>
            booking.customerId ===
              customerId ||
            booking.userId ===
              customerId
        );

      const customerBookingIds =
        customerBookings
          .flatMap((booking) => [
            booking.id,
            booking.bookingId,
          ])
          .filter(
            (value): value is string =>
              Boolean(value)
          );

      const customerSessions = (
        sessionsResponse.data || []
      ).filter((session) => {
        const directCustomerMatch =
          session.customerId ===
            customerId ||
          session.userId === customerId;

        const bookingMatch =
          Boolean(
            session.bookingId
          ) &&
          customerBookingIds.includes(
            session.bookingId as string
          );

        return (
          directCustomerMatch ||
          bookingMatch
        );
      });

      setSessions(customerSessions);
      setBookings(customerBookings);

      setStations(
        stationsResponse.data || []
      );

      setChargers(
        chargersResponse.data || []
      );

      setVehicles(
        (
          vehiclesResponse.data || []
        ).filter(
          (vehicle) =>
            vehicle.customerId ===
              customerId ||
            vehicle.userId ===
              customerId
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load charging sessions. Please make sure JSON Server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [customerId]);

  /* =========================
     POPUP LOCK
  ========================= */

  useEffect(() => {
    if (!viewSession) return;

    const bodyOverflow =
      document.body.style.overflow;

    const htmlOverflow =
      document.documentElement.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    document.documentElement.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        bodyOverflow;

      document.documentElement.style.overflow =
        htmlOverflow;
    };
  }, [viewSession]);

  /* =========================
     LOOKUPS
  ========================= */

  const getBooking = (
    value?: string
  ) => {
    if (!value) return undefined;

    return bookings.find(
      (booking) =>
        booking.id === value ||
        booking.bookingId === value
    );
  };

  const getStation = (
    value?: string
  ) => {
    if (!value) return undefined;

    return stations.find(
      (station) =>
        station.id === value ||
        station.stationId === value ||
        station.stationCode === value
    );
  };

  const getCharger = (
    value?: string
  ) => {
    if (!value) return undefined;

    return chargers.find(
      (charger) =>
        charger.id === value ||
        charger.chargerId === value
    );
  };

  const getVehicle = (
    value?: string
  ) => {
    if (!value) return undefined;

    return vehicles.find(
      (vehicle) =>
        vehicle.id === value ||
        vehicle.vehicleId === value
    );
  };

  const resolveBooking = (
    session: ChargingSession
  ) =>
    getBooking(session.bookingId);

  const resolveStation = (
    session: ChargingSession
  ) => {
    const booking =
      resolveBooking(session);

    return getStation(
      session.stationId ||
        booking?.stationId
    );
  };

  const resolveCharger = (
    session: ChargingSession
  ) => {
    const booking =
      resolveBooking(session);

    return getCharger(
      session.chargerId ||
        booking?.chargerId
    );
  };

  const resolveVehicle = (
    session: ChargingSession
  ) => {
    const booking =
      resolveBooking(session);

    return getVehicle(
      session.vehicleId ||
        booking?.vehicleId
    );
  };

  const getSessionDate = (
    session: ChargingSession
  ) => {
    const booking =
      resolveBooking(session);

    return (
      normalizeDate(
        session.startDateTime
      ) ||
      normalizeDate(
        booking?.bookingDate ||
          booking?.date
      ) ||
      normalizeDate(
        session.createdDate
      )
    );
  };

  const getSessionStartTime = (
    session: ChargingSession
  ) => {
    const booking =
      resolveBooking(session);

    return (
      session.startTime ||
      session.startDateTime ||
      booking?.startTime
    );
  };

  const getSessionEndTime = (
    session: ChargingSession
  ) => {
    const booking =
      resolveBooking(session);

    return (
      session.endTime ||
      session.endDateTime ||
      booking?.endTime
    );
  };

  const getSessionPrice = (
    session: ChargingSession
  ) => {
    if (
      session.pricePerKwh !==
      undefined
    ) {
      return Number(
        session.pricePerKwh || 0
      );
    }

    return Number(
      resolveCharger(session)
        ?.pricePerKwh || 0
    );
  };

  const getSessionCost = (
    session: ChargingSession
  ) => {
    if (
      session.totalCost !==
      undefined
    ) {
      return Number(
        session.totalCost || 0
      );
    }

    if (
      session.amount !== undefined
    ) {
      return Number(
        session.amount || 0
      );
    }

    return (
      Number(
        session.energyConsumed || 0
      ) *
      getSessionPrice(session)
    );
  };

  /* =========================
     FILTERING
  ========================= */

  const filteredSessions =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      return sessions
        .filter((session) => {
          const booking =
            resolveBooking(session);

          const station =
            resolveStation(session);

          const charger =
            resolveCharger(session);

          const vehicle =
            resolveVehicle(session);

          const text = [
            session.sessionId,
            session.id,
            session.bookingId,
            booking?.bookingId,
            station?.stationName,
            station?.stationCode,
            charger?.chargerId,
            charger?.chargerNumber,
            vehicle?.vehicleNumber,
            vehicle?.brand,
            vehicle?.model,
            session.status,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !query ||
            text.includes(query);

          const matchesStatus =
            statusFilter === "All" ||
            session.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        })
        .sort((a, b) => {
          const dateA =
            getSessionDate(a);

          const dateB =
            getSessionDate(b);

          return dateB.localeCompare(
            dateA
          );
        });
    }, [
      sessions,
      search,
      statusFilter,
      bookings,
      stations,
      chargers,
      vehicles,
    ]);

  /* =========================
     STATS
  ========================= */

  const activeSessions =
    sessions.filter(
      (session) =>
        session.status ===
          "Charging" ||
        session.status === "Paused"
    ).length;

  const completedSessions =
    sessions.filter(
      (session) =>
        session.status ===
        "Completed"
    ).length;

  const totalEnergy =
    sessions.reduce(
      (total, session) =>
        total +
        Number(
          session.energyConsumed || 0
        ),
      0
    );

  const totalCost =
    sessions.reduce(
      (total, session) =>
        total +
        getSessionCost(session),
      0
    );

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-cyan-400" />

          <p className="text-sm text-[var(--text-secondary)]">
            Loading charging
            sessions...
          </p>
        </div>
      </div>
    );
  }

  /* =========================
     UI
  ========================= */

  return (
    <div className="w-full min-w-0 space-y-6">
      <style>{`
        .customer-sessions-banner { background: #ffffff; }
        html.dark .customer-sessions-banner { background: linear-gradient(135deg, #0D1B2A 0%, #0B1726 52%, #111A35 100%); }
        .customer-sessions-input, .customer-sessions-select { color: var(--input-text); }
        html.dark .customer-sessions-input, html.dark .customer-sessions-select { color-scheme: dark; }
        html.light .customer-sessions-input, html.light .customer-sessions-select { color-scheme: light; }
        html.dark .customer-sessions-select option { background: #0D1B2A; color: #ffffff; }
        html.light .customer-sessions-select option { background: #ffffff; color: #000000; }
        html.light .customer-sessions-status { color: #334155 !important; }
      `}</style>

      {/* HEADER */}

      <section className="customer-sessions-banner rounded-2xl border border-[var(--border-primary)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
              Customer Portal
            </span>

            <h1 className="mt-3 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
              Charging Sessions
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
              View your active and
              completed EV charging
              sessions, energy usage and
              charging cost.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void fetchData()
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white hover:text-black"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      {/* ERROR */}

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
          <p className="text-sm text-red-200">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X className="h-4 w-4 text-red-300" />
          </button>
        </div>
      )}

      {/* STATS */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                Total Sessions
              </p>

              <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
                {sessions.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-400/10">
              <Activity className="h-5 w-5 text-violet-300" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                Active Sessions
              </p>

              <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
                {activeSessions}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10">
              <BatteryCharging className="h-5 w-5 text-cyan-300" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                Energy Consumed
              </p>

              <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
                {Number(
                  totalEnergy.toFixed(2)
                )}
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                kWh
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10">
              <Zap className="h-5 w-5 text-amber-300" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                Charging Cost
              </p>

              <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
                {formatAmount(
                  totalCost
                )}
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {completedSessions}{" "}
                completed
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10">
              <span className="text-xl font-bold text-emerald-300">
                ₹
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FILTERS */}

      <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-primary)]" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search session, station, charger or vehicle..."
              className="customer-sessions-input h-11 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] pl-11 pr-4 text-sm text-[var(--input-text)] outline-none placeholder:text-[var(--text-muted)] focus:border-cyan-400/50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="customer-sessions-select h-11 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-4 text-sm text-[var(--input-text)] outline-none"
          >
            <option value="All">
              All Statuses
            </option>

            <option value="Not Started">
              Not Started
            </option>

            <option value="Charging">
              Charging
            </option>

            <option value="Paused">
              Paused
            </option>

            <option value="Completed">
              Completed
            </option>

            <option value="Cancelled">
              Cancelled
            </option>
          </select>
        </div>
      </section>

      {/* SESSION HISTORY */}

      <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)]">
        <div className="border-b border-[var(--border-primary)] p-5">
          <h2 className="font-semibold text-[var(--text-primary)]">
            Charging History
          </h2>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {filteredSessions.length}{" "}
            session
            {filteredSessions.length ===
            1
              ? ""
              : "s"}{" "}
            found
          </p>
        </div>

        {filteredSessions.length ===
        0 ? (
          <div className="p-10 text-center">
            <BatteryCharging className="mx-auto h-10 w-10 text-[var(--text-muted)]" />

            <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
              No charging sessions
              found
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Your charging sessions
              will appear here after a
              booking is checked in and
              charging begins.
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP */}

            <div className="hidden md:block">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[13%]" />
                  <col className="w-[19%]" />
                  <col className="w-[13%]" />
                  <col className="w-[14%]" />
                  <col className="w-[13%]" />
                  <col className="w-[11%]" />
                  <col className="w-[10%]" />
                  <col className="w-[7%]" />
                </colgroup>

                <thead>
                  <tr className="border-b border-[var(--border-primary)]">
                    {[
                      "Session",
                      "Station",
                      "Vehicle",
                      "Date",
                      "Energy",
                      "Cost",
                      "Status",
                      "Action",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-3 py-4 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {filteredSessions.map(
                    (session) => {
                      const station =
                        resolveStation(
                          session
                        );

                      const vehicle =
                        resolveVehicle(
                          session
                        );

                      return (
                        <tr
                          key={
                            session.id
                          }
                          className="transition hover:bg-[var(--bg-tertiary)]"
                        >
                          <td className="px-3 py-5">
                            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                              {session.sessionId ||
                                session.id}
                            </p>

                            <p className="mt-1 truncate text-[10px] text-[var(--text-muted)]">
                              {session.bookingId ||
                                "—"}
                            </p>
                          </td>

                          <td className="px-3 py-5">
                            <p className="truncate text-sm text-[var(--text-primary)]">
                              {station?.stationName ||
                                "—"}
                            </p>
                          </td>

                          <td className="px-3 py-5">
                            <p className="truncate text-sm text-[var(--text-secondary)]">
                              {vehicle?.vehicleNumber ||
                                "—"}
                            </p>
                          </td>

                          <td className="px-3 py-5 text-sm text-[var(--text-secondary)]">
                            {formatDate(
                              getSessionDate(
                                session
                              )
                            )}
                          </td>

                          <td className="px-3 py-5 text-sm text-[var(--text-secondary)]">
                            {formatEnergy(
                              session.energyConsumed
                            )}
                          </td>

                          <td className="px-3 py-5 text-sm font-medium text-[var(--text-primary)]">
                            {formatAmount(
                              getSessionCost(
                                session
                              )
                            )}
                          </td>

                          <td className="px-3 py-5">
                            <span
                              className={`customer-sessions-status inline-flex rounded-full border px-2 py-1 text-[10px] font-medium ${getStatusClasses(
                                session.status
                              )}`}
                            >
                              {session.status ||
                                "—"}
                            </span>
                          </td>

                          <td className="px-3 py-5">
                            <button
                              type="button"
                              title="View Session"
                              onClick={() =>
                                setViewSession(
                                  session
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition hover:bg-white hover:text-black"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}

            <div className="grid gap-3 p-4 md:hidden">
              {filteredSessions.map(
                (session) => {
                  const station =
                    resolveStation(
                      session
                    );

                  const vehicle =
                    resolveVehicle(
                      session
                    );

                  return (
                    <div
                      key={session.id}
                      className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                            {session.sessionId ||
                              session.id}
                          </p>

                          <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                            {station?.stationName ||
                              "—"}
                          </p>
                        </div>

                        <span
                          className={`customer-sessions-status shrink-0 rounded-full border px-2 py-1 text-[10px] ${getStatusClasses(
                            session.status
                          )}`}
                        >
                          {session.status ||
                            "—"}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <DetailItem
                          label="Vehicle"
                          value={
                            vehicle?.vehicleNumber ||
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
                          value={formatEnergy(
                            session.energyConsumed
                          )}
                        />

                        <DetailItem
                          label="Cost"
                          value={formatAmount(
                            getSessionCost(
                              session
                            )
                          )}
                        />
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setViewSession(
                              session
                            )
                          }
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 text-xs font-medium text-[var(--text-primary)] transition hover:bg-white hover:text-black"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}
      </section>

      {/* =========================
          VIEW SESSION POPUP
      ========================= */}

      {viewSession && (
        <div className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center overflow-hidden bg-black/75 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-2rem)]">
            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--border-primary)] px-4 py-4 sm:px-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">
                  Charging Session
                </p>

                <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                  {viewSession.sessionId ||
                    viewSession.id}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewSession(null)
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition hover:bg-white hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* CONTENT */}

            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              {(() => {
                const booking =
                  resolveBooking(
                    viewSession
                  );

                const station =
                  resolveStation(
                    viewSession
                  );

                const charger =
                  resolveCharger(
                    viewSession
                  );

                const vehicle =
                  resolveVehicle(
                    viewSession
                  );

                return (
                  <div className="space-y-5">
                    {/* STATUS */}

                    <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">
                          Current Status
                        </p>

                        <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                          Charging session
                          details
                        </p>
                      </div>

                      <span
                        className={`customer-sessions-status inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusClasses(
                          viewSession.status
                        )}`}
                      >
                        {viewSession.status ||
                          "—"}
                      </span>
                    </div>

                    {/* GENERAL */}

                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                        Session Information
                      </h3>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <DetailItem
                          label="Session ID"
                          value={
                            viewSession.sessionId ||
                            viewSession.id
                          }
                        />

                        <DetailItem
                          label="Booking ID"
                          value={
                            viewSession.bookingId ||
                            booking?.bookingId ||
                            booking?.id ||
                            "—"
                          }
                        />

                        <DetailItem
                          label="Date"
                          value={formatDate(
                            getSessionDate(
                              viewSession
                            )
                          )}
                        />

                        <DetailItem
                          label="Start Time"
                          value={
                            viewSession.startDateTime
                              ? formatDateTime(
                                  viewSession.startDateTime
                                )
                              : formatTime(
                                  getSessionStartTime(
                                    viewSession
                                  )
                                )
                          }
                        />

                        <DetailItem
                          label="End Time"
                          value={
                            viewSession.endDateTime
                              ? formatDateTime(
                                  viewSession.endDateTime
                                )
                              : formatTime(
                                  getSessionEndTime(
                                    viewSession
                                  )
                                )
                          }
                        />

                        <DetailItem
                          label="Status"
                          value={
                            viewSession.status ||
                            "—"
                          }
                        />
                      </div>
                    </div>

                    {/* STATION / CHARGER */}

                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                        Charging Location
                      </h3>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <DetailItem
                          label="Station"
                          value={
                            station?.stationName ||
                            "—"
                          }
                        />

                        <DetailItem
                          label="Station Code"
                          value={
                            station?.stationCode ||
                            "—"
                          }
                        />

                        <DetailItem
                          label="City"
                          value={
                            station?.city ||
                            "—"
                          }
                        />

                        <DetailItem
                          label="Charger"
                          value={
                            charger?.chargerNumber ||
                            charger?.chargerId ||
                            charger?.id ||
                            "—"
                          }
                        />

                        <DetailItem
                          label="Charger Type"
                          value={
                            charger?.chargerType ||
                            "—"
                          }
                        />

                        <DetailItem
                          label="Connector"
                          value={
                            charger?.connectorType ||
                            "—"
                          }
                        />

                        <DetailItem
                          label="Power Output"
                          value={
                            charger?.powerOutput !==
                            undefined
                              ? `${charger.powerOutput} kW`
                              : "—"
                          }
                        />

                        <DetailItem
                          label="Price / kWh"
                          value={formatAmount(
                            getSessionPrice(
                              viewSession
                            )
                          )}
                        />
                      </div>
                    </div>

                    {/* VEHICLE */}

                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                        Vehicle
                      </h3>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <DetailItem
                          label="Vehicle Number"
                          value={
                            vehicle?.vehicleNumber ||
                            "—"
                          }
                        />

                        <DetailItem
                          label="Brand"
                          value={
                            vehicle?.brand ||
                            "—"
                          }
                        />

                        <DetailItem
                          label="Model"
                          value={
                            vehicle?.model ||
                            "—"
                          }
                        />

                        <DetailItem
                          label="Connector"
                          value={
                            vehicle?.connectorType ||
                            "—"
                          }
                        />
                      </div>
                    </div>

                    {/* USAGE */}

                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                        Usage & Cost
                      </h3>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <DetailItem
                          label="Energy Consumed"
                          value={formatEnergy(
                            viewSession.energyConsumed
                          )}
                        />

                        <DetailItem
                          label="Price / kWh"
                          value={formatAmount(
                            getSessionPrice(
                              viewSession
                            )
                          )}
                        />

                        <DetailItem
                          label="Total Cost"
                          value={formatAmount(
                            getSessionCost(
                              viewSession
                            )
                          )}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* FOOTER */}

            <div className="flex shrink-0 justify-end border-t border-[var(--border-primary)] px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={() =>
                  setViewSession(null)
                }
                className="h-10 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white hover:text-black"
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