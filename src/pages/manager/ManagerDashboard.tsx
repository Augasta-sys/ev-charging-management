import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BatteryCharging,
  CalendarDays,
  CheckCircle2,
  Clock3,
  IndianRupee,
  MapPin,
  RefreshCw,
  Settings,
  Zap,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

/* =========================================================
   TYPES
========================================================= */

interface Station {
  id: string;
  stationId: string;
  stationName: string;
  stationCode?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  managerId?: string;
  manager?: string;
  contactNumber?: string;
  openingTime?: string;
  closingTime?: string;
  numberOfChargers?: number;
  status?: string;
  createdDate?: string;
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
  status:
    | "Available"
    | "Booked"
    | "Charging"
    | "Occupied"
    | "Maintenance"
    | "Offline"
    | string;
}

interface Booking {
  id: string;
  bookingId: string;
  customerId?: string;
  customerName?: string;
  stationId: string;
  chargerId?: string;
  slotId?: string;
  vehicleId?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status:
    | "Pending"
    | "Confirmed"
    | "Checked In"
    | "Charging"
    | "Completed"
    | "Cancelled"
    | "No Show"
    | string;
  amount?: number;
  totalAmount?: number;
  createdDate?: string;
}

interface ChargingSession {
  id: string;
  sessionId: string;
  bookingId?: string;
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
  chargingCost?: number;
  totalAmount?: number;
  amount?: number;
  status:
    | "Not Started"
    | "Charging"
    | "Paused"
    | "Completed"
    | "Cancelled"
    | string;
  createdDate?: string;
}

interface Payment {
  id: string;
  paymentId: string;
  bookingId?: string;
  customerId?: string;
  amount: number;
  paymentDate?: string;
  paymentMethod?: string;
  transactionReference?: string;
  status:
    | "Pending"
    | "Paid"
    | "Failed"
    | "Refunded"
    | string;
}

interface Maintenance {
  id: string;
  maintenanceId: string;
  chargerId: string;
  stationId: string;
  issue: string;
  reportedBy?: string;
  reportedDate?: string;
  technician?: string;
  startDate?: string;
  completionDate?: string;
  status:
    | "Reported"
    | "Scheduled"
    | "In Progress"
    | "Completed"
    | "Cancelled"
    | string;
  remarks?: string;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ManagerDashboard() {
  const { user } = useAuth();

  const [stations, setStations] = useState<Station[]>(
    [],
  );
  const [chargers, setChargers] = useState<Charger[]>(
    [],
  );
  const [bookings, setBookings] = useState<Booking[]>(
    [],
  );
  const [sessions, setSessions] =
    useState<ChargingSession[]>([]);
  const [payments, setPayments] = useState<Payment[]>(
    [],
  );
  const [maintenance, setMaintenance] = useState<
    Maintenance[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadDashboard = async () => {
    try {
      setError("");

      const [
        stationsResponse,
        chargersResponse,
        bookingsResponse,
        sessionsResponse,
        paymentsResponse,
        maintenanceResponse,
      ] = await Promise.all([
        api.get<Station[]>("/stations"),
        api.get<Charger[]>("/chargers"),
        api.get<Booking[]>("/bookings"),
        api.get<ChargingSession[]>(
          "/chargingSessions",
        ),
        api.get<Payment[]>("/payments"),
        api.get<Maintenance[]>("/maintenance"),
      ]);

      setStations(stationsResponse.data);
      setChargers(chargersResponse.data);
      setBookings(bookingsResponse.data);
      setSessions(sessionsResponse.data);
      setPayments(paymentsResponse.data);
      setMaintenance(maintenanceResponse.data);
    } catch (err) {
      console.error(
        "Failed to load manager dashboard:",
        err,
      );

      setError(
        "Unable to load dashboard data. Please make sure JSON Server is running.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
  };

  /* =======================================================
     ASSIGNED STATION
  ======================================================= */

  const assignedStationId = user?.assignedStationId || "";

  const assignedStation = useMemo(() => {
    return stations.find(
      (station) =>
        station.stationId ===
          assignedStationId ||
        station.id === assignedStationId,
    );
  }, [stations, assignedStationId]);

  const stationId =
    assignedStation?.stationId ||
    assignedStationId;

  /* =======================================================
     STATION-SPECIFIC DATA
  ======================================================= */

  const stationChargers = useMemo(() => {
    if (!stationId) return [];

    return chargers.filter(
      (charger) =>
        charger.stationId === stationId,
    );
  }, [chargers, stationId]);

  const stationBookings = useMemo(() => {
    if (!stationId) return [];

    return bookings.filter(
      (booking) =>
        booking.stationId === stationId,
    );
  }, [bookings, stationId]);

  const stationSessions = useMemo(() => {
    if (!stationId) return [];

    return sessions.filter(
      (session) =>
        session.stationId === stationId,
    );
  }, [sessions, stationId]);

  const stationMaintenance = useMemo(() => {
    if (!stationId) return [];

    return maintenance.filter(
      (item) =>
        item.stationId === stationId,
    );
  }, [maintenance, stationId]);

  /* =======================================================
     TODAY
  ======================================================= */

  const today = useMemo(() => {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(
      date.getMonth() + 1,
    ).padStart(2, "0");
    const day = String(
      date.getDate(),
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }, []);

  /* =======================================================
     DASHBOARD STATS
  ======================================================= */

  const stats = useMemo(() => {
    const totalChargers =
      stationChargers.length;

    const availableChargers =
      stationChargers.filter(
        (charger) =>
          charger.status === "Available",
      ).length;

    const maintenanceChargers =
      stationChargers.filter(
        (charger) =>
          charger.status === "Maintenance",
      ).length;

    const todaysBookings =
      stationBookings.filter(
        (booking) =>
          booking.bookingDate === today &&
          booking.status !== "Cancelled" &&
          booking.status !== "No Show",
      ).length;

    const activeSessions =
      stationSessions.filter(
        (session) =>
          session.status === "Charging" ||
          session.status === "Paused",
      ).length;

    const completedSessions =
      stationSessions.filter(
        (session) =>
          session.status === "Completed" &&
          (
            session.endDate === today ||
            session.startDate === today ||
            session.createdDate?.startsWith(
              today,
            )
          ),
      ).length;

    const todaysBookingIds =
      new Set(
        stationBookings
          .filter(
            (booking) =>
              booking.bookingDate === today,
          )
          .map(
            (booking) =>
              booking.bookingId,
          ),
      );

    const todaysRevenue =
      payments
        .filter(
          (payment) =>
            payment.status === "Paid" &&
            payment.paymentDate?.startsWith(
              today,
            ) &&
            (
              !payment.bookingId ||
              todaysBookingIds.has(
                payment.bookingId,
              )
            ),
        )
        .reduce(
          (total, payment) =>
            total + Number(payment.amount || 0),
          0,
        );

    return {
      totalChargers,
      availableChargers,
      todaysBookings,
      activeSessions,
      completedSessions,
      todaysRevenue,
      maintenanceChargers,
    };
  }, [
    stationChargers,
    stationBookings,
    stationSessions,
    payments,
    today,
  ]);

  /* =======================================================
     RECENT BOOKINGS
  ======================================================= */

  const recentBookings = useMemo(() => {
    return [...stationBookings]
      .sort((a, b) => {
        const aDate =
          `${a.bookingDate} ${a.startTime}`;

        const bDate =
          `${b.bookingDate} ${b.startTime}`;

        return bDate.localeCompare(aDate);
      })
      .slice(0, 5);
  }, [stationBookings]);

  /* =======================================================
     STATUS CLASS
  ======================================================= */

  const getBookingStatusClass = (
    status: string,
  ) => {
    switch (status) {
      case "Confirmed":
        return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";

      case "Checked In":
        return "border-blue-400/20 bg-blue-400/10 text-blue-300";

      case "Charging":
        return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

      case "Completed":
        return "border-violet-400/20 bg-violet-400/10 text-violet-300";

      case "Cancelled":
        return "border-red-400/20 bg-red-400/10 text-red-300";

      case "Pending":
        return "border-amber-400/20 bg-amber-400/10 text-amber-300";

      default:
        return "border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]";
    }
  };

  /* =======================================================
     FORMAT CURRENCY
  ======================================================= */

  const formatCurrency = (
    amount: number,
  ) => {
    return `₹${amount.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    )}`;
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
            <Activity className="h-6 w-6 animate-pulse text-cyan-400" />
          </div>

          <p className="text-sm text-[var(--text-secondary)]">
            Loading manager dashboard...
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
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
            <Activity className="h-4 w-4" />

            Manager Dashboard
          </div>

          <h1 className="truncate text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            Station Overview
          </h1>

          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Monitor your assigned charging station.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing
                ? "animate-spin"
                : ""
            }`}
          />

          Refresh
        </button>
      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* ===================================================
          ASSIGNED STATION
      =================================================== */}

      <section className="mb-6 rounded-2xl border border-cyan-400/10 bg-white dark:bg-[#0D1B2A] p-4 shadow-xl shadow-black/10 sm:p-5">
        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
              <MapPin className="h-6 w-6 text-[var(--text-primary)]" />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-400">
                Assigned Station
              </p>

              <h2 className="mt-1 truncate text-lg font-bold text-[var(--text-primary)] sm:text-xl">
                {assignedStation?.stationName ||
                  "No station assigned"}
              </h2>

              <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                {assignedStation
                  ? `${assignedStation.stationId}${
                      assignedStation.city
                        ? ` • ${assignedStation.city}`
                        : ""
                    }`
                  : "Please contact an administrator to assign a station."}
              </p>
            </div>
          </div>

          {assignedStation && (
            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
              <MiniInfo
                label="Opening"
                value={
                  assignedStation.openingTime ||
                  "—"
                }
              />

              <MiniInfo
                label="Closing"
                value={
                  assignedStation.closingTime ||
                  "—"
                }
              />

              <MiniInfo
                label="Status"
                value={
                  assignedStation.status ||
                  "—"
                }
              />
            </div>
          )}
        </div>
      </section>

      {/* ===================================================
          STATS
      =================================================== */}

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Total Chargers"
          value={stats.totalChargers}
          description="Chargers at assigned station"
          icon={Zap}
          iconClass="text-cyan-400"
          iconBg="bg-cyan-400/10"
        />

        <DashboardStatCard
          title="Available Chargers"
          value={stats.availableChargers}
          description="Ready for customer use"
          icon={BatteryCharging}
          iconClass="text-emerald-400"
          iconBg="bg-emerald-400/10"
        />

        <DashboardStatCard
          title="Today's Bookings"
          value={stats.todaysBookings}
          description="Bookings scheduled today"
          icon={CalendarDays}
          iconClass="text-violet-400"
          iconBg="bg-violet-400/10"
        />

        <DashboardStatCard
          title="Active Sessions"
          value={stats.activeSessions}
          description="Currently charging or paused"
          icon={Activity}
          iconClass="text-blue-400"
          iconBg="bg-blue-400/10"
        />

        <DashboardStatCard
          title="Completed Sessions"
          value={stats.completedSessions}
          description="Sessions completed today"
          icon={CheckCircle2}
          iconClass="text-emerald-400"
          iconBg="bg-emerald-400/10"
        />

        <DashboardStatCard
          title="Today's Revenue"
          value={formatCurrency(
            stats.todaysRevenue,
          )}
          description="Paid transactions today"
          icon={IndianRupee}
          iconClass="text-cyan-400"
          iconBg="bg-cyan-400/10"
        />

        <DashboardStatCard
          title="Maintenance Chargers"
          value={stats.maintenanceChargers}
          description="Currently under maintenance"
          icon={Settings}
          iconClass="text-amber-400"
          iconBg="bg-amber-400/10"
        />

        <DashboardStatCard
          title="Station Capacity"
          value={
            assignedStation?.numberOfChargers ??
            stats.totalChargers
          }
          description="Configured charger capacity"
          icon={Clock3}
          iconClass="text-violet-400"
          iconBg="bg-violet-400/10"
        />
      </div>

      {/* ===================================================
          LOWER SECTION
      =================================================== */}

      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Recent Bookings */}

        <section className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)]">
          <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-4 py-4 sm:px-5">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Recent Bookings
              </h2>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Latest bookings for your station.
              </p>
            </div>

            <CalendarDays className="h-5 w-5 text-[var(--text-primary)]" />
          </div>

          {recentBookings.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-[var(--text-muted)]" />

              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                No bookings found.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-primary)]">
              {recentBookings.map(
                (booking) => (
                  <div
                    key={booking.id}
                    className="flex min-w-0 flex-col gap-3 px-4 py-4 transition hover:bg-[var(--bg-tertiary)] sm:flex-row sm:items-center sm:justify-between sm:px-5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10">
                        <CalendarDays className="h-4 w-4 text-[var(--text-primary)]" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                          {booking.bookingId}
                        </p>

                        <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                          {booking.customerName ||
                            booking.customerId ||
                            "Customer"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <span className="text-xs text-[var(--text-secondary)]">
                        {booking.bookingDate}
                      </span>

                      <span className="text-xs text-[var(--text-muted)]">
                        {booking.startTime}
                      </span>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${getBookingStatusClass(
                          booking.status,
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        {/* Charger Status */}

        <section className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)]">
          <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-4 py-4 sm:px-5">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Charger Status
              </h2>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Current charger availability.
              </p>
            </div>

            <Zap className="h-5 w-5 text-[var(--text-primary)]" />
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 sm:p-5">
            <ChargerStatusCard
              label="Available"
              value={
                stationChargers.filter(
                  (charger) =>
                    charger.status ===
                    "Available",
                ).length
              }
              className="text-emerald-300"
              bgClass="bg-emerald-400/10"
            />

            <ChargerStatusCard
              label="Booked"
              value={
                stationChargers.filter(
                  (charger) =>
                    charger.status ===
                    "Booked",
                ).length
              }
              className="text-cyan-300"
              bgClass="bg-cyan-400/10"
            />

            <ChargerStatusCard
              label="Charging"
              value={
                stationChargers.filter(
                  (charger) =>
                    charger.status ===
                    "Charging",
                ).length
              }
              className="text-blue-300"
              bgClass="bg-blue-400/10"
            />

            <ChargerStatusCard
              label="Occupied"
              value={
                stationChargers.filter(
                  (charger) =>
                    charger.status ===
                    "Occupied",
                ).length
              }
              className="text-violet-300"
              bgClass="bg-violet-400/10"
            />

            <ChargerStatusCard
              label="Maintenance"
              value={
                stationChargers.filter(
                  (charger) =>
                    charger.status ===
                    "Maintenance",
                ).length
              }
              className="text-amber-300"
              bgClass="bg-amber-400/10"
            />

            <ChargerStatusCard
              label="Offline"
              value={
                stationChargers.filter(
                  (charger) =>
                    charger.status ===
                    "Offline",
                ).length
              }
              className="text-red-300"
              bgClass="bg-red-400/10"
            />
          </div>
        </section>
      </div>

      {/* ===================================================
          MAINTENANCE SUMMARY
      =================================================== */}

      <section className="mt-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Maintenance Overview
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Maintenance activity for your assigned station.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-[var(--text-primary)]" />

            <span className="text-xs text-[var(--text-secondary)]">
              {stationMaintenance.length} records
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MaintenanceMetric
            label="Reported"
            value={
              stationMaintenance.filter(
                (item) =>
                  item.status ===
                  "Reported",
              ).length
            }
          />

          <MaintenanceMetric
            label="In Progress"
            value={
              stationMaintenance.filter(
                (item) =>
                  item.status ===
                    "Scheduled" ||
                  item.status ===
                    "In Progress",
              ).length
            }
          />

          <MaintenanceMetric
            label="Completed"
            value={
              stationMaintenance.filter(
                (item) =>
                  item.status ===
                  "Completed",
              ).length
            }
          />
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   DASHBOARD STAT CARD
========================================================= */

function DashboardStatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
  iconBg,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: typeof Activity;
  iconClass: string;
  iconBg: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 transition hover:border-[var(--border-secondary)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-[var(--text-muted)]">
            {title}
          </p>

          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {value}
          </p>

          <p className="mt-1 truncate text-[11px] text-[var(--text-muted)]">
            {description}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
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
   MINI INFO
========================================================= */

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </p>

      <p className="mt-1 text-xs font-medium text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   CHARGER STATUS CARD
========================================================= */

function ChargerStatusCard({
  label,
  value,
  className,
  bgClass,
}: {
  label: string;
  value: number;
  className: string;
  bgClass: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs text-[var(--text-secondary)]">
          {label}
        </span>

        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${bgClass} ${className}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   MAINTENANCE METRIC
========================================================= */

function MaintenanceMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4">
      <p className="text-xs text-[var(--text-muted)]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}