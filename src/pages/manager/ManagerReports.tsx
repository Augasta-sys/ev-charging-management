import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  RefreshCw,
  RotateCcw,
  Wrench,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

interface Station {
  id: string;
  stationId: string;
  name: string;
}

interface Charger {
  id: string;
  chargerId: string;
  stationId: string;
  status?: string;
}

interface Booking {
  id: string;
  bookingId: string;
  stationId: string;
  bookingDate?: string;
  status?: string;
  amount?: number;
  totalAmount?: number;
  createdDate?: string;
}

interface ChargingSession {
  id: string;
  sessionId: string;
  stationId: string;
  status?: string;
  startTime?: string;
  startDate?: string;
  createdDate?: string;
  energyConsumed?: number;
  unitsConsumed?: number;
  chargingCost?: number;
  totalAmount?: number;
  amount?: number;
}

interface Payment {
  id: string;
  paymentId: string;
  stationId?: string;
  bookingId?: string;
  sessionId?: string;
  amount?: number;
  status?: string;
  paymentStatus?: string;
  paymentDate?: string;
  createdDate?: string;
}

interface MaintenanceRecord {
  id: string;
  maintenanceId: string;
  stationId: string;
  chargerId?: string;
  status?: string;
  reportedDate?: string;
  createdDate?: string;
}

type DateFilter = "All" | "Today" | "7 Days" | "30 Days";

function getDateOnly(value?: string) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);

  return date;
}

function isWithinFilter(
  value: string | undefined,
  filter: DateFilter
) {
  if (filter === "All") {
    return true;
  }

  const itemDate = getDateOnly(value);

  if (!itemDate) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (filter === "Today") {
    return itemDate.getTime() === today.getTime();
  }

  const startDate = new Date(today);

  if (filter === "7 Days") {
    startDate.setDate(today.getDate() - 6);
  }

  if (filter === "30 Days") {
    startDate.setDate(today.getDate() - 29);
  }

  return (
    itemDate.getTime() >= startDate.getTime() &&
    itemDate.getTime() <= today.getTime()
  );
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
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

function ProgressRow({
  label,
  value,
  total,
  displayValue,
}: {
  label: string;
  value: number;
  total: number;
  displayValue?: string;
}) {
  const percentage =
    total > 0
      ? Math.min(100, Math.max(0, (value / total) * 100))
      : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--text-secondary)]">{label}</p>

        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {displayValue ?? value}
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4">
      <p className="min-w-0 text-sm text-[var(--text-secondary)]">
        {label}
      </p>

      <p className="shrink-0 text-sm font-semibold text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

export default function ManagerReports() {
  const { user } = useAuth();

  const [station, setStation] = useState<Station | null>(null);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maintenance, setMaintenance] = useState<
    MaintenanceRecord[]
  >([]);

  const [dateFilter, setDateFilter] =
    useState<DateFilter>("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const assignedStationId = user?.assignedStationId || "";

  const fetchReportData = async () => {
    if (!assignedStationId) {
      setError("No station is assigned to this manager.");
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
        maintenanceResponse,
      ] = await Promise.all([
        api.get<Station[]>("/stations"),
        api.get<Charger[]>("/chargers"),
        api.get<Booking[]>("/bookings"),
        api.get<ChargingSession[]>("/chargingSessions"),
        api.get<Payment[]>("/payments"),
        api.get<MaintenanceRecord[]>("/maintenance"),
      ]);

      const allStations = stationsResponse.data || [];
      const allChargers = chargersResponse.data || [];
      const allBookings = bookingsResponse.data || [];
      const allSessions = sessionsResponse.data || [];
      const allPayments = paymentsResponse.data || [];
      const allMaintenance = maintenanceResponse.data || [];

      const assignedStation =
        allStations.find(
          (item) =>
            item.stationId === assignedStationId ||
            item.id === assignedStationId
        ) || null;

      setStation(assignedStation);

      const stationMatches = (stationId?: string) =>
        stationId === assignedStationId ||
        stationId === assignedStation?.id ||
        stationId === assignedStation?.stationId;

      const stationChargers = allChargers.filter((charger) =>
        stationMatches(charger.stationId)
      );

      const stationBookings = allBookings.filter((booking) =>
        stationMatches(booking.stationId)
      );

      const stationSessions = allSessions.filter((session) =>
        stationMatches(session.stationId)
      );

      const stationMaintenance = allMaintenance.filter((record) =>
        stationMatches(record.stationId)
      );

      /*
       * Some payment records may not contain stationId.
       * In that case, connect them through their booking/session.
       */
      const stationBookingIds = new Set(
        stationBookings.flatMap((booking) => [
          booking.id,
          booking.bookingId,
        ])
      );

      const stationSessionIds = new Set(
        stationSessions.flatMap((session) => [
          session.id,
          session.sessionId,
        ])
      );

      const stationPayments = allPayments.filter((payment) => {
        if (payment.stationId) {
          return stationMatches(payment.stationId);
        }

        if (
          payment.bookingId &&
          stationBookingIds.has(payment.bookingId)
        ) {
          return true;
        }

        if (
          payment.sessionId &&
          stationSessionIds.has(payment.sessionId)
        ) {
          return true;
        }

        return false;
      });

      setChargers(stationChargers);
      setBookings(stationBookings);
      setSessions(stationSessions);
      setPayments(stationPayments);
      setMaintenance(stationMaintenance);
    } catch (err) {
      console.error("Failed to load manager reports:", err);

      setError(
        "Unable to load report data. Please check JSON Server and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReportData();
  }, [assignedStationId]);

  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        isWithinFilter(
          booking.bookingDate || booking.createdDate,
          dateFilter
        )
      ),
    [bookings, dateFilter]
  );

  const filteredSessions = useMemo(
    () =>
      sessions.filter((session) =>
        isWithinFilter(
          session.startDate ||
            session.startTime ||
            session.createdDate,
          dateFilter
        )
      ),
    [sessions, dateFilter]
  );

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) =>
        isWithinFilter(
          payment.paymentDate || payment.createdDate,
          dateFilter
        )
      ),
    [payments, dateFilter]
  );

  const filteredMaintenance = useMemo(
    () =>
      maintenance.filter((record) =>
        isWithinFilter(
          record.reportedDate || record.createdDate,
          dateFilter
        )
      ),
    [maintenance, dateFilter]
  );

  const completedBookings = filteredBookings.filter(
    (booking) => booking.status === "Completed"
  ).length;

  const cancelledBookings = filteredBookings.filter(
    (booking) => booking.status === "Cancelled"
  ).length;

  const activeBookings = filteredBookings.filter(
    (booking) =>
      booking.status === "Pending" ||
      booking.status === "Confirmed" ||
      booking.status === "Checked In" ||
      booking.status === "Charging"
  ).length;

  const completedSessions = filteredSessions.filter(
    (session) => session.status === "Completed"
  ).length;

  const activeSessions = filteredSessions.filter(
    (session) =>
      session.status === "Charging" ||
      session.status === "Paused" ||
      session.status === "Not Started"
  ).length;

  const totalEnergy = filteredSessions.reduce(
    (total, session) =>
      total +
      Number(
        session.energyConsumed ??
          session.unitsConsumed ??
          0
      ),
    0
  );

  const successfulPayments = filteredPayments.filter(
    (payment) =>
      payment.status === "Paid" ||
      payment.paymentStatus === "Paid"
  );

  const pendingPayments = filteredPayments.filter(
    (payment) =>
      payment.status === "Pending" ||
      payment.paymentStatus === "Pending"
  ).length;

  const failedPayments = filteredPayments.filter(
    (payment) =>
      payment.status === "Failed" ||
      payment.paymentStatus === "Failed"
  ).length;

  const totalRevenue = successfulPayments.reduce(
    (total, payment) =>
      total + Number(payment.amount ?? 0),
    0
  );

  /*
   * Fallback for seed data where revenue may be stored on sessions
   * rather than payment records.
   */
  const sessionRevenue = filteredSessions.reduce(
    (total, session) =>
      total +
      Number(
        session.chargingCost ??
          session.totalAmount ??
          session.amount ??
          0
      ),
    0
  );

  const displayedRevenue =
    successfulPayments.length > 0
      ? totalRevenue
      : sessionRevenue;

  const availableChargers = chargers.filter(
    (charger) => charger.status === "Available"
  ).length;

  const occupiedChargers = chargers.filter(
    (charger) =>
      charger.status === "Booked" ||
      charger.status === "Charging" ||
      charger.status === "Occupied"
  ).length;

  const maintenanceChargers = chargers.filter(
    (charger) => charger.status === "Maintenance"
  ).length;

  const offlineChargers = chargers.filter(
    (charger) => charger.status === "Offline"
  ).length;

  const reportedMaintenance = filteredMaintenance.filter(
    (record) => record.status === "Reported"
  ).length;

  const scheduledMaintenance = filteredMaintenance.filter(
    (record) => record.status === "Scheduled"
  ).length;

  const inProgressMaintenance = filteredMaintenance.filter(
    (record) => record.status === "In Progress"
  ).length;

  const completedMaintenance = filteredMaintenance.filter(
    (record) => record.status === "Completed"
  ).length;

  const chargerUtilization =
    chargers.length > 0
      ? (occupiedChargers / chargers.length) * 100
      : 0;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-cyan-400" />

          <p className="text-sm text-[var(--text-secondary)]">
            Loading manager reports...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <style>{`
        html.dark .manager-reports-banner {
          background-color: #0D1B2A !important;
          color: #FFFFFF !important;
        }

        html.dark .manager-reports-banner h1,
        html.dark .manager-reports-banner h2,
        html.dark .manager-reports-banner p,
        html.dark .manager-reports-banner span {
          color: #FFFFFF !important;
        }

        html.dark .manager-reports-banner .text-cyan-300 {
          color: #22D3EE !important;
        }
      `}</style>

      {/* Header */}
      <section className="manager-reports-banner rounded-2xl border border-[var(--border-primary)] bg-white p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
                Manager Reports
              </span>

              {station && (
                <span className="rounded-full border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                  {station.stationId}
                </span>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Station Reports
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              View booking, charging, revenue, charger and
              maintenance performance for your assigned station.
            </p>

            {station && (
              <p className="mt-2 text-sm font-medium text-cyan-300">
                {station.name}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => void fetchReportData()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white hover:text-black"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4">
          <p className="text-sm font-medium text-red-200">
            {error}
          </p>
        </div>
      )}

      {/* Date filter */}
      <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-cyan-400" />

              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Report Period
              </h2>
            </div>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Select the period used for bookings, sessions,
              payments and maintenance.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                "All",
                "Today",
                "7 Days",
                "30 Days",
              ] as DateFilter[]
            ).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setDateFilter(filter)}
                className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                  dateFilter === filter
                    ? "border-cyan-400/30 bg-cyan-400/15 text-cyan-300"
                    : "border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-white hover:text-black"
                }`}
              >
                {filter}
              </button>
            ))}

            {dateFilter !== "All" && (
              <button
                type="button"
                onClick={() => setDateFilter("All")}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition hover:bg-white hover:text-black"
                title="Reset period"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main statistics */}
      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Bookings"
          value={filteredBookings.length}
          description={`${completedBookings} completed bookings`}
          icon={<CalendarDays className="h-5 w-5" />}
        />

        <StatCard
          title="Charging Sessions"
          value={filteredSessions.length}
          description={`${completedSessions} completed sessions`}
          icon={<Zap className="h-5 w-5" />}
        />

        <StatCard
          title="Energy Consumed"
          value={`${formatNumber(totalEnergy)} kWh`}
          description="Total charging energy"
          icon={<Activity className="h-5 w-5" />}
        />

        <StatCard
          title="Revenue"
          value={formatCurrency(displayedRevenue)}
          description="Revenue for selected period"
          icon={<IndianRupee className="h-5 w-5" />}
        />
      </section>

      {/* Booking + session reports */}
      <section className="grid min-w-0 gap-5 xl:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Booking Summary
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Booking status distribution for the selected period.
            </p>
          </div>

          <div className="space-y-5">
            <ProgressRow
              label="Completed"
              value={completedBookings}
              total={filteredBookings.length}
            />

            <ProgressRow
              label="Active"
              value={activeBookings}
              total={filteredBookings.length}
            />

            <ProgressRow
              label="Cancelled"
              value={cancelledBookings}
              total={filteredBookings.length}
            />

            <SummaryItem
              label="Total bookings"
              value={filteredBookings.length}
            />
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Charging Session Summary
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Charging activity and energy usage.
            </p>
          </div>

          <div className="space-y-5">
            <ProgressRow
              label="Completed Sessions"
              value={completedSessions}
              total={filteredSessions.length}
            />

            <ProgressRow
              label="Active Sessions"
              value={activeSessions}
              total={filteredSessions.length}
            />

            <SummaryItem
              label="Total sessions"
              value={filteredSessions.length}
            />

            <SummaryItem
              label="Energy consumed"
              value={`${formatNumber(totalEnergy)} kWh`}
            />
          </div>
        </div>
      </section>

      {/* Charger + revenue */}
      <section className="grid min-w-0 gap-5 xl:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Charger Utilization
              </h2>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Current charger availability at your station.
              </p>
            </div>

            <Zap className="h-5 w-5 shrink-0 text-cyan-400" />
          </div>

          <div className="mb-6 rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  Utilization
                </p>

                <p className="mt-1 text-3xl font-bold text-[var(--text-primary)]">
                  {chargerUtilization.toFixed(1)}%
                </p>
              </div>

              <p className="text-xs text-[var(--text-secondary)]">
                {occupiedChargers} / {chargers.length} in use
              </p>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                style={{
                  width: `${Math.min(
                    100,
                    chargerUtilization
                  )}%`,
                }}
              />
            </div>
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

            <div className="sm:col-span-2">
              <SummaryItem
                label="Offline"
                value={offlineChargers}
              />
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Payment & Revenue Summary
              </h2>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Payment performance for the selected period.
              </p>
            </div>

            <CreditCard className="h-5 w-5 shrink-0 text-cyan-400" />
          </div>

          <div className="mb-5 rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-5">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              Total Revenue
            </p>

            <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
              {formatCurrency(displayedRevenue)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryItem
              label="Total Payments"
              value={filteredPayments.length}
            />

            <SummaryItem
              label="Paid"
              value={successfulPayments.length}
            />

            <SummaryItem
              label="Pending"
              value={pendingPayments}
            />

            <SummaryItem
              label="Failed"
              value={failedPayments}
            />
          </div>
        </div>
      </section>

      {/* Maintenance */}
      <section className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Maintenance Summary
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Maintenance activity for the selected report period.
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-400/10 text-violet-300">
            <Wrench className="h-5 w-5" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryItem
            label="Total"
            value={filteredMaintenance.length}
          />

          <SummaryItem
            label="Reported"
            value={reportedMaintenance}
          />

          <SummaryItem
            label="Scheduled"
            value={scheduledMaintenance}
          />

          <SummaryItem
            label="In Progress"
            value={inProgressMaintenance}
          />

          <SummaryItem
            label="Completed"
            value={completedMaintenance}
          />
        </div>
      </section>

      {/* Overall station report */}
      <section className="rounded-2xl border border-[var(--border-primary)] bg-gradient-to-r from-cyan-400/5 via-[var(--card-bg)] to-violet-500/5 p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />

              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Station Performance Overview
              </h2>
            </div>

            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {station?.name || "Assigned Station"} •{" "}
              {dateFilter === "All"
                ? "All-time report"
                : `${dateFilter} report`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[var(--border-primary)] bg-black/10 px-4 py-3 text-center">
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {filteredBookings.length}
              </p>
              <p className="text-[10px] uppercase text-[var(--text-muted)]">
                Bookings
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border-primary)] bg-black/10 px-4 py-3 text-center">
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {filteredSessions.length}
              </p>
              <p className="text-[10px] uppercase text-[var(--text-muted)]">
                Sessions
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border-primary)] bg-black/10 px-4 py-3 text-center">
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {formatNumber(totalEnergy)}
              </p>
              <p className="text-[10px] uppercase text-[var(--text-muted)]">
                kWh
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border-primary)] bg-black/10 px-4 py-3 text-center">
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {formatCurrency(displayedRevenue)}
              </p>
              <p className="text-[10px] uppercase text-[var(--text-muted)]">
                Revenue
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
     );
}