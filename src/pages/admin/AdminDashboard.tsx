import {
  Activity,
  BatteryCharging,
  CalendarCheck,
  Car,
  CircleDollarSign,
  Clock3,
  Gauge,
  MapPin,
  RefreshCw,
  Server,
  Users,
  Zap,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, type ElementType } from "react";
import api from "../../services/api";

interface DashboardUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface DashboardStation {
  id: string;
  stationId: string;
  stationName: string;
  city: string;
  status: string;
  numberOfChargers: number;
  openingTime: string;
  closingTime: string;
}

interface DashboardCharger {
  id: string;
  chargerId: string;
  stationId: string;
  chargerType: string;
  status: string;
  powerOutput: number;
}

interface DashboardBooking {
  id: string;
  bookingId: string;
  customerName: string;
  stationName: string;
  chargerId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  amount: number;
}

interface DashboardSession {
  id: string;
  sessionId: string;
  bookingId: string;
  customerName: string;
  stationName: string;
  chargerId: string;
  energyConsumed: number;
  status: string;
}

interface DashboardPayment {
  id: string;
  paymentId: string;
  bookingId: string;
  customerName: string;
  amount: number;
  paymentStatus: string;
  paymentMethod: string;
  paymentDate: string;
}

interface DashboardActivity {
  id: string;
  activityId: string;
  type: string;
  description: string;
  userName: string;
  createdAt: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ElementType;
  iconClass: string;
  iconBg: string;
  onClick?: () => void;
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
  iconBg,
  onClick,
}: StatCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group w-full min-w-0 overflow-hidden rounded-2xl
        border border-[var(--border-primary)]
        bg-[var(--card-bg)]
        p-5 text-left
        shadow-lg shadow-black/10
        transition-all duration-300
        hover:-translate-y-1
        hover:border-cyan-400/30
        hover:bg-[var(--bg-secondary)]
        hover:shadow-lg hover:shadow-cyan-500/5
        focus:outline-none focus:ring-2 focus:ring-cyan-400/40
      "
    >
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--text-primary)]">
            {title}
          </p>

          <h3 className="mt-2 truncate text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {value}
          </h3>

          <p className="mt-2 truncate text-xs text-[var(--text-secondary)]">
            {subtitle}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}
          >
            <Icon className={`h-5 w-5 ${iconClass}`} />
          </div>

          <ArrowUpRight className="h-4 w-4 text-[var(--text-secondary)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-400" />
        </div>
      </div>
    </button>
  );
};

const statusStyles: Record<string, string> = {
  Available:
    "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
  Booked: "border-blue-400/20 bg-blue-400/10 text-blue-400",
  Charging: "border-cyan-400/20 bg-cyan-400/10 text-cyan-400",
  Occupied: "border-violet-400/20 bg-violet-400/10 text-violet-400",
  Maintenance: "border-amber-400/20 bg-amber-400/10 text-amber-400",
  Offline: "border-red-400/20 bg-red-400/10 text-red-400",
  Active: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
  Inactive: "border-slate-400/20 bg-slate-400/10 text-slate-400",
  "Under Maintenance":
    "border-amber-400/20 bg-amber-400/10 text-amber-400",
  "Temporarily Closed":
    "border-red-400/20 bg-red-400/10 text-red-400",
  Pending: "border-amber-400/20 bg-amber-400/10 text-amber-400",
  Confirmed: "border-blue-400/20 bg-blue-400/10 text-blue-400",
  "Checked In":
    "border-violet-400/20 bg-violet-400/10 text-violet-400",
  Completed:
    "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
  Cancelled: "border-red-400/20 bg-red-400/10 text-red-400",
  "No Show": "border-red-400/20 bg-red-400/10 text-red-400",
};

const getStatusClass = (status: string) =>
  statusStyles[status] ??
  "border-slate-400/20 bg-slate-400/10 text-slate-400";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date: string) => {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function AdminDashboard() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [stations, setStations] = useState<DashboardStation[]>([]);
  const [chargers, setChargers] = useState<DashboardCharger[]>([]);
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [sessions, setSessions] = useState<DashboardSession[]>([]);
  const [payments, setPayments] = useState<DashboardPayment[]>([]);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [
        usersResponse,
        stationsResponse,
        chargersResponse,
        bookingsResponse,
        sessionsResponse,
        paymentsResponse,
        activitiesResponse,
      ] = await Promise.all([
        api.get<DashboardUser[]>("/users"),
        api.get<DashboardStation[]>("/stations"),
        api.get<DashboardCharger[]>("/chargers"),
        api.get<DashboardBooking[]>("/bookings"),
        api.get<DashboardSession[]>("/chargingSessions"),
        api.get<DashboardPayment[]>("/payments"),
        api.get<DashboardActivity[]>("/activities"),
      ]);

      setUsers(usersResponse.data);
      setStations(stationsResponse.data);
      setChargers(chargersResponse.data);
      setBookings(bookingsResponse.data);
      setSessions(sessionsResponse.data);
      setPayments(paymentsResponse.data);
      setActivities(activitiesResponse.data);
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);

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

  const today = new Date().toISOString().split("T")[0];

  const todayBookings = useMemo(
    () =>
      bookings.filter((booking) => booking.bookingDate === today).length,
    [bookings, today],
  );

  const activeCharging = useMemo(
    () =>
      sessions.filter(
        (session) =>
          session.status === "Charging" ||
          session.status === "Paused",
      ).length,
    [sessions],
  );

  const totalRevenue = useMemo(
    () =>
      payments
        .filter((payment) => payment.paymentStatus === "Paid")
        .reduce(
          (total, payment) => total + Number(payment.amount || 0),
          0,
        ),
    [payments],
  );

  const activeUsers = useMemo(
    () => users.filter((user) => user.status === "Active").length,
    [users],
  );

  const networkEnergy = useMemo(
    () =>
      sessions.reduce(
        (total, session) =>
          total + Number(session.energyConsumed || 0),
        0,
      ),
    [sessions],
  );

  const chargerStatusCounts = useMemo(() => {
    return {
      Available: chargers.filter((item) => item.status === "Available")
        .length,
      Booked: chargers.filter((item) => item.status === "Booked").length,
      Charging: chargers.filter((item) => item.status === "Charging")
        .length,
      Maintenance: chargers.filter(
        (item) => item.status === "Maintenance",
      ).length,
      Offline: chargers.filter((item) => item.status === "Offline").length,
    };
  }, [chargers]);

  const recentBookings = useMemo(
    () =>
      [...bookings]
        .sort(
          (a, b) =>
            new Date(b.bookingDate).getTime() -
            new Date(a.bookingDate).getTime(),
        )
        .slice(0, 5),
    [bookings],
  );

  const recentActivities = useMemo(
    () =>
      [...activities]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        )
        .slice(0, 5),
    [activities],
  );

  const stationStatusCounts = useMemo(() => {
    return {
      Active: stations.filter((item) => item.status === "Active").length,
      Inactive: stations.filter((item) => item.status === "Inactive").length,
      Maintenance: stations.filter(
        (item) => item.status === "Under Maintenance",
      ).length,
      Closed: stations.filter(
        (item) => item.status === "Temporarily Closed",
      ).length,
    };
  }, [stations]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
            <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
          </div>

          <p className="text-sm text-[var(--text-primary)]">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-w-0">
        <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center justify-center">
          <div className="w-full rounded-2xl border border-red-400/20 bg-[var(--card-bg)] p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-400/10">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
              Dashboard unavailable
            </h2>

            <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-cyan-400">
            <Zap className="h-4 w-4 shrink-0" />
            <span>EV Charge Hub</span>
          </div>

          <h1 className="mt-2 truncate text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Admin Dashboard
          </h1>

          <p className="mt-1 text-sm text-[var(--text-primary)]">
            Monitor your charging network and manage operations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadDashboard(true)}
          disabled={refreshing}
          className="
            inline-flex w-full shrink-0 items-center justify-center gap-2
            rounded-xl
            border border-[var(--border-primary)]
            bg-[var(--card-bg)]
            px-4 py-2.5
            text-sm font-medium text-[var(--text-primary)]
            transition
            hover:border-cyan-400/30
            hover:bg-[var(--bg-secondary)]
            disabled:cursor-not-allowed
            disabled:opacity-60
            sm:w-auto
          "
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <section className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Stations"
          value={stations.length}
          subtitle="Charging locations"
          icon={MapPin}
          iconClass="text-cyan-400"
          iconBg="bg-cyan-400/10"
          onClick={() => navigate("/admin/stations")}
        />

        <StatCard
          title="Total Chargers"
          value={chargers.length}
          subtitle="Across all stations"
          icon={BatteryCharging}
          iconClass="text-violet-400"
          iconBg="bg-violet-400/10"
          onClick={() => navigate("/admin/chargers")}
        />

        <StatCard
          title="Today's Bookings"
          value={todayBookings}
          subtitle="Scheduled for today"
          icon={CalendarCheck}
          iconClass="text-blue-400"
          iconBg="bg-blue-400/10"
          onClick={() => navigate("/admin/bookings")}
        />

        <StatCard
          title="Active Charging"
          value={activeCharging}
          subtitle="Sessions in progress"
          icon={Zap}
          iconClass="text-emerald-400"
          iconBg="bg-emerald-400/10"
          onClick={() => navigate("/admin/charging-sessions")}
        />
      </section>

      {/* Secondary stats */}
      <section className="mt-4 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Revenue"
          value={formatCurrency(totalRevenue)}
          subtitle="Total paid transactions"
          icon={CircleDollarSign}
          iconClass="text-emerald-400"
          iconBg="bg-emerald-400/10"
          onClick={() => navigate("/admin/payments")}
        />

        <StatCard
          title="Active Users"
          value={activeUsers}
          subtitle={`${users.length} registered users`}
          icon={Users}
          iconClass="text-blue-400"
          iconBg="bg-blue-400/10"
          onClick={() => navigate("/admin/users")}
        />

        <StatCard
          title="Network Energy"
          value={`${networkEnergy.toFixed(1)} kWh`}
          subtitle="Energy delivered"
          icon={Gauge}
          iconClass="text-cyan-400"
          iconBg="bg-cyan-400/10"
          onClick={() => navigate("/admin/charging-sessions")}
        />
      </section>

      {/* Overview */}
      <section className="mt-6 grid w-full min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Charger Overview */}
        <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)]">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--border-primary)] p-5">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-[var(--text-primary)]">
                Charger Overview
              </h2>

              <p className="mt-1 text-xs text-[var(--text-primary)]">
                Current network availability
              </p>
            </div>

            <BatteryCharging className="h-5 w-5 shrink-0 text-cyan-400" />
          </div>

          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-5">
            {Object.entries(chargerStatusCounts).map(
              ([status, count]) => (
                <div
                  key={status}
                  className="min-w-0 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3"
                >
                  <div
                    className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg ${getStatusClass(
                      status,
                    )}`}
                  >
                    <BatteryCharging className="h-4 w-4" />
                  </div>

                  <p className="mt-3 truncate text-center text-lg font-bold text-[var(--text-primary)]">
                    {count}
                  </p>

                  <p className="mt-1 truncate text-center text-[11px] text-[var(--text-primary)]">
                    {status}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>

        {/* Station Status */}
        <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)]">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--border-primary)] p-5">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-[var(--text-primary)]">
                Station Status
              </h2>

              <p className="mt-1 text-xs text-[var(--text-primary)]">
                Network station health
              </p>
            </div>

            <Server className="h-5 w-5 shrink-0 text-violet-400" />
          </div>

          <div className="space-y-3 p-5">
            {[
              ["Active", stationStatusCounts.Active],
              ["Inactive", stationStatusCounts.Inactive],
              ["Under Maintenance", stationStatusCounts.Maintenance],
              ["Temporarily Closed", stationStatusCounts.Closed],
            ].map(([status, count]) => (
              <div
                key={String(status)}
                className="flex min-w-0 items-center justify-between gap-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      status === "Active"
                        ? "bg-emerald-400"
                        : status === "Inactive"
                          ? "bg-slate-500"
                          : status === "Under Maintenance"
                            ? "bg-amber-400"
                            : "bg-red-400"
                    }`}
                  />

                  <span className="truncate text-sm text-[var(--text-primary)]">
                    {status}
                  </span>
                </div>

                <span className="shrink-0 text-sm font-semibold text-[var(--text-primary)]">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent bookings */}
      <section className="mt-6 min-w-0 overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)]">
        <div className="flex flex-col gap-3 border-b border-[var(--border-primary)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Recent Bookings
            </h2>

            <p className="mt-1 text-xs text-[var(--text-primary)]">
              Latest booking activity across the network
            </p>
          </div>

          <CalendarCheck className="hidden h-5 w-5 shrink-0 text-blue-400 sm:block" />
        </div>

        {recentBookings.length === 0 ? (
          <div className="p-8 text-center">
            <CalendarCheck className="mx-auto h-8 w-8 text-[var(--text-primary)]" />

            <p className="mt-3 text-sm text-[var(--text-primary)]">
              No bookings available.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead>
                <tr className="border-b border-[var(--border-primary)] text-left">
                  <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-primary)]">
                    Booking
                  </th>

                  <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-primary)]">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-primary)]">
                    Station
                  </th>

                  <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-primary)]">
                    Date
                  </th>

                  <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-primary)]">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-primary)]">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-[var(--border-primary)] transition hover:bg-[var(--bg-secondary)]"
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-[var(--text-primary)]">
                        {booking.bookingId}
                      </div>

                      <div className="mt-1 text-xs text-[var(--text-primary)]">
                        {booking.chargerId}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-[var(--text-primary)]">
                      {booking.customerName}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex min-w-[180px] items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-cyan-400" />

                        <span
                          className="max-w-[220px] truncate text-sm font-medium text-[var(--text-primary)]"
                          title={booking.stationName}
                        >
                          {booking.stationName || "Station not available"}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-[var(--text-primary)]">
                      {formatDate(booking.bookingDate)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(
                          booking.status,
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-semibold text-[var(--text-primary)]">
                      {formatCurrency(Number(booking.amount || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Bottom sections */}
      <section className="mt-6 grid w-full min-w-0 grid-cols-1 gap-6">
        {/* Recent Activity */}
        <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)]">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--border-primary)] p-5">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Recent Activity
              </h2>

              <p className="mt-1 text-xs text-[var(--text-primary)]">
                Latest system events
              </p>
            </div>

            <Activity className="h-5 w-5 shrink-0 text-cyan-400" />
          </div>

          <div className="divide-y divide-[var(--border-primary)]">
            {recentActivities.length === 0 ? (
              <div className="p-8 text-center">
                <Activity className="mx-auto h-8 w-8 text-[var(--text-primary)]" />

                <p className="mt-3 text-sm text-[var(--text-primary)]">
                  No recent activity.
                </p>
              </div>
            ) : (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex min-w-0 gap-3 p-4 transition hover:bg-[var(--bg-secondary)]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                    <Activity className="h-4 w-4 text-cyan-400" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm leading-5 text-[var(--text-primary)]">
                      {activity.description}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-primary)]">
                      <span>{activity.userName}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{formatDate(activity.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Charging Stations */}
        <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)]">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--border-primary)] p-5">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Charging Stations
              </h2>

              <p className="mt-1 text-xs text-[var(--text-primary)]">
                Current station network
              </p>
            </div>

            <MapPin className="h-5 w-5 shrink-0 text-violet-400" />
          </div>

          {stations.length === 0 ? (
            <div className="p-8 text-center">
              <MapPin className="mx-auto h-8 w-8 text-[var(--text-primary)]" />

              <p className="mt-3 text-sm text-[var(--text-primary)]">
                No charging stations found.
              </p>
            </div>
          ) : (
            <div className="grid w-full min-w-0 grid-cols-1 gap-3 p-5 sm:grid-cols-2">
              {stations.slice(0, 4).map((station) => (
                <div
                  key={station.id}
                  className="
                    w-full min-w-0 overflow-hidden rounded-xl
                    border border-[var(--border-primary)]
                    bg-[var(--bg-secondary)]
                    p-4
                    transition-all duration-300
                    hover:border-cyan-400/20
                    hover:bg-[var(--bg-tertiary)]
                  "
                >
                  {/* Station header */}
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3
                        className="truncate text-sm font-semibold text-[var(--text-primary)]"
                        title={station.stationName}
                      >
                        {station.stationName}
                      </h3>

                      <div className="mt-1 flex min-w-0 items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-cyan-400" />

                        <span
                          className="truncate text-xs text-[var(--text-primary)]"
                          title={station.city}
                        >
                          {station.city}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-medium ${getStatusClass(
                        station.status,
                      )}`}
                    >
                      {station.status}
                    </span>
                  </div>

                  {/* Station details */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="min-w-0 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3">
                      <p className="text-[10px] uppercase tracking-wide text-[var(--text-primary)]">
                        Chargers
                      </p>

                      <div className="mt-1 flex items-center gap-2">
                        <BatteryCharging className="h-4 w-4 shrink-0 text-violet-400" />

                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {station.numberOfChargers}
                        </p>
                      </div>
                    </div>

                    <div className="min-w-0 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3">
                      <p className="text-[10px] uppercase tracking-wide text-[var(--text-primary)]">
                        Timing
                      </p>

                      <div className="mt-1 flex items-center gap-2">
                        <Clock3 className="h-4 w-4 shrink-0 text-cyan-400" />

                        <p
                          className="truncate text-xs font-medium text-[var(--text-primary)]"
                          title={`${station.openingTime} - ${station.closingTime}`}
                        >
                          {station.openingTime} - {station.closingTime}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Station ID */}
                  <div className="mt-3 flex min-w-0 items-center justify-between gap-3 border-t border-[var(--border-primary)] pt-3">
                    <span className="text-[10px] uppercase tracking-wide text-[var(--text-primary)]">
                      Station ID
                    </span>

                    <span
                      className="truncate text-xs font-medium text-[var(--text-primary)]"
                      title={station.stationId}
                    >
                      {station.stationId}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Network summary */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-cyan-400/10 bg-gradient-to-br from-[var(--card-bg)] via-[var(--bg-secondary)] to-[var(--bg-tertiary)] p-5 sm:p-6">
        <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10">
              <Car className="h-6 w-6 text-cyan-400" />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Network Summary
              </h2>

              <p className="mt-1 text-sm leading-6 text-[var(--text-primary)]">
                Your EV charging network currently has{" "}
                <span className="font-semibold text-cyan-400">
                  {stations.length} stations
                </span>{" "}
                and{" "}
                <span className="font-semibold text-violet-400">
                  {chargers.length} chargers
                </span>{" "}
                serving customers across the network.
              </p>
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-primary)]">
                Bookings
              </p>

              <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                {bookings.length}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-primary)]">
                Sessions
              </p>

              <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                {sessions.length}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-primary)]">
                Payments
              </p>

              <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                {payments.length}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-primary)]">
                Activities
              </p>

              <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                {activities.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer spacing */}
      <div className="h-4" />
    </div>
  );
}

export default AdminDashboard;