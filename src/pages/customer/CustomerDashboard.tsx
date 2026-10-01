import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  MapPin,
  RefreshCw,
  Search,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

interface Station {
  id: string;
  stationId: string;
  name: string;
  stationCode?: string;
  address?: string;
  city?: string;
  state?: string;
  status?: string;
  openingTime?: string;
  closingTime?: string;
}

interface Charger {
  id: string;
  chargerId: string;
  stationId: string;
  chargerNumber?: string;
  chargerType?: string;
  connectorType?: string;
  powerOutput?: number;
  pricePerKwh?: number;
  status?: string;
}

interface Booking {
  id: string;
  bookingId: string;
  userId?: string;
  customerId?: string;
  stationId: string;
  chargerId?: string;
  slotId?: string;
  vehicleId?: string;
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  estimatedCost?: number;
  status?: string;
  createdDate?: string;
}

interface ChargingSession {
  id: string;
  sessionId: string;
  bookingId?: string;
  userId?: string;
  customerId?: string;
  vehicleId?: string;
  stationId: string;
  chargerId?: string;
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
  energyConsumed?: number;
  unitsConsumed?: number;
  chargingDuration?: number;
  cost?: number;
  chargingCost?: number;
  totalAmount?: number;
  status?: string;
  createdDate?: string;
}

interface Payment {
  id: string;
  paymentId: string;
  bookingId?: string;
  userId?: string;
  customerId?: string;
  amount?: number;
  paymentDate?: string;
  paymentMethod?: string;
  status?: string;
}

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
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function getBookingStatusClasses(status?: string) {
  switch (status) {
    case "Pending":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "Confirmed":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    case "Checked In":
      return "border-violet-400/20 bg-violet-400/10 text-violet-300";

    case "Charging":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";

    case "Completed":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "Cancelled":
    case "No Show":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    default:
      return "border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]";
  }
}

function getSessionStatusClasses(status?: string) {
  switch (status) {
    case "Charging":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";

    case "Paused":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "Completed":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "Cancelled":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    case "Not Started":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    default:
      return "border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]";
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
    <div className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 shadow-lg shadow-black/10 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            {title}
          </p>

          <p className="mt-2 break-words text-2xl font-bold text-[var(--text-primary)] sm:text-3xl dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
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

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stations, setStations] = useState<Station[]>([]);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const customerId = user?.id || "";

  const fetchDashboardData = async () => {
    if (!customerId) {
      setError("Unable to identify the logged-in customer.");
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
        paymentsResponse,
      ] = await Promise.all([
        api.get<Station[]>("/stations"),
        api.get<Charger[]>("/chargers"),
        api.get<Booking[]>("/bookings"),
        api.get<ChargingSession[]>("/chargingSessions"),
        api.get<Payment[]>("/payments"),
      ]);

      const allStations = stationsResponse.data || [];
      const allChargers = chargersResponse.data || [];
      const allBookings = bookingsResponse.data || [];
      const allSessions = sessionsResponse.data || [];
      const allPayments = paymentsResponse.data || [];

      /*
       * Customers must only see their own records.
       */
      const ownBookings = allBookings.filter(
        (booking) =>
          booking.userId === customerId ||
          booking.customerId === customerId
      );

      const ownBookingIds = new Set(
        ownBookings.flatMap((booking) => [
          booking.id,
          booking.bookingId,
        ])
      );

      const ownSessions = allSessions.filter(
        (session) =>
          session.userId === customerId ||
          session.customerId === customerId ||
          (session.bookingId
            ? ownBookingIds.has(session.bookingId)
            : false)
      );

      const ownPayments = allPayments.filter(
        (payment) =>
          payment.userId === customerId ||
          payment.customerId === customerId ||
          (payment.bookingId
            ? ownBookingIds.has(payment.bookingId)
            : false)
      );

      setStations(allStations);
      setChargers(allChargers);
      setBookings(ownBookings);
      setSessions(ownSessions);
      setPayments(ownPayments);
    } catch (err) {
      console.error(
        "Failed to load customer dashboard:",
        err
      );

      setError(
        "Unable to load your dashboard. Please check JSON Server and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboardData();
  }, [customerId]);

  const getStation = (stationId?: string) =>
    stations.find(
      (station) =>
        station.id === stationId ||
        station.stationId === stationId
    );

  const getCharger = (chargerId?: string) =>
    chargers.find(
      (charger) =>
        charger.id === chargerId ||
        charger.chargerId === chargerId
    );

  const today = getTodayDate();

  /*
   * Stations available to customers.
   * A station must be active and contain at least
   * one charger that can currently be selected.
   */
  const availableStations = useMemo(() => {
    return stations.filter((station) => {
      if (station.status !== "Active") {
        return false;
      }

      return chargers.some(
        (charger) =>
          (charger.stationId === station.id ||
            charger.stationId === station.stationId) &&
          charger.status === "Available"
      );
    });
  }, [stations, chargers]);

  /*
   * Upcoming booking:
   * Pending/Confirmed/Checked In bookings today or later.
   */
  const upcomingBookings = useMemo(() => {
    return bookings
      .filter((booking) => {
        const bookingDate = normalizeDate(
          booking.bookingDate
        );

        const validStatus =
          booking.status === "Pending" ||
          booking.status === "Confirmed" ||
          booking.status === "Checked In";

        return (
          validStatus &&
          bookingDate &&
          bookingDate >= today
        );
      })
      .sort((a, b) => {
        const dateCompare = (
          a.bookingDate || ""
        ).localeCompare(b.bookingDate || "");

        if (dateCompare !== 0) {
          return dateCompare;
        }

        return (a.startTime || "").localeCompare(
          b.startTime || ""
        );
      });
  }, [bookings, today]);

  const upcomingBooking =
    upcomingBookings[0] || null;

  const activeSession =
    sessions.find(
      (session) =>
        session.status === "Charging" ||
        session.status === "Paused"
    ) || null;

  const completedSessions = sessions.filter(
    (session) => session.status === "Completed"
  );

  /*
   * Total charging amount uses successful payments.
   */
  const totalChargingAmount = payments
    .filter((payment) => payment.status === "Paid")
    .reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0
    );

  /*
   * Most recent completed charging sessions.
   */
  const recentChargingHistory = useMemo(() => {
    return [...completedSessions]
      .sort((a, b) => {
        const dateA =
          a.endDate ||
          a.startDate ||
          a.createdDate ||
          "";

        const dateB =
          b.endDate ||
          b.startDate ||
          b.createdDate ||
          "";

        return dateB.localeCompare(dateA);
      })
      .slice(0, 5);
  }, [sessions]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-cyan-400" />

          <p className="text-sm text-[var(--text-secondary)] dark:text-white">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
              Customer Portal
            </span>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Welcome
              {user?.name ? `, ${user.name}` : ""}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-primary)]">
              Manage your EV charging bookings, sessions,
              payments and charging history.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                navigate("/customer/stations")
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 text-sm font-semibold text-[#07111F] transition hover:bg-cyan-300"
            >
              <Search className="h-4 w-4" />
              Find Station
            </button>

            <button
              type="button"
              onClick={() =>
                void fetchDashboardData()
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white hover:text-black"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
          <div className="flex min-w-0 items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />

            <p className="text-sm font-medium text-red-200">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0 text-red-300 transition hover:text-[var(--text-primary)]"
          >
            ×
          </button>
        </div>
      )}

      {/* Main stats */}
      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Available Stations"
          value={availableStations.length}
          description="Stations ready for charging"
          icon={<MapPin className="h-5 w-5" />}
        />

        <StatCard
          title="Total Bookings"
          value={bookings.length}
          description="Your charging bookings"
          icon={<CalendarDays className="h-5 w-5" />}
        />

        <StatCard
          title="Completed Sessions"
          value={completedSessions.length}
          description="Charging sessions completed"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        <StatCard
          title="Charging Amount"
          value={formatAmount(totalChargingAmount)}
          description="Total successful payments"
          icon={<Wallet className="h-5 w-5" />}
        />
      </section>

      {/* Upcoming booking + active session */}
      <section className="grid min-w-0 gap-4 xl:grid-cols-2">
        {/* Upcoming booking */}
        <div className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border-primary)] p-5">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Upcoming Booking
              </h2>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Your next charging reservation
              </p>
            </div>

            <CalendarDays className="h-5 w-5 shrink-0 text-cyan-400" />
          </div>

          {upcomingBooking ? (
            <div className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-[var(--text-primary)]">
                    {getStation(
                      upcomingBooking.stationId
                    )?.name || "Charging Station"}
                  </p>

                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {upcomingBooking.bookingId}
                  </p>
                </div>

                <span
                  className={`self-start rounded-full border px-3 py-1 text-xs font-medium ${getBookingStatusClasses(
                    upcomingBooking.status
                  )}`}
                >
                  {upcomingBooking.status}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <DetailItem
                  label="Booking Date"
                  value={formatDate(
                    upcomingBooking.bookingDate
                  )}
                />

                <DetailItem
                  label="Time"
                  value={`${formatTime(
                    upcomingBooking.startTime
                  )} - ${formatTime(
                    upcomingBooking.endTime
                  )}`}
                />

                <DetailItem
                  label="Charger"
                  value={
                    getCharger(
                      upcomingBooking.chargerId
                    )?.chargerId ||
                    upcomingBooking.chargerId ||
                    "—"
                  }
                />

                <DetailItem
                  label="Estimated Cost"
                  value={formatAmount(
                    upcomingBooking.estimatedCost
                  )}
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/customer/bookings")
                }
                className="mt-5 inline-flex h-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400 hover:text-black"
              >
                View My Bookings
              </button>
            </div>
          ) : (
            <div className="p-5">
              <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-8 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-[var(--text-muted)]" />

                <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
                  No upcoming booking
                </p>

                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                  Find an available charging station and
                  reserve your next charging slot.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/customer/stations")
                  }
                  className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 text-sm font-semibold text-[#07111F] transition hover:bg-cyan-300"
                >
                  <Search className="h-4 w-4" />
                  Find Station
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active session */}
        <div className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border-primary)] p-5">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Active Session
              </h2>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Current charging activity
              </p>
            </div>

            <Zap className="h-5 w-5 shrink-0 text-cyan-400" />
          </div>

          {activeSession ? (
            <div className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-[var(--text-primary)]">
                    {activeSession.sessionId}
                  </p>

                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {getStation(
                      activeSession.stationId
                    )?.name || "Charging Station"}
                  </p>
                </div>

                <span
                  className={`self-start rounded-full border px-3 py-1 text-xs font-medium ${getSessionStatusClasses(
                    activeSession.status
                  )}`}
                >
                  {activeSession.status}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <DetailItem
                  label="Charger"
                  value={
                    getCharger(
                      activeSession.chargerId
                    )?.chargerId ||
                    activeSession.chargerId ||
                    "—"
                  }
                />

                <DetailItem
                  label="Energy Consumed"
                  value={`${Number(
                    activeSession.energyConsumed ??
                      activeSession.unitsConsumed ??
                      0
                  ).toFixed(1)} kWh`}
                />

                <DetailItem
                  label="Start Time"
                  value={formatTime(
                    activeSession.startTime
                  )}
                />

                <DetailItem
                  label="Current Cost"
                  value={formatAmount(
                    activeSession.cost ??
                      activeSession.chargingCost ??
                      activeSession.totalAmount
                  )}
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/customer/sessions")
                }
                className="mt-5 inline-flex h-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400 hover:text-black"
              >
                View Charging Session
              </button>
            </div>
          ) : (
            <div className="p-5">
              <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-8 text-center">
                <Zap className="mx-auto h-8 w-8 text-[var(--text-muted)]" />

                <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
                  No active charging session
                </p>

                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                  Your active charging session will appear
                  here after charging begins.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Quick actions */}
      <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Quick Actions
          </h2>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Quickly access your EV charging services.
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={() =>
              navigate("/customer/stations")
            }
            className="group rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.06]"
          >
            <MapPin className="h-5 w-5 text-cyan-400" />

            <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
              Find Stations
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Search charging stations and slots.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/customer/bookings")
            }
            className="group rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.06]"
          >
            <CalendarDays className="h-5 w-5 text-cyan-400" />

            <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
              My Bookings
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              View and manage charging bookings.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/customer/sessions")
            }
            className="group rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.06]"
          >
            <Activity className="h-5 w-5 text-cyan-400" />

            <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
              Charging History
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Review your charging sessions.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/customer/payments")
            }
            className="group rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.06]"
          >
            <CreditCard className="h-5 w-5 text-cyan-400" />

            <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
              Payments
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              View payment status and history.
            </p>
          </button>
        </div>
      </section>

      {/* Recent charging history */}
      <section className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-primary)] p-5">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Recent Charging History
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Your recently completed charging sessions.
            </p>
          </div>

          <Clock3 className="h-5 w-5 shrink-0 text-cyan-400" />
        </div>

        {recentChargingHistory.length === 0 ? (
          <div className="p-6">
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-8 text-center">
              <Activity className="mx-auto h-8 w-8 text-[var(--text-muted)]" />

              <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
                No charging history yet
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Completed charging sessions will appear
                here.
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
                  <col className="w-[23%]" />
                  <col className="w-[15%]" />
                  <col className="w-[16%]" />
                  <col className="w-[13%]" />
                  <col className="w-[18%]" />
                </colgroup>

                <thead>
                  <tr className="border-b border-[var(--border-primary)]">
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Session
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Station
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Charger
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Energy
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Cost
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border-primary)]">
                  {recentChargingHistory.map(
                    (session) => (
                      <tr
                        key={session.id}
                        className="transition hover:bg-[var(--bg-tertiary)]"
                      >
                        <td className="px-4 py-5">
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                            {session.sessionId}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <p className="truncate text-sm text-[var(--text-secondary)]">
                            {getStation(
                              session.stationId
                            )?.name || "—"}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <p className="truncate text-sm text-[var(--text-secondary)]">
                            {getCharger(
                              session.chargerId
                            )?.chargerId ||
                              session.chargerId ||
                              "—"}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <p className="text-sm text-[var(--text-secondary)]">
                            {Number(
                              session.energyConsumed ??
                                session.unitsConsumed ??
                                0
                            ).toFixed(1)}{" "}
                            kWh
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <p className="text-sm text-[var(--text-secondary)]">
                            {formatAmount(
                              session.cost ??
                                session.chargingCost ??
                                session.totalAmount
                            )}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${getSessionStatusClasses(
                              session.status
                            )}`}
                          >
                            {session.status}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="grid gap-3 p-4 md:hidden">
              {recentChargingHistory.map(
                (session) => (
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
                          {getStation(
                            session.stationId
                          )?.name || "—"}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-medium ${getSessionStatusClasses(
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
                          getCharger(
                            session.chargerId
                          )?.chargerId ||
                          session.chargerId ||
                          "—"
                        }
                      />

                      <DetailItem
                        label="Energy"
                        value={`${Number(
                          session.energyConsumed ??
                            session.unitsConsumed ??
                            0
                        ).toFixed(1)} kWh`}
                      />

                      <DetailItem
                        label="Cost"
                        value={formatAmount(
                          session.cost ??
                            session.chargingCost ??
                            session.totalAmount
                        )}
                      />

                      <DetailItem
                        label="Date"
                        value={formatDate(
                          session.endDate ||
                            session.startDate ||
                            session.createdDate
                        )}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}

        {recentChargingHistory.length > 0 && (
          <div className="border-t border-[var(--border-primary)] p-4 text-center">
            <button
              type="button"
              onClick={() =>
                navigate("/customer/sessions")
              }
              className="text-sm font-medium text-cyan-400 transition hover:text-[var(--text-primary)]"
            >
              View All Charging Sessions
            </button>
          </div>
        )}
      </section>
    </div>
  );
}