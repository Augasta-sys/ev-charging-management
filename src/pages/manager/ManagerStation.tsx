import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BatteryCharging,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  Settings2,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

type StationStatus =
  | "Active"
  | "Inactive"
  | "Under Maintenance"
  | "Temporarily Closed";

type ChargerStatus =
  | "Available"
  | "Booked"
  | "Charging"
  | "Occupied"
  | "Maintenance"
  | "Offline";

interface Station {
  id: string;
  stationId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  contactNumber?: string;
  phone?: string;
  operatingHours?: string;
  openingTime?: string;
  closingTime?: string;
  status: StationStatus;
  totalChargers?: number;
  description?: string;
  createdDate?: string;
}

interface Charger {
  id: string;
  chargerId: string;
  stationId: string;
  name?: string;
  chargerType?: string;
  connectorType?: string;
  powerOutput?: number;
  power?: number;
  status: ChargerStatus;
}

interface Booking {
  id: string;
  bookingId: string;
  stationId: string;
  bookingDate: string;
  startTime?: string;
  endTime?: string;
  status?: string;
}

interface ChargingSession {
  id: string;
  sessionId: string;
  stationId: string;
  status?: string;
  energyConsumed?: number;
  unitsConsumed?: number;
  chargingCost?: number;
  totalAmount?: number;
  amount?: number;
}

interface Maintenance {
  id: string;
  maintenanceId: string;
  stationId?: string;
  chargerId?: string;
  issue?: string;
  priority?: string;
  status?: string;
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
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

  const [hour, minute] = value.split(":");

  if (hour === undefined || minute === undefined) {
    return value;
  }

  const date = new Date();
  date.setHours(Number(hour), Number(minute), 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusClasses(status: StationStatus) {
  switch (status) {
    case "Active":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    case "Under Maintenance":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    case "Temporarily Closed":
      return "border-orange-400/20 bg-orange-400/10 text-orange-300";
    default:
      return "border-red-400/20 bg-red-400/10 text-red-300";
  }
}

function getChargerStatusClasses(status: ChargerStatus) {
  switch (status) {
    case "Available":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    case "Charging":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
    case "Booked":
      return "border-violet-400/20 bg-violet-400/10 text-violet-300";
    case "Occupied":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";
    case "Maintenance":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    default:
      return "border-slate-400/20 bg-slate-400/10 text-slate-300";
  }
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
    <div className="rounded-2xl border border-white/10 bg-[#0D1B2A] p-4 shadow-lg shadow-black/10 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/10 text-cyan-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-cyan-400">
        {icon}

        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>

      <p className="mt-2 break-words text-sm font-medium text-white">
        {value}
      </p>
    </div>
  );
}

function OverviewRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
          {icon}
        </div>

        <span className="truncate text-sm text-slate-300">{label}</span>
      </div>

      <span className="shrink-0 text-base font-bold text-white">
        {value}
      </span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-5">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
        <p className="text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );
}

export default function ManagerStation() {
  const { user } = useAuth();

  const [station, setStation] = useState<Station | null>(null);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);

useEffect(() => {
  if (!showEditModal) return;

  const originalBodyOverflow = document.body.style.overflow;
  const originalHtmlOverflow = document.documentElement.style.overflow;

  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";

  return () => {
    document.body.style.overflow = originalBodyOverflow;
    document.documentElement.style.overflow = originalHtmlOverflow;
  };
}, [showEditModal]);

  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    contactNumber: "",
    operatingHours: "",
    status: "Active" as StationStatus,
    description: "",
  });

  const assignedStationId = user?.assignedStationId || "";

  const fetchStationData = async () => {
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
        maintenanceResponse,
      ] = await Promise.all([
        api.get<Station[]>("/stations"),
        api.get<Charger[]>("/chargers"),
        api.get<Booking[]>("/bookings"),
        api.get<ChargingSession[]>("/chargingSessions"),
        api.get<Maintenance[]>("/maintenance"),
      ]);

      const allStations = stationsResponse.data || [];
      const allChargers = chargersResponse.data || [];
      const allBookings = bookingsResponse.data || [];
      const allSessions = sessionsResponse.data || [];
      const allMaintenance = maintenanceResponse.data || [];

      const assignedStation =
        allStations.find(
          (item) =>
            item.stationId === assignedStationId ||
            item.id === assignedStationId
        ) || null;

      setStation(assignedStation);

      setChargers(
        allChargers.filter(
          (item) =>
            item.stationId === assignedStationId ||
            item.stationId === assignedStation?.id
        )
      );

      setBookings(
        allBookings.filter(
          (item) =>
            item.stationId === assignedStationId ||
            item.stationId === assignedStation?.id
        )
      );

      setSessions(
        allSessions.filter(
          (item) =>
            item.stationId === assignedStationId ||
            item.stationId === assignedStation?.id
        )
      );

      setMaintenance(
        allMaintenance.filter(
          (item) =>
            item.stationId === assignedStationId ||
            item.stationId === assignedStation?.id
        )
      );
    } catch (err) {
      console.error("Failed to load station data:", err);
      setError("Unable to load station information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStationData();
  }, [assignedStationId]);

  const today = getTodayString();

  const todayBookings = useMemo(
    () =>
      bookings.filter(
        (booking) => booking.bookingDate?.slice(0, 10) === today
      ),
    [bookings, today]
  );

  const availableChargers = useMemo(
    () =>
      chargers.filter((charger) => charger.status === "Available").length,
    [chargers]
  );

  const activeChargers = useMemo(
    () =>
      chargers.filter(
        (charger) =>
          charger.status === "Charging" ||
          charger.status === "Occupied"
      ).length,
    [chargers]
  );

  const maintenanceChargers = useMemo(
    () =>
      chargers.filter((charger) => charger.status === "Maintenance").length,
    [chargers]
  );

  const activeSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          session.status === "Charging" ||
          session.status === "Paused"
      ).length,
    [sessions]
  );

  const completedSessions = useMemo(
    () =>
      sessions.filter((session) => session.status === "Completed").length,
    [sessions]
  );

  const stationAddress = useMemo(() => {
    if (!station) return "—";

    const parts = [
      station.address,
      station.city,
      station.state,
      station.pincode,
    ].filter(Boolean);

    return parts.length ? parts.join(", ") : "Address not available";
  }, [station]);

  const operatingHours = useMemo(() => {
    if (!station) return "—";

    if (station.operatingHours) {
      return station.operatingHours;
    }

    if (station.openingTime || station.closingTime) {
      return `${formatTime(station.openingTime)} - ${formatTime(
        station.closingTime
      )}`;
    }

    return "Not specified";
  }, [station]);

  const recentBookings = useMemo(
    () =>
      [...todayBookings]
        .sort((a, b) =>
          `${a.bookingDate}${a.startTime || ""}`.localeCompare(
            `${b.bookingDate}${b.startTime || ""}`
          )
        )
        .slice(0, 5),
    [todayBookings]
  );

  // -----------------------------
  // Edit Station
  // -----------------------------

  const openEditModal = () => {
    if (!station) return;

    setEditForm({
      name: station.name || "",
      address: station.address || "",
      city: station.city || "",
      state: station.state || "",
      pincode: station.pincode || "",
      contactNumber: station.contactNumber || station.phone || "",
      operatingHours: station.operatingHours || "",
      status: station.status || "Active",
      description: station.description || "",
    });

    setShowEditModal(true);
  };

  const closeEditModal = () => {
    if (saving) return;

    setShowEditModal(false);
  };

  const handleEditChange = (
    field: keyof typeof editForm,
    value: string
  ) => {
    setEditForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSaveStation = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!station) return;

    if (!editForm.name.trim()) {
      setError("Station name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const updatedStation: Station = {
        ...station,
        name: editForm.name.trim(),
        address: editForm.address.trim(),
        city: editForm.city.trim(),
        state: editForm.state.trim(),
        pincode: editForm.pincode.trim(),
        contactNumber: editForm.contactNumber.trim(),
        operatingHours: editForm.operatingHours.trim(),
        status: editForm.status,
        description: editForm.description.trim(),
      };

      await api.put(`/stations/${station.id}`, updatedStation);

      setStation(updatedStation);
      setShowEditModal(false);

      await fetchStationData();
    } catch (err) {
      console.error("Failed to update station:", err);
      setError("Unable to update station. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------
  // Loading
  // -----------------------------

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-cyan-400" />

          <p className="text-sm text-slate-400">
            Loading station information...
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------
  // Error / no station
  // -----------------------------

  if (error || !station) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-lg rounded-2xl border border-red-400/20 bg-[#0D1B2A] p-6 text-center shadow-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-400/10 text-red-300">
            <MapPin className="h-6 w-6" />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-white">
            Station Not Available
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            {error || "The assigned station could not be found."}
          </p>

          <button
            type="button"
            onClick={() => void fetchStationData()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/20 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0D1B2A] via-[#0B1726] to-[#111A35] p-5 shadow-xl shadow-black/10 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Assigned Station
              </span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(
                  station.status
                )}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {station.status}
              </span>
            </div>

            <h1 className="mt-3 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {station.name}
            </h1>

            <p className="mt-1 text-sm font-medium text-cyan-300">
              {station.stationId}
            </p>

            <div className="mt-4 flex items-start gap-2 text-sm text-slate-400">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
              <span>{stationAddress}</span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void fetchStationData()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white hover:text-black"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <button
              type="button"
              onClick={openEditModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400 hover:text-black"
            >
              <Edit3 className="h-4 w-4" />
              Edit Station
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Zap className="h-5 w-5" />}
          label="Total Chargers"
          value={chargers.length}
          description="Chargers assigned to this station"
        />

        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Available Chargers"
          value={availableChargers}
          description="Ready for customer use"
        />

        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="Active Chargers"
          value={activeChargers}
          description="Currently charging or occupied"
        />

        <StatCard
          icon={<Settings2 className="h-5 w-5" />}
          label="Maintenance"
          value={maintenanceChargers}
          description="Chargers under maintenance"
        />
      </section>

      {/* Station information */}
      <section className="grid min-w-0 gap-5 lg:grid-cols-3">
        <div className="min-w-0 rounded-2xl border border-white/10 bg-[#0D1B2A] p-5 shadow-lg shadow-black/10 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">
                Station Information
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Details of your assigned charging station.
              </p>
            </div>

            <MapPin className="h-5 w-5 shrink-0 text-cyan-400" />
          </div>

          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <InfoItem
              icon={<MapPin className="h-4 w-4" />}
              label="Station ID"
              value={station.stationId}
            />

            <InfoItem
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Status"
              value={station.status}
            />

            <InfoItem
              icon={<Navigation className="h-4 w-4" />}
              label="Location"
              value={stationAddress}
            />

            <InfoItem
              icon={<Clock3 className="h-4 w-4" />}
              label="Operating Hours"
              value={operatingHours}
            />

            <InfoItem
              icon={<Phone className="h-4 w-4" />}
              label="Contact Number"
              value={station.contactNumber || station.phone || "Not available"}
            />

            <InfoItem
              icon={<CalendarDays className="h-4 w-4" />}
              label="Created Date"
              value={formatDate(station.createdDate)}
            />
          </div>

          {station.description && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Description
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                {station.description}
              </p>
            </div>
          )}
        </div>

        {/* Today's overview */}
        <div className="min-w-0 rounded-2xl border border-white/10 bg-[#0D1B2A] p-5 shadow-lg shadow-black/10">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Today's Overview
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Current station activity.
              </p>
            </div>

            <Activity className="h-5 w-5 text-cyan-400" />
          </div>

          <div className="space-y-3">
            <OverviewRow
              label="Today's Bookings"
              value={todayBookings.length}
              icon={<CalendarDays className="h-4 w-4" />}
            />

            <OverviewRow
              label="Active Sessions"
              value={activeSessions}
              icon={<BatteryCharging className="h-4 w-4" />}
            />

            <OverviewRow
              label="Completed Sessions"
              value={completedSessions}
              icon={<CheckCircle2 className="h-4 w-4" />}
            />

            <OverviewRow
              label="Maintenance Issues"
              value={maintenance.length}
              icon={<Settings2 className="h-4 w-4" />}
            />
          </div>
        </div>
      </section>

      {/* Chargers + Bookings */}
      <section className="grid min-w-0 gap-5 xl:grid-cols-2">
        {/* Chargers */}
        <div className="min-w-0 rounded-2xl border border-white/10 bg-[#0D1B2A] shadow-lg shadow-black/10">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 p-5">
            <div>
              <h2 className="text-base font-semibold text-white">
                Charger Status
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Chargers currently assigned to this station.
              </p>
            </div>

            <Zap className="h-5 w-5 shrink-0 text-cyan-400" />
          </div>

          {chargers.length === 0 ? (
            <EmptyState message="No chargers are assigned to this station." />
          ) : (
            <div className="divide-y divide-white/5">
              {chargers.map((charger) => (
                <div
                  key={charger.id}
                  className="flex min-w-0 items-center justify-between gap-4 p-4 transition hover:bg-white/[0.02]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/10 text-cyan-300">
                      <BatteryCharging className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {charger.chargerId}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {charger.chargerType || "Charger"}{" "}
                        {charger.connectorType
                          ? `• ${charger.connectorType}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${getChargerStatusClasses(
                        charger.status
                      )}`}
                    >
                      {charger.status}
                    </span>

                    {(charger.powerOutput || charger.power) && (
                      <p className="mt-1 text-[11px] text-slate-500">
                        {charger.powerOutput || charger.power} kW
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's bookings */}
        <div className="min-w-0 rounded-2xl border border-white/10 bg-[#0D1B2A] shadow-lg shadow-black/10">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 p-5">
            <div>
              <h2 className="text-base font-semibold text-white">
                Today's Bookings
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest bookings for your station.
              </p>
            </div>

            <CalendarDays className="h-5 w-5 shrink-0 text-cyan-400" />
          </div>

          {recentBookings.length === 0 ? (
            <EmptyState message="No bookings scheduled for today." />
          ) : (
            <div className="divide-y divide-white/5">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex min-w-0 items-center justify-between gap-4 p-4 transition hover:bg-white/[0.02]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {booking.bookingId}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>{formatTime(booking.startTime)}</span>
                      <span>→</span>
                      <span>{formatTime(booking.endTime)}</span>
                    </div>
                  </div>

                  {booking.status && (
                    <span className="shrink-0 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-medium text-cyan-300">
                      {booking.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Maintenance */}
      <section className="min-w-0 rounded-2xl border border-white/10 bg-[#0D1B2A] shadow-lg shadow-black/10">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 p-5">
          <div>
            <h2 className="text-base font-semibold text-white">
              Maintenance Overview
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Maintenance records associated with your station.
            </p>
          </div>

          <Settings2 className="h-5 w-5 shrink-0 text-cyan-400" />
        </div>

        {maintenance.length === 0 ? (
          <div className="p-5">
            <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />

                <div>
                  <p className="text-sm font-medium text-white">
                    No maintenance records
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    There are currently no maintenance issues for this
                    station.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid min-w-0 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {maintenance.map((item) => (
              <div
                key={item.id}
                className="min-w-0 rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {item.maintenanceId}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {item.chargerId || "Station maintenance"}
                    </p>
                  </div>

                  {item.priority && (
                    <span className="shrink-0 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[10px] font-medium text-amber-300">
                      {item.priority}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm leading-5 text-slate-300">
                  {item.issue || "Maintenance issue recorded."}
                </p>

                {item.status && (
                  <p className="mt-3 text-xs text-slate-500">
                    Status:{" "}
                    <span className="text-slate-300">{item.status}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Edit Station Modal */}
      {showEditModal && (
       <div
  className="fixed inset-0 z-[100] h-screen w-screen overflow-hidden bg-black/70 p-3 backdrop-blur-sm sm:p-4"
>
  <div className="mx-auto flex h-full max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0D1A2A] shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-2rem)]">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Edit Station
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Update details for {station.stationId}
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
<form
  onSubmit={handleSaveStation}
  className="hide-scrollbar min-h-0 flex-1 overflow-y-auto"
>
    
              <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
                {/* Station ID */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Station ID
                  </label>

                  <input
                    type="text"
                    value={station.stationId}
                    disabled
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-slate-500 outline-none"
                  />
                </div>

                {/* Station Name */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Station Name
                  </label>

                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(event) =>
                      handleEditChange("name", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0D1B2A] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
                    placeholder="Enter station name"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Address
                  </label>

                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(event) =>
                      handleEditChange("address", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0D1B2A] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
                    placeholder="Enter station address"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    City
                  </label>

                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(event) =>
                      handleEditChange("city", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0D1B2A] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
                    placeholder="Enter city"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    State
                  </label>

                  <input
                    type="text"
                    value={editForm.state}
                    onChange={(event) =>
                      handleEditChange("state", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0D1B2A] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
                    placeholder="Enter state"
                  />
                </div>

                {/* Pincode */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Pincode
                  </label>

                  <input
                    type="text"
                    value={editForm.pincode}
                    onChange={(event) =>
                      handleEditChange("pincode", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0D1B2A] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
                    placeholder="Enter pincode"
                  />
                </div>

                {/* Contact */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Contact Number
                  </label>

                  <input
                    type="text"
                    value={editForm.contactNumber}
                    onChange={(event) =>
                      handleEditChange(
                        "contactNumber",
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0D1B2A] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
                    placeholder="Enter contact number"
                  />
                </div>

                {/* Operating Hours */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Operating Hours
                  </label>

                  <input
                    type="text"
                    value={editForm.operatingHours}
                    onChange={(event) =>
                      handleEditChange(
                        "operatingHours",
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0D1B2A] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
                    placeholder="Example: 24 Hours"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Station Status
                  </label>

                  <div className="relative">
                    <select
                      value={editForm.status}
                      onChange={(event) =>
                        handleEditChange(
                          "status",
                          event.target.value
                        )
                      }
                      className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#0D1B2A] px-4 pr-10 text-sm text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
                      style={{ colorScheme: "dark" }}
                    >
                      <option
                        value="Active"
                        className="bg-[#0D1B2A] text-white"
                      >
                        Active
                      </option>

                      <option
                        value="Inactive"
                        className="bg-[#0D1B2A] text-white"
                      >
                        Inactive
                      </option>

                      <option
                        value="Under Maintenance"
                        className="bg-[#0D1B2A] text-white"
                      >
                        Under Maintenance
                      </option>

                      <option
                        value="Temporarily Closed"
                        className="bg-[#0D1B2A] text-white"
                      >
                        Temporarily Closed
                      </option>
                    </select>

                    <svg
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 1.04l-4.25-4.51a.75.75 0 011.08-1.04z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Description
                  </label>

                  <textarea
                    value={editForm.description}
                    onChange={(event) =>
                      handleEditChange(
                        "description",
                        event.target.value
                      )
                    }
                    rows={4}
                    className="w-full resize-none rounded-xl border border-white/10 bg-[#0D1B2A] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
                    placeholder="Enter station description"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-white/10 bg-[#0D1A2A] px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="h-11 rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-medium text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}