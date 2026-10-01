import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BatteryCharging,
  CalendarDays,
  Car,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Download,
  Loader2,
  MapPin,
  PieChart,
  RefreshCw,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import api from "../../services/api";

type BookingStatus =
  | "Pending"
  | "Confirmed"
  | "Checked In"
  | "Charging"
  | "Completed"
  | "Cancelled"
  | "No Show";

type SessionStatus =
  | "Not Started"
  | "Charging"
  | "Paused"
  | "Completed"
  | "Cancelled";

type PaymentStatus =
  | "Pending"
  | "Paid"
  | "Failed"
  | "Refunded";

interface User {
  id: string;
  userId: string;
  name: string;
  role: string;
  status?: string;
}

interface Station {
  id: string;
  stationId: string;
  name: string;
  location?: string;
  status?: string;
}

interface Charger {
  id: string;
  chargerId: string;
  stationId: string;
  type?: string;
  status?: string;
}

interface Booking {
  id: string;
  bookingId: string;
  userId?: string;
  customerId?: string;
  stationId: string;
  chargerId?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  amount?: number;
  totalAmount?: number;
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
  energyConsumed?: number;
  unitsConsumed?: number;
  chargingCost?: number;
  totalAmount?: number;
  amount?: number;
  status: SessionStatus;
  createdDate?: string;
}

interface Payment {
  id: string;
  paymentId: string;
  bookingId?: string;
  userId?: string;
  customerId?: string;
  amount: number;
  paymentDate?: string;
  date?: string;
  status: PaymentStatus;
  paymentMethod?: string;
}

interface Maintenance {
  id: string;
  maintenanceId: string;
  stationId: string;
  chargerId?: string;
  issue: string;
  reportedDate: string;
  scheduledDate?: string;
  completedDate?: string;
  status: string;
  priority?: string;
}

type ReportRange = "7" | "30" | "90" | "all";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number, decimals = 0) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: decimals,
  }).format(value);
}

function isDateInRange(
  value: string | undefined,
  range: ReportRange,
) {
  if (range === "all") return true;
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();
  const days = Number(range);

  const startDate = new Date(today);
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - (days - 1));

  return date >= startDate;
}

function getStatusClass(status: string) {
  switch (status) {
    case "Completed":
    case "Paid":
    case "Active":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "Charging":
    case "In Progress":
    case "Confirmed":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";

    case "Pending":
    case "Scheduled":
    case "Checked In":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "Failed":
    case "Cancelled":
    case "No Show":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    default:
      return "border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]";
  }
}

function getStationName(
  stationId: string | undefined,
  stations: Station[],
) {
  if (!stationId) return "—";

  const station = stations.find(
    (item) =>
      item.id === stationId ||
      item.stationId === stationId,
  );

  return station?.name || stationId;
}

function ReportCard({
  label,
  value,
  subtitle,
  icon,
  iconClass,
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--text-muted)]">
            {label}
          </p>

          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-[var(--border-primary)] px-4 py-4 sm:px-5">
      <div className="flex items-center gap-2">
        <span className="text-cyan-400">{icon}</span>

        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
      </div>

      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {description}
      </p>
    </div>
  );
}

export default function Reports() {
  const [users, setUsers] = useState<User[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState<ReportRange>("30");

  const fetchReportData = async () => {
    try {
      setLoading(true);

      const [
        usersResponse,
        stationsResponse,
        chargersResponse,
        bookingsResponse,
        sessionsResponse,
        paymentsResponse,
        maintenanceResponse,
      ] = await Promise.all([
        api.get<User[]>("/users"),
        api.get<Station[]>("/stations"),
        api.get<Charger[]>("/chargers"),
        api.get<Booking[]>("/bookings"),
        api.get<ChargingSession[]>("/chargingSessions"),
        api.get<Payment[]>("/payments"),
        api.get<Maintenance[]>("/maintenance"),
      ]);

      setUsers(usersResponse.data);
      setStations(stationsResponse.data);
      setChargers(chargersResponse.data);
      setBookings(bookingsResponse.data);
      setSessions(sessionsResponse.data);
      setPayments(paymentsResponse.data);
      setMaintenance(maintenanceResponse.data);
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReportData();
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchReportData();
    } finally {
      setRefreshing(false);
    }
  };

  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        isDateInRange(booking.bookingDate, range),
      ),
    [bookings, range],
  );

  const filteredSessions = useMemo(
    () =>
      sessions.filter((session) =>
        isDateInRange(
          session.startDate || session.createdDate,
          range,
        ),
      ),
    [sessions, range],
  );

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) =>
        isDateInRange(
          payment.paymentDate || payment.date,
          range,
        ),
      ),
    [payments, range],
  );

  const totalRevenue = useMemo(
    () =>
      filteredPayments
        .filter((payment) => payment.status === "Paid")
        .reduce(
          (total, payment) =>
            total + Number(payment.amount || 0),
          0,
        ),
    [filteredPayments],
  );

  const totalEnergy = useMemo(
    () =>
      filteredSessions.reduce(
        (total, session) =>
          total +
          Number(
            session.energyConsumed ??
              session.unitsConsumed ??
              0,
          ),
        0,
      ),
    [filteredSessions],
  );

  const completedBookings = filteredBookings.filter(
    (booking) => booking.status === "Completed",
  ).length;

  const activeBookings = filteredBookings.filter(
    (booking) =>
      booking.status === "Confirmed" ||
      booking.status === "Checked In" ||
      booking.status === "Charging",
  ).length;

  const cancelledBookings = filteredBookings.filter(
    (booking) => booking.status === "Cancelled",
  ).length;

  const completedSessions = filteredSessions.filter(
    (session) => session.status === "Completed",
  ).length;

  const activeSessions = filteredSessions.filter(
    (session) =>
      session.status === "Charging" ||
      session.status === "Paused",
  ).length;

  const paidPayments = filteredPayments.filter(
    (payment) => payment.status === "Paid",
  );

  const failedPayments = filteredPayments.filter(
    (payment) => payment.status === "Failed",
  );

  const pendingPayments = filteredPayments.filter(
    (payment) => payment.status === "Pending",
  );

  const averageRevenue =
    paidPayments.length > 0
      ? totalRevenue / paidPayments.length
      : 0;

  const averageEnergy =
    filteredSessions.length > 0
      ? totalEnergy / filteredSessions.length
      : 0;

  const utilization =
    chargers.length > 0
      ? (chargers.filter(
          (charger) =>
            charger.status === "Booked" ||
            charger.status === "Charging" ||
            charger.status === "Occupied",
        ).length /
          chargers.length) *
        100
      : 0;

  const stationReport = useMemo(() => {
    return stations.map((station) => {
      const stationBookings = filteredBookings.filter(
        (booking) =>
          booking.stationId === station.id ||
          booking.stationId === station.stationId,
      );

      const stationSessions = filteredSessions.filter(
        (session) =>
          session.stationId === station.id ||
          session.stationId === station.stationId,
      );

      const stationRevenue = filteredPayments
        .filter((payment) => {
          const booking = bookings.find(
            (item) =>
              item.bookingId === payment.bookingId,
          );

          return (
            booking &&
            (booking.stationId === station.id ||
              booking.stationId === station.stationId) &&
            payment.status === "Paid"
          );
        })
        .reduce(
          (total, payment) =>
            total + Number(payment.amount || 0),
          0,
        );

      const energy = stationSessions.reduce(
        (total, session) =>
          total +
          Number(
            session.energyConsumed ??
              session.unitsConsumed ??
              0,
          ),
        0,
      );

      return {
        ...station,
        bookings: stationBookings.length,
        sessions: stationSessions.length,
        revenue: stationRevenue,
        energy,
      };
    });
  }, [
    stations,
    filteredBookings,
    filteredSessions,
    filteredPayments,
    bookings,
  ]);

  const chargerReport = useMemo(() => {
    return chargers.map((charger) => {
      const chargerSessions = filteredSessions.filter(
        (session) =>
          session.chargerId === charger.id ||
          session.chargerId === charger.chargerId,
      );

      const energy = chargerSessions.reduce(
        (total, session) =>
          total +
          Number(
            session.energyConsumed ??
              session.unitsConsumed ??
              0,
          ),
        0,
      );

      return {
        ...charger,
        sessions: chargerSessions.length,
        energy,
      };
    });
  }, [chargers, filteredSessions]);

  const paymentMethodReport = useMemo(() => {
    const methods = new Map<
      string,
      { count: number; amount: number }
    >();

    filteredPayments.forEach((payment) => {
      if (payment.status !== "Paid") return;

      const method =
        payment.paymentMethod || "Other";

      const current = methods.get(method) || {
        count: 0,
        amount: 0,
      };

      methods.set(method, {
        count: current.count + 1,
        amount:
          current.amount +
          Number(payment.amount || 0),
      });
    });

    return Array.from(methods.entries())
      .map(([method, data]) => ({
        method,
        ...data,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredPayments]);

  const maintenanceOpen = maintenance.filter(
    (item) =>
      item.status === "Reported" ||
      item.status === "Scheduled" ||
      item.status === "In Progress",
  ).length;

  const activeStations = stations.filter(
    (station) => station.status === "Active",
  ).length;

  const activeUsers = users.filter(
    (user) => user.status === "Active",
  ).length;

  const maxStationRevenue = Math.max(
    ...stationReport.map(
      (station) => station.revenue,
    ),
    1,
  );

  const maxStationBookings = Math.max(
    ...stationReport.map(
      (station) => station.bookings,
    ),
    1,
  );

  const handleExport = () => {
    const rows = [
      [
        "Station",
        "Bookings",
        "Charging Sessions",
        "Energy (kWh)",
        "Revenue",
      ],
      ...stationReport.map((station) => [
        station.name,
        station.bookings,
        station.sessions,
        station.energy.toFixed(2),
        station.revenue.toFixed(2),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replace(
                /"/g,
                '""',
              )}"`,
          )
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `ev-charging-report-${range}days.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
          Loading reports...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-cyan-400">
            <BarChart3 className="h-4 w-4" />
            Admin / Reports
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Reports & Analytics
          </h1>

          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
            Monitor charging activity, bookings, revenue and
            station performance.
          </p>
        </div>

        {/* Report period + actions */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-[170px]">
            <select
              value={range}
              onChange={(event) =>
                setRange(
                  event.target.value as ReportRange,
                )
              }
              className="reports-range-select h-[42px] w-full appearance-none rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-4 pr-10 text-sm font-medium text-[var(--input-text)] outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
              style={{ colorScheme: "inherit" }}
            >
              <option
                value="7"
                className="bg-[var(--card-bg)] text-[var(--text-primary)]"
              >
                Last 7 Days
              </option>

              <option
                value="30"
                className="bg-[var(--card-bg)] text-[var(--text-primary)]"
              >
                Last 30 Days
              </option>

              <option
                value="90"
                className="bg-[var(--card-bg)] text-[var(--text-primary)]"
              >
                Last 90 Days
              </option>

              <option
                value="all"
                className="bg-[var(--card-bg)] text-[var(--text-primary)]"
              >
                All Time
              </option>
            </select>

            <svg
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-primary)]"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="reports-refresh-button inline-flex h-[42px] items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-[42px] items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-[#06111F] transition hover:bg-cyan-400"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          subtitle={`${paidPayments.length} successful payments`}
          icon={
            <CircleDollarSign className="h-5 w-5" />
          }
          iconClass="bg-emerald-400/10 text-emerald-300"
        />

        <ReportCard
          label="Total Bookings"
          value={formatNumber(
            filteredBookings.length,
          )}
          subtitle={`${completedBookings} completed`}
          icon={
            <CalendarDays className="h-5 w-5" />
          }
          iconClass="bg-cyan-400/10 text-cyan-300"
        />

        <ReportCard
          label="Energy Consumed"
          value={`${formatNumber(
            totalEnergy,
            2,
          )} kWh`}
          subtitle={`${formatNumber(
            averageEnergy,
            2,
          )} kWh average session`}
          icon={<Zap className="h-5 w-5" />}
          iconClass="bg-violet-400/10 text-violet-300"
        />

        <ReportCard
          label="Charger Utilization"
          value={`${formatNumber(
            utilization,
            1,
          )}%`}
          subtitle={`${activeSessions} active sessions`}
          icon={
            <BatteryCharging className="h-5 w-5" />
          }
          iconClass="bg-blue-400/10 text-blue-300"
        />
      </section>

      {/* Secondary Stats */}
      <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportCard
          label="Active Bookings"
          value={formatNumber(activeBookings)}
          subtitle="Confirmed, checked in or charging"
          icon={<Activity className="h-5 w-5" />}
          iconClass="bg-amber-400/10 text-amber-300"
        />

        <ReportCard
          label="Completed Sessions"
          value={formatNumber(completedSessions)}
          subtitle="Successfully completed"
          icon={
            <CheckCircle2 className="h-5 w-5" />
          }
          iconClass="bg-emerald-400/10 text-emerald-300"
        />

        <ReportCard
          label="Average Payment"
          value={formatCurrency(averageRevenue)}
          subtitle="Per successful payment"
          icon={
            <TrendingUp className="h-5 w-5" />
          }
          iconClass="bg-cyan-400/10 text-cyan-300"
        />

        <ReportCard
          label="Open Maintenance"
          value={formatNumber(maintenanceOpen)}
          subtitle={`${activeStations} active stations`}
          icon={<Car className="h-5 w-5" />}
          iconClass="bg-red-400/10 text-red-300"
        />
      </section>

      {/* Booking + Payment Overview */}
      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)]">
          <SectionHeader
            icon={
              <CalendarDays className="h-4 w-4" />
            }
            title="Booking Overview"
            description="Booking status distribution for the selected period."
          />

          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-3">
              <MiniMetric
                label="Total"
                value={filteredBookings.length}
              />

              <MiniMetric
                label="Completed"
                value={completedBookings}
              />

              <MiniMetric
                label="Active"
                value={activeBookings}
              />

              <MiniMetric
                label="Cancelled"
                value={cancelledBookings}
              />
            </div>

            <div className="mt-5 space-y-4">
              <ProgressRow
                label="Completed"
                value={completedBookings}
                total={filteredBookings.length}
                className="bg-emerald-400"
              />

              <ProgressRow
                label="Active"
                value={activeBookings}
                total={filteredBookings.length}
                className="bg-cyan-400"
              />

              <ProgressRow
                label="Cancelled"
                value={cancelledBookings}
                total={filteredBookings.length}
                className="bg-red-400"
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)]">
          <SectionHeader
            icon={
              <CircleDollarSign className="h-4 w-4" />
            }
            title="Payment Overview"
            description="Payment status and collection summary."
          />

          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-3">
              <MiniMetric
                label="Paid"
                value={paidPayments.length}
                valueClass="text-emerald-300"
              />

              <MiniMetric
                label="Pending"
                value={pendingPayments.length}
                valueClass="text-amber-300"
              />

              <MiniMetric
                label="Failed"
                value={failedPayments.length}
                valueClass="text-red-300"
              />

              <MiniMetric
                label="Revenue"
                value={formatCurrency(totalRevenue)}
                valueClass="text-cyan-300"
              />
            </div>

            <div className="mt-5 space-y-3">
              {paymentMethodReport.length === 0 ? (
                <p className="py-5 text-center text-xs text-[var(--text-muted)]">
                  No successful payments for this period.
                </p>
              ) : (
                paymentMethodReport.map((item) => (
                  <div
                    key={item.method}
                    className="flex items-center justify-between rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3.5 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                        <CircleDollarSign className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="text-xs font-medium text-[var(--text-primary)]">
                          {item.method}
                        </p>

                        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                          {item.count} payment
                          {item.count !== 1
                            ? "s"
                            : ""}
                        </p>
                      </div>
                    </div>

                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Station Performance */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)]">
        <SectionHeader
          icon={<MapPin className="h-4 w-4" />}
          title="Station Performance"
          description="Bookings, sessions, energy consumption and revenue by station."
        />

        {stationReport.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">
            No station data available.
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden lg:block">
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[13%]" />
                  <col className="w-[15%]" />
                  <col className="w-[18%]" />
                  <col className="w-[17%]" />
                  <col className="w-[15%]" />
                </colgroup>

                <thead>
                  <tr className="border-b border-[var(--border-primary)] text-left">
                    <th className="px-5 py-4 text-xs font-semibold text-[var(--text-secondary)]">
                      Station
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold text-[var(--text-secondary)]">
                      Bookings
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold text-[var(--text-secondary)]">
                      Sessions
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold text-[var(--text-secondary)]">
                      Energy
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold text-[var(--text-secondary)]">
                      Revenue
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold text-[var(--text-secondary)]">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {stationReport.map((station) => (
                    <tr
                      key={station.id}
                      className="border-b border-[var(--border-primary)] transition hover:bg-[var(--bg-tertiary)]"
                    >
                      <td className="px-5 py-5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                            {station.name}
                          </p>

                          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                            {station.stationId}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-5">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                          {station.bookings}
                        </span>
                      </td>

                      <td className="px-4 py-5">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                          {station.sessions}
                        </span>
                      </td>

                      <td className="px-4 py-5">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            {formatNumber(
                              station.energy,
                              2,
                            )}{" "}
                            kWh
                          </p>

                          <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--bg-tertiary)]">
                            <div
                              className="h-1.5 rounded-full bg-violet-400"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (station.energy /
                                    Math.max(
                                      ...stationReport.map(
                                        (item) =>
                                          item.energy,
                                      ),
                                      1,
                                    )) *
                                    100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-5">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            {formatCurrency(
                              station.revenue,
                            )}
                          </p>

                          <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--bg-tertiary)]">
                            <div
                              className="h-1.5 rounded-full bg-emerald-400"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (station.revenue /
                                    maxStationRevenue) *
                                    100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-5">
                        <span
                          className={`report-status-badge inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusClass(
                            station.status ||
                              "Inactive",
                          )}`}
                        >
                          {station.status ||
                            "Unknown"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="grid gap-3 p-3 lg:hidden sm:p-4">
              {stationReport.map((station) => (
                <div
                  key={station.id}
                  className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {station.name}
                      </p>

                      <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                        {station.stationId}
                      </p>
                    </div>

                    <span
                      className={`report-status-badge shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium ${getStatusClass(
                        station.status ||
                          "Inactive",
                      )}`}
                    >
                      {station.status ||
                        "Unknown"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MobileMetric
                      label="Bookings"
                      value={String(
                        station.bookings,
                      )}
                    />

                    <MobileMetric
                      label="Sessions"
                      value={String(
                        station.sessions,
                      )}
                    />

                    <MobileMetric
                      label="Energy"
                      value={`${formatNumber(
                        station.energy,
                        2,
                      )} kWh`}
                    />

                    <MobileMetric
                      label="Revenue"
                      value={formatCurrency(
                        station.revenue,
                      )}
                    />
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                      <span>Booking activity</span>

                      <span>
                        {station.bookings} bookings
                      </span>
                    </div>

                    <div className="mt-2 h-1.5 rounded-full bg-[var(--bg-tertiary)]">
                      <div
                        className="h-1.5 rounded-full bg-cyan-400"
                        style={{
                          width: `${Math.min(
                            100,
                            (station.bookings /
                              maxStationBookings) *
                              100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Charger Utilization + Payment Methods */}
      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)]">
          <SectionHeader
            icon={
              <BatteryCharging className="h-4 w-4" />
            }
            title="Charger Utilization"
            description="Current charger state and charging activity."
          />

          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniMetric
                label="Total"
                value={chargers.length}
              />

              <MiniMetric
                label="Available"
                value={
                  chargers.filter(
                    (item) =>
                      item.status === "Available",
                  ).length
                }
                valueClass="text-emerald-300"
              />

              <MiniMetric
                label="Charging"
                value={
                  chargers.filter(
                    (item) =>
                      item.status === "Charging",
                  ).length
                }
                valueClass="text-cyan-300"
              />

              <MiniMetric
                label="Maintenance"
                value={
                  chargers.filter(
                    (item) =>
                      item.status ===
                      "Maintenance",
                  ).length
                }
                valueClass="text-amber-300"
              />
            </div>

            <div className="mt-5 space-y-3">
              {chargerReport.map((charger) => (
                <div
                  key={charger.id}
                  className="flex flex-col gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                      <Zap className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[var(--text-primary)]">
                        {charger.chargerId}
                      </p>

                      <p className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">
                        {getStationName(
                          charger.stationId,
                          stations,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        Sessions
                      </p>

                      <p className="mt-0.5 text-xs font-semibold text-[var(--text-primary)]">
                        {charger.sessions}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        Energy
                      </p>

                      <p className="mt-0.5 text-xs font-semibold text-[var(--text-primary)]">
                        {formatNumber(
                          charger.energy,
                          1,
                        )}{" "}
                        kWh
                      </p>
                    </div>

                    <span
                      className={`report-status-badge rounded-full border px-2.5 py-1 text-[10px] font-medium ${getStatusClass(
                        charger.status ||
                          "Unknown",
                      )}`}
                    >
                      {charger.status ||
                        "Unknown"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)]">
          <SectionHeader
            icon={<PieChart className="h-4 w-4" />}
            title="Payment Methods"
            description="Successful payment collection by payment method."
          />

          <div className="p-4 sm:p-5">
            {paymentMethodReport.length === 0 ? (
              <div className="flex min-h-[220px] items-center justify-center text-sm text-[var(--text-muted)]">
                No payment data available.
              </div>
            ) : (
              <div className="space-y-5">
                {paymentMethodReport.map((item) => {
                  const percentage =
                    totalRevenue > 0
                      ? (item.amount /
                          totalRevenue) *
                        100
                      : 0;

                  return (
                    <div key={item.method}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-primary)]">
                            {item.method}
                          </p>

                          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                            {item.count} successful
                            payment
                            {item.count !== 1
                              ? "s"
                              : ""}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            {formatCurrency(
                              item.amount,
                            )}
                          </p>

                          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                            {formatNumber(
                              percentage,
                              1,
                            )}
                            %
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 h-2 rounded-full bg-[var(--bg-tertiary)]">
                        <div
                          className="h-2 rounded-full bg-cyan-400"
                          style={{
                            width: `${Math.min(
                              100,
                              percentage,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* System Summary */}
      <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <SummaryCard
          icon={<Users className="h-5 w-5" />}
          label="Active Users"
          value={activeUsers}
          description={`of ${users.length} registered users`}
        />

        <SummaryCard
          icon={<MapPin className="h-5 w-5" />}
          label="Active Stations"
          value={activeStations}
          description={`of ${stations.length} total stations`}
        />

        <SummaryCard
          icon={<Clock3 className="h-5 w-5" />}
          label="Report Period"
          value={
            range === "all"
              ? "All Time"
              : `${range} Days`
          }
          description="Current analytics window"
        />
      </section>

      <style>{`
        html.light .report-status-badge {
          color: #334155 !important;
        }

        html.light .reports-refresh-button {
          color: #000000 !important;
        }

        html.light .reports-range-select {
          color: #000000 !important;
          background-color: #ffffff !important;
          color-scheme: light !important;
        }

        html.light .reports-range-select option {
          color: #000000 !important;
          background-color: #ffffff !important;
        }

        html.light .reports-range-select + svg {
          color: #000000 !important;
        }

        html.dark .reports-range-select {
          color-scheme: dark !important;
        }
      `}</style>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  valueClass = "text-[var(--text-primary)]",
}: {
  label: string;
  value: number | string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>

      <p
        className={`mt-1.5 truncate text-lg font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function MobileMetric({
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

      <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
  className,
}: {
  label: string;
  value: number;
  total: number;
  className: string;
}) {
  const percentage =
    total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-[var(--text-secondary)]">
          {label}
        </span>

        <span className="font-medium text-[var(--text-primary)]">
          {value}{" "}
          <span className="text-[var(--text-muted)]">
            ({formatNumber(percentage, 1)}%)
          </span>
        </span>
      </div>

      <div className="mt-2 h-2 rounded-full bg-[var(--bg-tertiary)]">
        <div
          className={`h-2 rounded-full ${className}`}
          style={{
            width: `${Math.min(
              100,
              percentage,
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 sm:p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-[var(--text-muted)]">
          {label}
        </p>

        <p className="mt-1 truncate text-xl font-bold text-[var(--text-primary)]">
          {value}
        </p>

        <p className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">
          {description}
        </p>
      </div>
    </div>
  );
}