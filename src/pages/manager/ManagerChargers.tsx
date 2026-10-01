import { useEffect, useMemo, useState } from "react";
import {
  BatteryCharging,
  CheckCircle2,
  Edit3,
  Eye,
  Filter,
  RefreshCw,
  Search,
  Settings2,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

type ChargerType =
  | "AC Charger"
  | "DC Fast Charger"
  | "DC Ultra Fast Charger";

type ConnectorType =
  | "Type 1"
  | "Type 2"
  | "CCS"
  | "CHAdeMO";

type ChargerStatus =
  | "Available"
  | "Booked"
  | "Charging"
  | "Occupied"
  | "Maintenance"
  | "Offline";

interface Charger {
  id: string;
  chargerId: string;
  stationId: string;
  name?: string;
  chargerType: ChargerType;
  connectorType: ConnectorType;
  powerOutput?: number;
  power?: number;
  status: ChargerStatus;
  createdDate?: string;
  description?: string;
}

interface Station {
  id: string;
  stationId: string;
  name: string;
}

const chargerTypes: ChargerType[] = [
  "AC Charger",
  "DC Fast Charger",
  "DC Ultra Fast Charger",
];

const connectorTypes: ConnectorType[] = [
  "Type 1",
  "Type 2",
  "CCS",
  "CHAdeMO",
];

const chargerStatuses: ChargerStatus[] = [
  "Available",
  "Booked",
  "Charging",
  "Occupied",
  "Maintenance",
  "Offline",
];

function getStatusClasses(status: ChargerStatus) {
  switch (status) {
    case "Available":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "Booked":
      return "border-violet-400/20 bg-violet-400/10 text-violet-300";

    case "Charging":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";

    case "Occupied":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    case "Maintenance":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "Offline":
      return "border-slate-400/20 bg-slate-400/10 text-[var(--text-secondary)]";

    default:
      return "border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]";
  }
}

function getStatusIcon(status: ChargerStatus) {
  switch (status) {
    case "Available":
      return <CheckCircle2 className="h-3.5 w-3.5" />;

    case "Maintenance":
      return <Settings2 className="h-3.5 w-3.5" />;

    case "Offline":
      return <WifiOff className="h-3.5 w-3.5" />;

    default:
      return <BatteryCharging className="h-3.5 w-3.5" />;
  }
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

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 shadow-lg shadow-black/10 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            {value}
          </p>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
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
      aria-label={label}
      title={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition hover:opacity-80"
    >
      {children}
    </button>
  );
}

export default function ManagerChargers() {
  const { user } = useAuth();

  const [chargers, setChargers] = useState<Charger[]>([]);
  const [station, setStation] = useState<Station | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | ChargerStatus>(
    "All"
  );
  const [typeFilter, setTypeFilter] = useState<"All" | ChargerType>("All");
  const [connectorFilter, setConnectorFilter] = useState<
    "All" | ConnectorType
  >("All");

  const [viewCharger, setViewCharger] = useState<Charger | null>(null);
  const [editCharger, setEditCharger] = useState<Charger | null>(null);

  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    chargerType: "AC Charger" as ChargerType,
    connectorType: "Type 2" as ConnectorType,
    powerOutput: "",
    status: "Available" as ChargerStatus,
    description: "",
  });

  const assignedStationId = user?.assignedStationId || "";

  const fetchChargers = async () => {
    if (!assignedStationId) {
      setError("No station is assigned to this manager.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [stationsResponse, chargersResponse] = await Promise.all([
        api.get<Station[]>("/stations"),
        api.get<Charger[]>("/chargers"),
      ]);

      const allStations = stationsResponse.data || [];
      const allChargers = chargersResponse.data || [];

      const assignedStation =
        allStations.find(
          (item) =>
            item.stationId === assignedStationId ||
            item.id === assignedStationId
        ) || null;

      setStation(assignedStation);

      const filteredChargers = allChargers.filter(
        (charger) =>
          charger.stationId === assignedStationId ||
          charger.stationId === assignedStation?.id
      );

      setChargers(filteredChargers);
    } catch (err) {
      console.error("Failed to load chargers:", err);
      setError("Unable to load chargers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchChargers();
  }, [assignedStationId]);

  /*
   * Lock the complete background whenever a popup is open.
   * The popup itself can still scroll when required.
   */
  useEffect(() => {
    const popupOpen = Boolean(viewCharger || editCharger);

    if (!popupOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow =
      document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [viewCharger, editCharger]);

  const filteredChargers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return chargers.filter((charger) => {
      const matchesSearch =
        !query ||
        charger.chargerId.toLowerCase().includes(query) ||
        charger.name?.toLowerCase().includes(query) ||
        charger.chargerType.toLowerCase().includes(query) ||
        charger.connectorType.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || charger.status === statusFilter;

      const matchesType =
        typeFilter === "All" || charger.chargerType === typeFilter;

      const matchesConnector =
        connectorFilter === "All" ||
        charger.connectorType === connectorFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesConnector
      );
    });
  }, [
    chargers,
    search,
    statusFilter,
    typeFilter,
    connectorFilter,
  ]);

  const totalChargers = chargers.length;

  const availableChargers = chargers.filter(
    (charger) => charger.status === "Available"
  ).length;

  const chargingChargers = chargers.filter(
    (charger) =>
      charger.status === "Charging" ||
      charger.status === "Occupied"
  ).length;

  const bookedChargers = chargers.filter(
    (charger) => charger.status === "Booked"
  ).length;

  const maintenanceChargers = chargers.filter(
    (charger) => charger.status === "Maintenance"
  ).length;

  const offlineChargers = chargers.filter(
    (charger) => charger.status === "Offline"
  ).length;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setTypeFilter("All");
    setConnectorFilter("All");
  };

  const openEditModal = (charger: Charger) => {
    setEditCharger(charger);

    setEditForm({
      name: charger.name || "",
      chargerType: charger.chargerType,
      connectorType: charger.connectorType,
      powerOutput:
        charger.powerOutput !== undefined
          ? String(charger.powerOutput)
          : charger.power !== undefined
            ? String(charger.power)
            : "",
      status: charger.status,
      description: charger.description || "",
    });
  };

  const closeEditModal = () => {
    if (saving) return;

    setEditCharger(null);
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

  const handleSaveCharger = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!editCharger) return;

    if (!editForm.powerOutput.trim()) {
      setError("Power output is required.");
      return;
    }

    const powerOutput = Number(editForm.powerOutput);

    if (Number.isNaN(powerOutput) || powerOutput <= 0) {
      setError("Power output must be a valid positive number.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const updatedCharger: Charger = {
        ...editCharger,
        name: editForm.name.trim(),
        chargerType: editForm.chargerType,
        connectorType: editForm.connectorType,
        powerOutput,
        status: editForm.status,
        description: editForm.description.trim(),
      };

      await api.put(
        `/chargers/${editCharger.id}`,
        updatedCharger
      );

      setEditCharger(null);

      await fetchChargers();
    } catch (err) {
      console.error("Failed to update charger:", err);
      setError("Unable to update charger. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (charger: Charger) => {
    const nextStatus: ChargerStatus =
      charger.status === "Offline" ? "Available" : "Offline";

    try {
      setError("");

      await api.patch(`/chargers/${charger.id}`, {
        status: nextStatus,
      });

      await fetchChargers();
    } catch (err) {
      console.error("Failed to update charger status:", err);
      setError("Unable to update charger status.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-cyan-400" />

          <p className="text-sm text-[var(--text-secondary)]">
            Loading chargers...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
                Manager
              </span>

              {station && (
                <span className="rounded-full border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                  {station.stationId}
                </span>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Charger Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Manage and monitor chargers assigned to your station.
            </p>

            {station && (
              <p className="mt-2 text-sm font-medium text-cyan-300">
                {station.name}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => void fetchChargers()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:opacity-80"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
          <X className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />

          <div className="min-w-0">
            <p className="text-sm font-medium text-red-200">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError("")}
              className="mt-1 text-xs text-red-300 underline underline-offset-2 hover:text-[var(--text-primary)]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Zap className="h-5 w-5" />}
          label="Total Chargers"
          value={totalChargers}
          description="Assigned to this station"
        />

        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Available"
          value={availableChargers}
          description="Ready for charging"
        />

        <StatCard
          icon={<BatteryCharging className="h-5 w-5" />}
          label="In Use"
          value={chargingChargers}
          description="Charging or occupied"
        />

        <StatCard
          icon={<Settings2 className="h-5 w-5" />}
          label="Maintenance"
          value={maintenanceChargers}
          description="Under maintenance"
        />
      </section>

      {/* Additional status summary */}
      <section className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Booked Chargers
              </p>

              <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
                {bookedChargers}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
              <CalendarDaysIcon />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Offline Chargers
              </p>

              <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
                {offlineChargers}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-400/10 text-[var(--text-secondary)]">
              <WifiOff className="h-5 w-5" />
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Search & Filters
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Find chargers by ID, type, connector or status.
            </p>
          </div>

          {(search ||
            statusFilter !== "All" ||
            typeFilter !== "All" ||
            connectorFilter !== "All") && (
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
          {/* Search */}
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 !text-[var(--text-primary)]" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search chargers..."
              className="h-11 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--card-bg)] pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
            />
          </div>

          {/* Status */}
          <FilterSelect
            value={statusFilter}
            onChange={(value) =>
              setStatusFilter(value as "All" | ChargerStatus)
            }
            options={["All", ...chargerStatuses]}
            placeholder="All Statuses"
          />

          {/* Type */}
          <FilterSelect
            value={typeFilter}
            onChange={(value) =>
              setTypeFilter(value as "All" | ChargerType)
            }
            options={["All", ...chargerTypes]}
            placeholder="All Charger Types"
          />

          {/* Connector */}
          <FilterSelect
            value={connectorFilter}
            onChange={(value) =>
              setConnectorFilter(value as "All" | ConnectorType)
            }
            options={["All", ...connectorTypes]}
            placeholder="All Connectors"
          />
        </div>
      </section>

      {/* Charger List */}
      <section className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-lg shadow-black/10">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-primary)] p-5">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Chargers
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Showing {filteredChargers.length} of {totalChargers} chargers
            </p>
          </div>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
            <Filter className="h-4 w-4" />
          </div>
        </div>

        {filteredChargers.length === 0 ? (
          <EmptyChargerState />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[13%]" />
                  <col className="w-[19%]" />
                  <col className="w-[15%]" />
                  <col className="w-[13%]" />
                  <col className="w-[14%]" />
                  <col className="w-[26%]" />
                </colgroup>

                <thead>
                  <tr className="border-b border-[var(--border-primary)] text-left">
                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Charger ID
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Type
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Connector
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Power
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Status
                    </th>

                    <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border-primary)]">
                  {filteredChargers.map((charger) => (
                    <tr
                      key={charger.id}
                      className="transition hover:bg-[var(--bg-tertiary)]"
                    >
                      <td className="px-4 py-5">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                            <BatteryCharging className="h-4 w-4" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                              {charger.chargerId}
                            </p>

                            {charger.name && (
                              <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                                {charger.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-5">
                        <span className="text-sm text-[var(--text-secondary)]">
                          {charger.chargerType}
                        </span>
                      </td>

                      <td className="px-4 py-5">
                        <span className="text-sm text-[var(--text-secondary)]">
                          {charger.connectorType}
                        </span>
                      </td>

                      <td className="px-4 py-5">
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {charger.powerOutput || charger.power || "—"}
                          {charger.powerOutput || charger.power
                            ? " kW"
                            : ""}
                        </span>
                      </td>

                      <td className="px-4 py-5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                            charger.status
                          )}`}
                        >
                          {getStatusIcon(charger.status)}
                          {charger.status}
                        </span>
                      </td>

                      <td className="px-4 py-5">
                        <div className="flex items-center justify-end gap-2.5">
                          <ActionButton
                            label="View Charger"
                            onClick={() => setViewCharger(charger)}
                          >
                            <Eye className="h-4 w-4" />
                          </ActionButton>

                          <ActionButton
                            label="Edit Charger"
                            onClick={() => openEditModal(charger)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </ActionButton>

                          <ActionButton
                            label={
                              charger.status === "Offline"
                                ? "Activate Charger"
                                : "Deactivate Charger"
                            }
                            onClick={() =>
                              void handleToggleStatus(charger)
                            }
                          >
                            {charger.status === "Offline" ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <WifiOff className="h-4 w-4" />
                            )}
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="grid gap-3 p-4 md:hidden">
              {filteredChargers.map((charger) => (
                <div
                  key={charger.id}
                  className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                        <BatteryCharging className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                          {charger.chargerId}
                        </p>

                        <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                          {charger.name || charger.chargerType}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium ${getStatusClasses(
                        charger.status
                      )}`}
                    >
                      {charger.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MobileDetail
                      label="Type"
                      value={charger.chargerType}
                    />

                    <MobileDetail
                      label="Connector"
                      value={charger.connectorType}
                    />

                    <MobileDetail
                      label="Power"
                      value={
                        charger.powerOutput || charger.power
                          ? `${charger.powerOutput || charger.power} kW`
                          : "—"
                      }
                    />

                    <MobileDetail
                      label="Station"
                      value={station?.stationId || "—"}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <ActionButton
                      label="View Charger"
                      onClick={() => setViewCharger(charger)}
                    >
                      <Eye className="h-4 w-4" />
                    </ActionButton>

                    <ActionButton
                      label="Edit Charger"
                      onClick={() => openEditModal(charger)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </ActionButton>

                    <ActionButton
                      label={
                        charger.status === "Offline"
                          ? "Activate Charger"
                          : "Deactivate Charger"
                      }
                      onClick={() =>
                        void handleToggleStatus(charger)
                      }
                    >
                      {charger.status === "Offline" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <WifiOff className="h-4 w-4" />
                      )}
                    </ActionButton>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* View Charger Popup */}
      {viewCharger && (
        <div className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center overflow-hidden bg-black/70 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex h-auto max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-2rem)]">
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-primary)] px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Charger Details
                </h2>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {viewCharger.chargerId}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewCharger(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition hover:opacity-80"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
              <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
                <DetailItem
                  label="Charger ID"
                  value={viewCharger.chargerId}
                />

                <DetailItem
                  label="Name"
                  value={viewCharger.name || "—"}
                />

                <DetailItem
                  label="Charger Type"
                  value={viewCharger.chargerType}
                />

                <DetailItem
                  label="Connector Type"
                  value={viewCharger.connectorType}
                />

                <DetailItem
                  label="Power Output"
                  value={
                    viewCharger.powerOutput || viewCharger.power
                      ? `${viewCharger.powerOutput || viewCharger.power} kW`
                      : "—"
                  }
                />

                <DetailItem
                  label="Status"
                  value={viewCharger.status}
                />

                <DetailItem
                  label="Station"
                  value={station?.name || "—"}
                />

                <DetailItem
                  label="Created Date"
                  value={formatDate(viewCharger.createdDate)}
                />

                <div className="sm:col-span-2">
                  <DetailItem
                    label="Description"
                    value={viewCharger.description || "No description"}
                  />
                </div>
              </div>
            </div>

            <div className="flex shrink-0 justify-end border-t border-[var(--border-primary)] px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => setViewCharger(null)}
                className="h-10 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-5 text-sm font-medium text-[var(--text-primary)] transition hover:opacity-80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Charger Popup */}
      {editCharger && (
        <div className="fixed inset-0 z-[100] h-screen w-screen overflow-hidden bg-black/70 p-3 backdrop-blur-sm sm:p-4">
          <div className="mx-auto flex h-full max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-2rem)]">
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-primary)] px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Edit Charger
                </h2>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Update {editCharger.chargerId}
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveCharger}
              className="hide-scrollbar min-h-0 flex-1 overflow-y-auto"
            >
              <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
                <FormInput
                  label="Charger ID"
                  value={editCharger.chargerId}
                  disabled
                />

                <FormInput
                  label="Charger Name"
                  value={editForm.name}
                  onChange={(value) =>
                    handleEditChange("name", value)
                  }
                  placeholder="Enter charger name"
                />

                <FormSelect
                  label="Charger Type"
                  value={editForm.chargerType}
                  onChange={(value) =>
                    handleEditChange("chargerType", value)
                  }
                  options={chargerTypes}
                />

                <FormSelect
                  label="Connector Type"
                  value={editForm.connectorType}
                  onChange={(value) =>
                    handleEditChange("connectorType", value)
                  }
                  options={connectorTypes}
                />

                <FormInput
                  label="Power Output (kW)"
                  type="number"
                  value={editForm.powerOutput}
                  onChange={(value) =>
                    handleEditChange("powerOutput", value)
                  }
                  placeholder="Enter power output"
                />

                <FormSelect
                  label="Status"
                  value={editForm.status}
                  onChange={(value) =>
                    handleEditChange("status", value)
                  }
                  options={chargerStatuses}
                />

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
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
                    className="w-full resize-none rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--input-text)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
                    placeholder="Enter charger description"
                  />
                </div>
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[var(--border-primary)] bg-[var(--card-bg)] px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="h-11 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-5 text-sm font-medium text-[var(--text-primary)] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
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
        className="h-11 w-full appearance-none rounded-xl border border-[var(--border-primary)] bg-[var(--card-bg)] px-4 pr-11 text-sm text-[var(--text-primary)] outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
        
        aria-label={placeholder}
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-[var(--input-bg)] text-[var(--input-text)]"
          >
            {option === "All" ? placeholder : option}
          </option>
        ))}
      </select>

      <svg
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-primary)]"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 111.08-1.04l-4.25-4.51a.75.75 0 01-1.08 1.04l-4.25-4.51a.75.75 0 01-1.06-.02z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
        {label}
      </label>

      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className={`h-11 w-full rounded-xl border border-[var(--border-primary)] px-4 text-sm outline-none transition ${
          disabled
            ? "bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
            : "bg-[var(--input-bg)] text-[var(--input-text)] placeholder:text-[var(--text-muted)] focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
        }`}
      />
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
        {label}
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full appearance-none rounded-xl border border-[var(--border-primary)] bg-[var(--card-bg)] px-4 pr-10 text-sm text-[var(--text-primary)] outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
          
        >
          {options.map((option) => (
            <option
              key={option}
              value={option}
              className="bg-[var(--input-bg)] text-[var(--input-text)]"
            >
              {option}
            </option>
          ))}
        </select>

        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-primary)]"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 111.08 1.04l-4.25-4.51a.75.75 0 01-1.08 1.04l-4.25-4.51a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
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

function MobileDetail({
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

      <p className="mt-1 break-words text-xs font-medium text-[var(--text-secondary)]">
        {value}
      </p>
    </div>
  );
}

function EmptyChargerState() {
  return (
    <div className="p-6">
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-8 text-center">
        <BatteryCharging className="mx-auto h-8 w-8 text-[var(--text-muted)]" />

        <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
          No chargers found
        </p>

        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Try changing your search or filter selections.
        </p>
      </div>
    </div>
  );
}

function CalendarDaysIcon() {
  return <CalendarIcon />;
}

function CalendarIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}