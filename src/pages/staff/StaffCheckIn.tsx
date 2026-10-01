import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

type BookingStatus =
  | "Pending"
  | "Confirmed"
  | "Checked In"
  | "Charging"
  | "Completed"
  | "Cancelled"
  | "No Show";

interface Booking {
  id: string;
  bookingId: string;
  userId?: string;
  customerId?: string;
  customerName?: string;
  vehicleId?: string;
  stationId: string;
  chargerId?: string;
  slotId?: string;
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  status: BookingStatus;
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
  stationCode?: string;
  address?: string;
  city?: string;
}

interface Charger {
  id: string;
  chargerId: string;
  stationId: string;
  chargerNumber?: string;
  chargerType?: string;
  connectorType?: string;
  status?: string;
}

interface Slot {
  id: string;
  slotId: string;
  stationId: string;
  chargerId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
}

interface Vehicle {
  id: string;
  vehicleId?: string;
  customerId?: string;
  userId?: string;
  vehicleNumber?: string;
  registrationNumber?: string;
  brand?: string;
  model?: string;
  vehicleType?: string;
  connectorType?: string;
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

function getStatusClasses(status: BookingStatus) {
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
  value: number;
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

          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
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

export default function StaffCheckIn() {
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [station, setStation] = useState<Station | null>(null);

  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [showTodayOnly, setShowTodayOnly] = useState(false);

  const [selectedBooking, setSelectedBooking] =
    useState<Booking | null>(null);

  const assignedStationId =
    user?.assignedStationId || "";

  const today = getTodayDate();

  const fetchData = async () => {
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
        bookingsResponse,
        usersResponse,
        vehiclesResponse,
        stationsResponse,
        chargersResponse,
        slotsResponse,
      ] = await Promise.all([
        api.get<Booking[]>("/bookings"),
        api.get<UserRecord[]>("/users"),
        api.get<Vehicle[]>("/vehicles"),
        api.get<Station[]>("/stations"),
        api.get<Charger[]>("/chargers"),
        api.get<Slot[]>("/slots"),
      ]);

      const allStations = stationsResponse.data || [];

      const assignedStation =
        allStations.find(
          (item) =>
            item.stationId === assignedStationId ||
            item.id === assignedStationId
        ) || null;

      setStation(assignedStation);

      const stationMatches = (stationId?: string) =>
        stationId === assignedStationId ||
        stationId === assignedStation?.stationId ||
        stationId === assignedStation?.id;

      setBookings(
        (bookingsResponse.data || []).filter((booking) =>
          stationMatches(booking.stationId)
        )
      );

      setChargers(
        (chargersResponse.data || []).filter((charger) =>
          stationMatches(charger.stationId)
        )
      );

      setSlots(
        (slotsResponse.data || []).filter((slot) =>
          stationMatches(slot.stationId)
        )
      );

      setUsers(usersResponse.data || []);
      setVehicles(vehiclesResponse.data || []);
    } catch (err) {
      console.error("Failed to load check-in data:", err);

      setError(
        "Unable to load check-in data. Please check JSON Server and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [assignedStationId]);

  /*
   * Lock background scrolling when the verification popup opens.
   */
  useEffect(() => {
    if (!selectedBooking) return;

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
  }, [selectedBooking]);

  const getCustomer = (booking: Booking) => {
    const customerId =
      booking.userId || booking.customerId;

    return users.find(
      (item) =>
        item.id === customerId ||
        item.userId === customerId
    );
  };

  const getVehicle = (booking: Booking) =>
    vehicles.find(
      (vehicle) =>
        vehicle.id === booking.vehicleId ||
        vehicle.vehicleId === booking.vehicleId
    );

  const getCharger = (booking: Booking) =>
    chargers.find(
      (charger) =>
        charger.id === booking.chargerId ||
        charger.chargerId === booking.chargerId
    );

  const getSlot = (booking: Booking) =>
    slots.find(
      (slot) =>
        slot.id === booking.slotId ||
        slot.slotId === booking.slotId
    );

  /*
   * Staff check-in page focuses on bookings that can
   * be checked in or have already been checked in.
   */
  const checkInBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings
      .filter((booking) => {
        const customer = getCustomer(booking);
        const vehicle = getVehicle(booking);
        const charger = getCharger(booking);

        const searchableText = [
          booking.bookingId,
          booking.customerName || "",
          customer?.name || "",
          customer?.email || "",
          vehicle?.vehicleNumber || "",
          vehicle?.registrationNumber || "",
          charger?.chargerId || booking.chargerId || "",
          booking.slotId || "",
          booking.status,
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !query || searchableText.includes(query);

        const matchesDate =
          !showTodayOnly ||
          normalizeDate(booking.bookingDate) === today;

        const relevantStatus =
          booking.status === "Confirmed" ||
          booking.status === "Checked In" ||
          booking.status === "Charging";

        return (
          matchesSearch &&
          matchesDate &&
          relevantStatus
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
  }, [
    bookings,
    users,
    vehicles,
    chargers,
    search,
    showTodayOnly,
    today,
  ]);

  const todayConfirmed = bookings.filter(
    (booking) =>
      normalizeDate(booking.bookingDate) === today &&
      booking.status === "Confirmed"
  ).length;

  const pendingCheckIns = bookings.filter(
    (booking) => booking.status === "Confirmed"
  ).length;

  const checkedInToday = bookings.filter(
    (booking) =>
      normalizeDate(booking.bookingDate) === today &&
      booking.status === "Checked In"
  ).length;

  const chargingToday = bookings.filter(
    (booking) =>
      normalizeDate(booking.bookingDate) === today &&
      booking.status === "Charging"
  ).length;

  const handleCheckIn = async (booking: Booking) => {
    if (booking.status !== "Confirmed") {
      setError(
        "Only confirmed bookings can be checked in."
      );
      return;
    }

    const vehicle = getVehicle(booking);

    if (!vehicle) {
      setError(
        "This booking does not have a valid vehicle."
      );
      return;
    }

    const charger = getCharger(booking);

    if (!charger) {
      setError(
        "The charger assigned to this booking could not be found."
      );
      return;
    }

    if (
      charger.status === "Maintenance" ||
      charger.status === "Offline"
    ) {
      setError(
        `Check-in is unavailable because charger ${charger.chargerId} is ${charger.status}.`
      );
      return;
    }

    try {
      setCheckingIn(true);
      setError("");
      setSuccess("");

      /*
       * Booking:
       * Confirmed -> Checked In
       */
      await api.patch(`/bookings/${booking.id}`, {
        status: "Checked In",
      });

      /*
       * Keep the charger reserved/occupied for
       * the checked-in customer.
       */
      await api.patch(`/chargers/${charger.id}`, {
        status: "Occupied",
      });

      /*
       * Create activity record required by the project.
       */
      const activityId = `ACT${Date.now()}`;

      const customer = getCustomer(booking);

      try {
        await api.post("/activities", {
          id: activityId,
          activityId,
          userId: user?.id || "",
          userName: user?.name || "Staff",
          action: "Customer Checked In",
          description: `${
            customer?.name ||
            booking.customerName ||
            "Customer"
          } checked in for booking ${
            booking.bookingId
          }.`,
          relatedRecordId: booking.bookingId,
          timestamp: new Date().toISOString(),
        });
      } catch (activityError) {
        console.error(
          "Unable to record check-in activity:",
          activityError
        );
      }

      setSelectedBooking(null);

      setSuccess(
        `Customer checked in successfully for booking ${booking.bookingId}.`
      );

      await fetchData();
    } catch (err) {
      console.error("Customer check-in failed:", err);

      setError(
        "Unable to complete customer check-in. Please try again."
      );
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-cyan-400" />

          <p className="text-sm text-[var(--text-secondary)]">
            Loading check-in data...
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
              Customer Check-In
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Verify confirmed bookings, customer details,
              vehicles and charging information before
              check-in.
            </p>

            {station && (
              <p className="mt-2 text-sm font-medium text-cyan-700 dark:text-cyan-300">
                {station.name}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => void fetchData()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] dark:border-white/10 dark:bg-white/5 px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white hover:text-black"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      {/* Success */}
      {success && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
          <div className="flex min-w-0 items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" />

            <p className="text-sm font-medium text-emerald-200">
              {success}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="shrink-0 text-emerald-700 dark:text-emerald-300 transition hover:text-[var(--text-primary)]"
            aria-label="Close success message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
          <div className="flex min-w-0 items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700 dark:text-red-300" />

            <p className="text-sm font-medium text-red-200">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0 text-red-700 dark:text-red-300 transition hover:text-[var(--text-primary)]"
            aria-label="Close error message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Statistics */}
      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Confirmed"
          value={todayConfirmed}
          description="Confirmed bookings today"
          icon={<CalendarDays className="h-5 w-5" />}
        />

        <StatCard
          title="Pending Check-Ins"
          value={pendingCheckIns}
          description="Waiting for customer check-in"
          icon={<Clock3 className="h-5 w-5" />}
        />

        <StatCard
          title="Checked In Today"
          value={checkedInToday}
          description="Customers successfully checked in"
          icon={<UserCheck className="h-5 w-5" />}
        />

        <StatCard
          title="Charging Today"
          value={chargingToday}
          description="Checked-in customers now charging"
          icon={<Zap className="h-5 w-5" />}
        />
      </section>

      {/* Search */}
      <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] dark:border-white/10 dark:bg-[#0D1B2A] p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Find Booking
          </h2>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Search by booking ID, customer, vehicle,
            charger or slot.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-primary)]" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search booking ID, customer, vehicle..."
              className="h-11 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--card-bg)] dark:border-white/10 dark:bg-[var(--input-bg)] pl-11 pr-4 text-sm text-[var(--input-text)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              setShowTodayOnly((current) => !current)
            }
            className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition ${
              showTodayOnly
                ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-700 dark:text-cyan-300"
                : "border-[var(--border-primary)] bg-[var(--bg-tertiary)] dark:border-white/10 dark:bg-white/5 text-[var(--text-primary)] hover:bg-white hover:text-black"
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Today Only
          </button>

          {(search || showTodayOnly) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setShowTodayOnly(false);
              }}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] dark:border-white/10 dark:bg-white/5 px-4 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white hover:text-black"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </section>

      {/* Check-in bookings */}
      <section className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] dark:border-white/10 dark:bg-[#0D1B2A]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-primary)] dark:border-white/10 p-5">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Check-In Bookings
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {checkInBookings.length} booking
              {checkInBookings.length === 1 ? "" : "s"}{" "}
              available
            </p>
          </div>

          <ShieldCheck className="h-5 w-5 shrink-0 text-cyan-400" />
        </div>

        {checkInBookings.length === 0 ? (
          <div className="p-6">
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] dark:border-white/10 dark:bg-white/[0.02] p-8 text-center">
              <UserCheck className="mx-auto h-9 w-9 text-slate-600" />

              <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
                No check-in bookings found
              </p>

              <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                Confirmed bookings waiting for check-in
                will appear here.
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
                  <col className="w-[19%]" />
                  <col className="w-[16%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[13%]" />
                  <col className="w-[9%]" />
                  <col className="w-[5%]" />
                </colgroup>

                <thead>
                  <tr className="border-b border-[var(--border-primary)] dark:border-white/10">
                    <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Booking
                    </th>

                    <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Customer
                    </th>

                    <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Vehicle
                    </th>

                    <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Charger
                    </th>

                    <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Date
                    </th>

                    <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Time
                    </th>

                    <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Status
                    </th>

                    <th className="px-3 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border-primary)] dark:divide-white/5">
                  {checkInBookings.map((booking) => {
                    const customer =
                      getCustomer(booking);

                    const vehicle =
                      getVehicle(booking);

                    const charger =
                      getCharger(booking);

                    return (
                      <tr
                        key={booking.id}
                        className="transition hover:bg-slate-100 dark:hover:bg-white/[0.02]"
                      >
                        <td className="px-3 py-5">
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                            {booking.bookingId}
                          </p>
                        </td>

                        <td className="px-3 py-5">
                          <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                            {customer?.name ||
                              booking.customerName ||
                              "Customer"}
                          </p>

                          <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                            {customer?.email || "—"}
                          </p>
                        </td>

                        <td className="px-3 py-5">
                          <p className="truncate text-sm text-[var(--text-secondary)]">
                            {vehicle?.vehicleNumber ||
                              vehicle?.registrationNumber ||
                              booking.vehicleId ||
                              "—"}
                          </p>
                        </td>

                        <td className="px-3 py-5">
                          <p className="truncate text-sm text-[var(--text-secondary)]">
                            {charger?.chargerId ||
                              booking.chargerId ||
                              "—"}
                          </p>
                        </td>

                        <td className="px-3 py-5">
                          <p className="text-sm text-[var(--text-secondary)]">
                            {formatDate(
                              booking.bookingDate
                            )}
                          </p>
                        </td>

                        <td className="px-3 py-5">
                          <p className="text-sm text-[var(--text-secondary)]">
                            {formatTime(
                              booking.startTime
                            )}
                          </p>

                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            to{" "}
                            {formatTime(
                              booking.endTime
                            )}
                          </p>
                        </td>

                        <td className="px-3 py-5">
                          <span
                            className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-medium ${getStatusClasses(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </td>

                        <td className="px-3 py-5">
                          <div className="flex justify-end">
                            <ActionButton
                              label="Verify Booking"
                              onClick={() =>
                                setSelectedBooking(
                                  booking
                                )
                              }
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
              {checkInBookings.map((booking) => {
                const customer =
                  getCustomer(booking);

                const vehicle =
                  getVehicle(booking);

                const charger =
                  getCharger(booking);

                return (
                  <div
                    key={booking.id}
                    className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] dark:border-white/10 dark:bg-white/[0.02] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                          {booking.bookingId}
                        </p>

                        <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                          {customer?.name ||
                            booking.customerName ||
                            "Customer"}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-medium ${getStatusClasses(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <DetailItem
                        label="Vehicle"
                        value={
                          vehicle?.vehicleNumber ||
                          vehicle?.registrationNumber ||
                          booking.vehicleId ||
                          "—"
                        }
                      />

                      <DetailItem
                        label="Charger"
                        value={
                          charger?.chargerId ||
                          booking.chargerId ||
                          "—"
                        }
                      />

                      <DetailItem
                        label="Date"
                        value={formatDate(
                          booking.bookingDate
                        )}
                      />

                      <DetailItem
                        label="Time"
                        value={formatTime(
                          booking.startTime
                        )}
                      />
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedBooking(
                            booking
                          )
                        }
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 text-xs font-semibold text-cyan-700 dark:text-cyan-300 transition hover:bg-cyan-400 hover:text-black"
                      >
                        <Eye className="h-4 w-4" />
                        Verify
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Verification popup */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center overflow-hidden bg-black/70 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[var(--card-bg)] dark:bg-[#0D1A2A] shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-2rem)]">
            {/* Popup header */}
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-primary)] dark:border-white/10 px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-cyan-400" />

                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    Verify Customer Check-In
                  </h2>
                </div>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {selectedBooking.bookingId}
                </p>
              </div>

              <button
                type="button"
                disabled={checkingIn}
                onClick={() =>
                  setSelectedBooking(null)
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] dark:border-white/10 dark:bg-white/5 text-[var(--text-primary)] transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Popup content */}
            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6">
                {/* Status */}
                <div className="mb-5 flex flex-col gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                      Booking Status
                    </p>

                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                      {selectedBooking.status}
                    </p>
                  </div>

                  <span
                    className={`self-start rounded-full border px-3 py-1 text-xs font-medium sm:self-auto ${getStatusClasses(
                      selectedBooking.status
                    )}`}
                  >
                    {selectedBooking.status}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Booking ID"
                    value={
                      selectedBooking.bookingId
                    }
                  />

                  <DetailItem
                    label="Customer Name"
                    value={
                      getCustomer(
                        selectedBooking
                      )?.name ||
                      selectedBooking.customerName ||
                      "Customer"
                    }
                  />

                  <DetailItem
                    label="Customer Email"
                    value={
                      getCustomer(
                        selectedBooking
                      )?.email || "—"
                    }
                  />

                  <DetailItem
                    label="Customer Phone"
                    value={
                      getCustomer(
                        selectedBooking
                      )?.phone || "—"
                    }
                  />

                  <DetailItem
                    label="Vehicle Number"
                    value={
                      getVehicle(
                        selectedBooking
                      )?.vehicleNumber ||
                      getVehicle(
                        selectedBooking
                      )?.registrationNumber ||
                      selectedBooking.vehicleId ||
                      "—"
                    }
                  />

                  <DetailItem
                    label="Vehicle"
                    value={
                      [
                        getVehicle(
                          selectedBooking
                        )?.brand,
                        getVehicle(
                          selectedBooking
                        )?.model,
                      ]
                        .filter(Boolean)
                        .join(" ") || "—"
                    }
                  />

                  <DetailItem
                    label="Station"
                    value={station?.name || "—"}
                  />

                  <DetailItem
                    label="Station Code"
                    value={
                      station?.stationCode ||
                      station?.stationId ||
                      "—"
                    }
                  />

                  <DetailItem
                    label="Charger"
                    value={
                      getCharger(
                        selectedBooking
                      )?.chargerId ||
                      selectedBooking.chargerId ||
                      "—"
                    }
                  />

                  <DetailItem
                    label="Charger Type"
                    value={
                      getCharger(
                        selectedBooking
                      )?.chargerType || "—"
                    }
                  />

                  <DetailItem
                    label="Connector"
                    value={
                      getCharger(
                        selectedBooking
                      )?.connectorType || "—"
                    }
                  />

                  <DetailItem
                    label="Slot"
                    value={
                      getSlot(selectedBooking)
                        ?.slotId ||
                      selectedBooking.slotId ||
                      "—"
                    }
                  />

                  <DetailItem
                    label="Booking Date"
                    value={formatDate(
                      selectedBooking.bookingDate
                    )}
                  />

                  <DetailItem
                    label="Booking Time"
                    value={`${formatTime(
                      selectedBooking.startTime
                    )} - ${formatTime(
                      selectedBooking.endTime
                    )}`}
                  />
                </div>

                {/* Verification checklist */}
                <div className="mt-5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] dark:border-white/10 dark:bg-white/[0.02] p-4">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Check-In Verification
                  </h3>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      Booking verified
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      {getCustomer(
                        selectedBooking
                      ) ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                      )}
                      Customer verified
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      {getVehicle(
                        selectedBooking
                      ) ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                      )}
                      Vehicle verified
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      {getCharger(
                        selectedBooking
                      ) ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                      )}
                      Charger verified
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Popup footer */}
            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-white/10 bg-[var(--card-bg)] dark:bg-[#0D1A2A] px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
              <button
                type="button"
                disabled={checkingIn}
                onClick={() =>
                  setSelectedBooking(null)
                }
                className="h-10 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] dark:border-white/10 dark:bg-white/5 px-5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>

              {selectedBooking.status ===
                "Confirmed" && (
                <button
                  type="button"
                  disabled={checkingIn}
                  onClick={() =>
                    void handleCheckIn(
                      selectedBooking
                    )
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-5 text-sm font-semibold text-cyan-700 dark:text-cyan-300 transition hover:bg-cyan-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {checkingIn ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Checking In...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" />
                      Check In Customer
                    </>
                  )}
                </button>
              )}

              {selectedBooking.status ===
                "Checked In" && (
                <span className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Already Checked In
                </span>
              )}

              {selectedBooking.status ===
                "Charging" && (
                <span className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-5 text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                  <Zap className="h-4 w-4" />
                  Charging Started
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}