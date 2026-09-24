import { useEffect, useMemo, useState } from "react";
import {
  BatteryCharging,
  CalendarDays,
  Clock3,
  Eye,
  MapPin,
  RefreshCw,
  Search,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

interface Station {
  id: string;
  stationId: string;
  name: string;
  stationCode?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  contactNumber?: string;
  openingTime?: string;
  closingTime?: string;
  operatingHours?: string;
  numberOfChargers?: number;
  status?: string;
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

interface Slot {
  id: string;
  slotId: string;
  chargerId: string;
  stationId: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
}

const chargerTypes = [
  "All",
  "AC Charger",
  "DC Fast Charger",
  "DC Ultra Fast Charger",
];

const connectorTypes = [
  "All",
  "Type 1",
  "Type 2",
  "CCS",
  "CHAdeMO",
];

const chargerStatuses = [
  "All",
  "Available",
  "Booked",
  "Charging",
  "Occupied",
  "Maintenance",
  "Offline",
];

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

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return value;
    }

    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;

    return `${displayHour}:${String(minutes).padStart(
      2,
      "0"
    )} ${period}`;
  }

  return value;
}

function getStationStatusClasses(status?: string) {
  switch (status) {
    case "Active":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "Under Maintenance":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "Temporarily Closed":
      return "border-orange-400/20 bg-orange-400/10 text-orange-300";

    case "Inactive":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    default:
      return "border-white/10 bg-white/5 text-slate-300";
  }
}

function getChargerStatusClasses(status?: string) {
  switch (status) {
    case "Available":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "Booked":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    case "Charging":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";

    case "Occupied":
      return "border-violet-400/20 bg-violet-400/10 text-violet-300";

    case "Maintenance":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "Offline":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    default:
      return "border-white/10 bg-white/5 text-slate-300";
  }
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
        className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#0D1B2A] px-4 pr-11 text-sm text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-[#0D1B2A] text-white"
          >
            {option === "All" ? placeholder : option}
          </option>
        ))}
      </select>

      <svg
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08.02l-4.25-4.51a.75.75 0 01.02-1.06z"
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
    <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-medium text-white">
        {value}
      </p>
    </div>
  );
}

export default function CustomerStations() {
  const navigate = useNavigate();

  const [stations, setStations] = useState<Station[]>([]);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [chargerTypeFilter, setChargerTypeFilter] =
    useState("All");
  const [connectorFilter, setConnectorFilter] =
    useState("All");
  const [powerFilter, setPowerFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [availabilityOnly, setAvailabilityOnly] =
    useState(false);

  const [selectedStation, setSelectedStation] =
    useState<Station | null>(null);

  const today = getTodayDate();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        stationsResponse,
        chargersResponse,
        slotsResponse,
      ] = await Promise.all([
        api.get<Station[]>("/stations"),
        api.get<Charger[]>("/chargers"),
        api.get<Slot[]>("/slots"),
      ]);

      setStations(stationsResponse.data || []);
      setChargers(chargersResponse.data || []);
      setSlots(slotsResponse.data || []);
    } catch (err) {
      console.error("Failed to load stations:", err);

      setError(
        "Unable to load charging stations. Please check JSON Server and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  /*
   * Lock the page while station details are open.
   */
  useEffect(() => {
    if (!selectedStation) return;

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
  }, [selectedStation]);

  const getStationChargers = (station: Station) =>
    chargers.filter(
      (charger) =>
        charger.stationId === station.id ||
        charger.stationId === station.stationId
    );

  const getChargerSlots = (charger: Charger) =>
    slots.filter(
      (slot) =>
        (slot.chargerId === charger.id ||
          slot.chargerId === charger.chargerId) &&
        normalizeDate(slot.date) >= today
    );

  const getAvailableSlots = (charger: Charger) =>
    getChargerSlots(charger).filter(
      (slot) => slot.status === "Available"
    );

  const cities = useMemo(() => {
    const uniqueCities = Array.from(
      new Set(
        stations
          .map((station) => station.city)
          .filter(
            (city): city is string =>
              Boolean(city?.trim())
          )
      )
    ).sort();

    return ["All", ...uniqueCities];
  }, [stations]);

  const filteredStations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return stations.filter((station) => {
      /*
       * Customers should not book inactive,
       * maintenance or closed stations.
       */
      if (station.status !== "Active") {
        return false;
      }

      const stationChargers = chargers.filter(
        (charger) =>
          charger.stationId === station.id ||
          charger.stationId === station.stationId
      );

      const searchableText = [
        station.name,
        station.stationCode || "",
        station.stationId,
        station.city || "",
        station.state || "",
        station.address || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesCity =
        cityFilter === "All" ||
        station.city === cityFilter;

      const matchingChargers =
        stationChargers.filter((charger) => {
          const matchesType =
            chargerTypeFilter === "All" ||
            charger.chargerType ===
              chargerTypeFilter;

          const matchesConnector =
            connectorFilter === "All" ||
            charger.connectorType ===
              connectorFilter;

          const matchesStatus =
            statusFilter === "All" ||
            charger.status === statusFilter;

          let matchesPower = true;

          const power = Number(
            charger.powerOutput || 0
          );

          if (powerFilter === "Up to 22 kW") {
            matchesPower = power <= 22;
          }

          if (powerFilter === "23 - 60 kW") {
            matchesPower =
              power >= 23 && power <= 60;
          }

          if (powerFilter === "61 - 150 kW") {
            matchesPower =
              power >= 61 && power <= 150;
          }

          if (powerFilter === "Above 150 kW") {
            matchesPower = power > 150;
          }

          const hasAvailability =
            charger.status === "Available" &&
            slots.some(
              (slot) =>
                (slot.chargerId === charger.id ||
                  slot.chargerId ===
                    charger.chargerId) &&
                slot.status === "Available" &&
                normalizeDate(slot.date) >= today
            );

          const matchesAvailability =
            !availabilityOnly || hasAvailability;

          return (
            matchesType &&
            matchesConnector &&
            matchesStatus &&
            matchesPower &&
            matchesAvailability
          );
        });

      /*
       * If a charger filter is active, the station
       * must contain at least one matching charger.
       */
      const chargerFilterActive =
        chargerTypeFilter !== "All" ||
        connectorFilter !== "All" ||
        powerFilter !== "All" ||
        statusFilter !== "All" ||
        availabilityOnly;

      const matchesChargers =
        !chargerFilterActive ||
        matchingChargers.length > 0;

      return (
        matchesSearch &&
        matchesCity &&
        matchesChargers
      );
    });
  }, [
    stations,
    chargers,
    slots,
    search,
    cityFilter,
    chargerTypeFilter,
    connectorFilter,
    powerFilter,
    statusFilter,
    availabilityOnly,
    today,
  ]);

  const clearFilters = () => {
    setSearch("");
    setCityFilter("All");
    setChargerTypeFilter("All");
    setConnectorFilter("All");
    setPowerFilter("All");
    setStatusFilter("All");
    setAvailabilityOnly(false);
  };

  const hasFilters =
    search ||
    cityFilter !== "All" ||
    chargerTypeFilter !== "All" ||
    connectorFilter !== "All" ||
    powerFilter !== "All" ||
    statusFilter !== "All" ||
    availabilityOnly;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-cyan-400" />

          <p className="text-sm text-slate-400">
            Loading charging stations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0D1B2A] via-[#0B1726] to-[#111A35] p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
              Station Search & Availability
            </span>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Find Charging Stations
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Search stations, compare chargers and find
              available charging slots for your EV.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchData()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white hover:text-black"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
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
            className="shrink-0 text-red-300 transition hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search and filters */}
      <section className="rounded-2xl border border-white/10 bg-[#0D1B2A] p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Search & Filters
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Search by station name, city or station code.
            </p>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-cyan-400 transition hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative min-w-0 sm:col-span-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search station name, city or code..."
              className="h-11 w-full rounded-xl border border-white/10 bg-[#0D1B2A] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
            />
          </div>

          <FilterSelect
            value={cityFilter}
            onChange={setCityFilter}
            options={cities}
            placeholder="All Cities"
          />

          <FilterSelect
            value={chargerTypeFilter}
            onChange={setChargerTypeFilter}
            options={chargerTypes}
            placeholder="All Charger Types"
          />

          <FilterSelect
            value={connectorFilter}
            onChange={setConnectorFilter}
            options={connectorTypes}
            placeholder="All Connectors"
          />

          <FilterSelect
            value={powerFilter}
            onChange={setPowerFilter}
            options={[
              "All",
              "Up to 22 kW",
              "23 - 60 kW",
              "61 - 150 kW",
              "Above 150 kW",
            ]}
            placeholder="All Power Outputs"
          />

          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={chargerStatuses}
            placeholder="All Charger Statuses"
          />

          <button
            type="button"
            onClick={() =>
              setAvailabilityOnly(
                (current) => !current
              )
            }
            className={`h-11 rounded-xl border px-4 text-sm font-medium transition ${
              availabilityOnly
                ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                : "border-white/10 bg-white/5 text-white hover:bg-white hover:text-black"
            }`}
          >
            Available Slots Only
          </button>
        </div>
      </section>

      {/* Results */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Charging Stations
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredStations.length} active station
              {filteredStations.length === 1 ? "" : "s"}{" "}
              found
            </p>
          </div>
        </div>

        {filteredStations.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0D1B2A] p-6">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
              <MapPin className="mx-auto h-9 w-9 text-slate-600" />

              <p className="mt-3 text-sm font-medium text-white">
                No stations found
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid min-w-0 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {filteredStations.map((station) => {
              const stationChargers =
                getStationChargers(station);

              const availableChargers =
                stationChargers.filter(
                  (charger) =>
                    charger.status === "Available"
                );

              const availableSlots =
                stationChargers.reduce(
                  (total, charger) =>
                    total +
                    getAvailableSlots(charger).length,
                  0
                );

              return (
                <article
                  key={station.id}
                  className="min-w-0 rounded-2xl border border-white/10 bg-[#0D1B2A] p-5 transition hover:border-cyan-400/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold text-white">
                        {station.name}
                      </p>

                      <p className="mt-1 text-xs font-medium text-cyan-400">
                        {station.stationCode ||
                          station.stationId}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium ${getStationStatusClasses(
                        station.status
                      )}`}
                    >
                      {station.status || "Unknown"}
                    </span>
                  </div>

                  <div className="mt-4 flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

                    <p className="text-sm leading-5 text-slate-400">
                      {[
                        station.address,
                        station.city,
                        station.state,
                        station.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Address unavailable"}
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
                      <p className="text-lg font-bold text-white">
                        {stationChargers.length}
                      </p>

                      <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">
                        Chargers
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
                      <p className="text-lg font-bold text-emerald-300">
                        {availableChargers.length}
                      </p>

                      <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">
                        Available
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
                      <p className="text-lg font-bold text-cyan-300">
                        {availableSlots}
                      </p>

                      <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">
                        Slots
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedStation(station)
                      }
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white hover:text-black"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>

                    <button
                      type="button"
                      disabled={availableSlots === 0}
                      onClick={() =>
                        navigate(
                          `/customer/bookings?station=${station.stationId}`
                        )
                      }
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 text-sm font-semibold text-[#07111F] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                    >
                      <CalendarDays className="h-4 w-4" />
                      Book Slot
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Station Details Popup */}
      {selectedStation && (
        <div className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center overflow-hidden bg-black/70 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0D1A2A] shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-2rem)]">
            {/* Popup header */}
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-white sm:text-xl">
                    {selectedStation.name}
                  </h2>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${getStationStatusClasses(
                      selectedStation.status
                    )}`}
                  >
                    {selectedStation.status}
                  </span>
                </div>

                <p className="mt-1 text-xs text-cyan-400">
                  {selectedStation.stationCode ||
                    selectedStation.stationId}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedStation(null)
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:bg-white hover:text-black"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Popup content */}
            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-6 p-4 sm:p-6">
                {/* Station information */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cyan-400" />

                    <h3 className="text-sm font-semibold text-white">
                      Station Information
                    </h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailItem
                      label="Station Code"
                      value={
                        selectedStation.stationCode ||
                        selectedStation.stationId
                      }
                    />

                    <DetailItem
                      label="City"
                      value={
                        selectedStation.city || "—"
                      }
                    />

                    <DetailItem
                      label="State"
                      value={
                        selectedStation.state || "—"
                      }
                    />

                    <DetailItem
                      label="Contact"
                      value={
                        selectedStation.contactNumber ||
                        "—"
                      }
                    />
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <DetailItem
                      label="Address"
                      value={
                        [
                          selectedStation.address,
                          selectedStation.city,
                          selectedStation.state,
                          selectedStation.pincode,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"
                      }
                    />

                    <DetailItem
                      label="Operating Hours"
                      value={
                        selectedStation.operatingHours ||
                        (selectedStation.openingTime &&
                        selectedStation.closingTime
                          ? `${formatTime(
                              selectedStation.openingTime
                            )} - ${formatTime(
                              selectedStation.closingTime
                            )}`
                          : "—")
                      }
                    />
                  </div>
                </section>

                {/* Chargers */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <BatteryCharging className="h-4 w-4 text-cyan-400" />

                    <h3 className="text-sm font-semibold text-white">
                      Chargers
                    </h3>
                  </div>

                  {getStationChargers(
                    selectedStation
                  ).length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
                      <Zap className="mx-auto h-7 w-7 text-slate-600" />

                      <p className="mt-2 text-sm text-slate-400">
                        No chargers found for this station.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {getStationChargers(
                        selectedStation
                      ).map((charger) => {
                        const chargerSlots =
                          getAvailableSlots(charger);

                        const canBook =
                          charger.status ===
                            "Available" &&
                          chargerSlots.length > 0;

                        return (
                          <div
                            key={charger.id}
                            className="min-w-0 rounded-xl border border-white/10 bg-white/[0.02] p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white">
                                  {charger.chargerNumber
                                    ? `Charger ${charger.chargerNumber}`
                                    : charger.chargerId}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {charger.chargerId}
                                </p>
                              </div>

                              <span
                                className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-medium ${getChargerStatusClasses(
                                  charger.status
                                )}`}
                              >
                                {charger.status}
                              </span>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                              <DetailItem
                                label="Type"
                                value={
                                  charger.chargerType ||
                                  "—"
                                }
                              />

                              <DetailItem
                                label="Connector"
                                value={
                                  charger.connectorType ||
                                  "—"
                                }
                              />

                              <DetailItem
                                label="Power"
                                value={
                                  charger.powerOutput
                                    ? `${charger.powerOutput} kW`
                                    : "—"
                                }
                              />

                              <DetailItem
                                label="Price"
                                value={
                                  charger.pricePerKwh !==
                                  undefined
                                    ? `₹${charger.pricePerKwh}/kWh`
                                    : "Configured pricing"
                                }
                              />
                            </div>

                            <div className="mt-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Available Slots
                                </p>

                                <span className="text-xs font-medium text-cyan-400">
                                  {
                                    chargerSlots.length
                                  }
                                </span>
                              </div>

                              {chargerSlots.length ===
                              0 ? (
                                <div className="mt-3 rounded-lg border border-white/10 bg-[#07111F]/40 p-3 text-xs text-slate-500">
                                  No available future slots.
                                </div>
                              ) : (
                                <div className="mt-3 space-y-2">
                                  {chargerSlots
                                    .slice(0, 4)
                                    .map((slot) => (
                                      <div
                                        key={slot.id}
                                        className="flex flex-col gap-2 rounded-lg border border-white/10 bg-[#07111F]/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                                      >
                                        <div className="flex items-center gap-2">
                                          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-cyan-400" />

                                          <span className="text-xs text-slate-300">
                                            {formatDate(
                                              slot.date
                                            )}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <Clock3 className="h-3.5 w-3.5 shrink-0 text-cyan-400" />

                                          <span className="text-xs text-slate-300">
                                            {formatTime(
                                              slot.startTime
                                            )}{" "}
                                            -{" "}
                                            {formatTime(
                                              slot.endTime
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    ))}

                                  {chargerSlots.length >
                                    4 && (
                                    <p className="text-xs text-slate-500">
                                      +
                                      {chargerSlots.length -
                                        4}{" "}
                                      more available slots
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              disabled={!canBook}
                              onClick={() =>
                                navigate(
                                  `/customer/bookings?station=${selectedStation.stationId}&charger=${charger.chargerId}`
                                )
                              }
                              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 text-sm font-semibold text-[#07111F] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                            >
                              <CalendarDays className="h-4 w-4" />
                              {canBook
                                ? "Book This Charger"
                                : "Not Available"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 justify-end border-t border-white/10 bg-[#0D1A2A] px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={() =>
                  setSelectedStation(null)
                }
                className="h-10 rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-medium text-white transition hover:bg-white hover:text-black"
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