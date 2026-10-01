import {
  Activity,
  BatteryCharging,
  Building2,
  CheckCircle2,
  Edit3,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserX,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import api from "../../services/api";
import type {
  ChargerStatus,
  ChargerType,
  ConnectorType,
} from "../../types";

interface Charger {
  id: string;
  chargerId: string;
  stationId: string;
  chargerNumber: string;
  chargerType: ChargerType;
  connectorType: ConnectorType;
  powerOutput: number;
  pricePerKwh: number;
  status: ChargerStatus;
}

interface Station {
  id: string;
  stationId: string;
  stationName: string;
  city: string;
}

interface ChargerFormData {
  stationId: string;
  chargerNumber: string;
  chargerType: ChargerType;
  connectorType: ConnectorType;
  powerOutput: string;
  pricePerKwh: string;
  status: ChargerStatus;
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

const emptyForm: ChargerFormData = {
  stationId: "",
  chargerNumber: "",
  chargerType: "AC Charger",
  connectorType: "Type 2",
  powerOutput: "",
  pricePerKwh: "",
  status: "Available",
};

function Chargers() {
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [stations, setStations] = useState<Station[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [connectorFilter, setConnectorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingCharger, setEditingCharger] =
    useState<Charger | null>(null);

  const [form, setForm] =
    useState<ChargerFormData>(emptyForm);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!showModal && !deleteId) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [showModal, deleteId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [chargersResponse, stationsResponse] =
        await Promise.all([
          api.get<Charger[]>("/chargers"),
          api.get<Station[]>("/stations"),
        ]);

      setChargers(chargersResponse.data);
      setStations(stationsResponse.data);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to load charger data. Please make sure JSON Server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStation = (stationId: string) => {
    return stations.find(
      (station) => station.stationId === stationId
    );
  };

  const getStationName = (stationId: string) => {
    const station = getStation(stationId);

    return station
      ? station.stationName
      : stationId || "Unknown Station";
  };

  const stats = useMemo(() => {
    return {
      total: chargers.length,

      available: chargers.filter(
        (charger) => charger.status === "Available"
      ).length,

      inUse: chargers.filter(
        (charger) =>
          charger.status === "Booked" ||
          charger.status === "Charging" ||
          charger.status === "Occupied"
      ).length,

      maintenance: chargers.filter(
        (charger) => charger.status === "Maintenance"
      ).length,

      offline: chargers.filter(
        (charger) => charger.status === "Offline"
      ).length,
    };
  }, [chargers]);

  const filteredChargers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return chargers.filter((charger) => {
      const station = getStation(charger.stationId);

      const matchesSearch =
        !query ||
        charger.chargerId.toLowerCase().includes(query) ||
        charger.chargerNumber.toLowerCase().includes(query) ||
        charger.chargerType.toLowerCase().includes(query) ||
        charger.connectorType.toLowerCase().includes(query) ||
        station?.stationName.toLowerCase().includes(query) ||
        station?.city.toLowerCase().includes(query);

      const matchesStation =
        !stationFilter ||
        charger.stationId === stationFilter;

      const matchesType =
        !typeFilter ||
        charger.chargerType === typeFilter;

      const matchesConnector =
        !connectorFilter ||
        charger.connectorType === connectorFilter;

      const matchesStatus =
        !statusFilter ||
        charger.status === statusFilter;

      return (
        matchesSearch &&
        matchesStation &&
        matchesType &&
        matchesConnector &&
        matchesStatus
      );
    });
  }, [
    chargers,
    search,
    stationFilter,
    typeFilter,
    connectorFilter,
    statusFilter,
    stations,
  ]);

  const openAddModal = () => {
    setEditingCharger(null);

    setForm({
      ...emptyForm,
      stationId: stations[0]?.stationId ?? "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (charger: Charger) => {
    setEditingCharger(charger);

    setForm({
      stationId: charger.stationId,
      chargerNumber: charger.chargerNumber,
      chargerType: charger.chargerType,
      connectorType: charger.connectorType,
      powerOutput: String(charger.powerOutput),
      pricePerKwh: String(charger.pricePerKwh),
      status: charger.status,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCharger(null);
    setForm(emptyForm);
  };

  const updateForm = <K extends keyof ChargerFormData>(
    key: K,
    value: ChargerFormData[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const generateChargerId = () => {
    let highest = 0;

    chargers.forEach((charger) => {
      const match = charger.chargerId.match(
        /CH(\d+)/i
      );

      if (match) {
        highest = Math.max(
          highest,
          Number(match[1])
        );
      }
    });

    return `CH${String(highest + 1).padStart(3, "0")}`;
  };

  const validateForm = () => {
    if (!form.stationId) {
      return "Please select a station.";
    }

    if (!form.chargerNumber.trim()) {
      return "Please enter the charger number.";
    }

    if (!form.powerOutput.trim()) {
      return "Please enter the power output.";
    }

    if (!form.pricePerKwh.trim()) {
      return "Please enter the price per kWh.";
    }

    const power = Number(form.powerOutput);
    const price = Number(form.pricePerKwh);

    if (!Number.isFinite(power) || power <= 0) {
      return "Power output must be a valid number greater than 0.";
    }

    if (!Number.isFinite(price) || price < 0) {
      return "Price per kWh must be a valid number.";
    }

    const duplicate = chargers.some(
      (charger) =>
        charger.chargerNumber.trim().toLowerCase() ===
          form.chargerNumber.trim().toLowerCase() &&
        charger.stationId === form.stationId &&
        charger.id !== editingCharger?.id
    );

    if (duplicate) {
      return "A charger with this number already exists at this station.";
    }

    return "";
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        stationId: form.stationId,
        chargerNumber: form.chargerNumber.trim(),
        chargerType: form.chargerType,
        connectorType: form.connectorType,
        powerOutput: Number(form.powerOutput),
        pricePerKwh: Number(form.pricePerKwh),
        status: form.status,
      };

      if (editingCharger) {
        const response = await api.patch<Charger>(
          `/chargers/${editingCharger.id}`,
          payload
        );

        setChargers((previous) =>
          previous.map((charger) =>
            charger.id === editingCharger.id
              ? response.data
              : charger
          )
        );

        setSuccess("Charger updated successfully.");
      } else {
        const newCharger: Omit<
          Charger,
          "id"
        > & { id?: string } = {
          id: undefined,
          chargerId: generateChargerId(),
          ...payload,
        };

        const response = await api.post<Charger>(
          "/chargers",
          newCharger
        );

        setChargers((previous) => [
          ...previous,
          response.data,
        ]);

        setSuccess("Charger added successfully.");
      }

      setTimeout(() => {
        closeModal();
      }, 500);
    } catch (err) {
      console.error(err);
      setError(
        editingCharger
          ? "Unable to update charger."
          : "Unable to add charger."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (
    charger: Charger
  ) => {
    const newStatus: ChargerStatus =
      charger.status === "Offline"
        ? "Available"
        : "Offline";

    try {
      setError("");

      const response = await api.patch<Charger>(
        `/chargers/${charger.id}`,
        {
          status: newStatus,
        }
      );

      setChargers((previous) =>
        previous.map((item) =>
          item.id === charger.id
            ? response.data
            : item
        )
      );

      setSuccess(
        newStatus === "Offline"
          ? "Charger deactivated successfully."
          : "Charger activated successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error(err);
      setError("Unable to change charger status.");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setError("");

      await api.delete(`/chargers/${deleteId}`);

      setChargers((previous) =>
        previous.filter(
          (charger) => charger.id !== deleteId
        )
      );

      setDeleteId(null);

      setSuccess("Charger deleted successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error(err);
      setError("Unable to delete charger.");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStationFilter("");
    setTypeFilter("");
    setConnectorFilter("");
    setStatusFilter("");
  };

  const getStatusClass = (
    status: ChargerStatus
  ) => {
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
        return "border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]";
    }
  };

  const getStatusIcon = (
    status: ChargerStatus
  ) => {
    switch (status) {
      case "Available":
        return (
          <CheckCircle2 className="h-3.5 w-3.5" />
        );

      case "Charging":
        return (
          <BatteryCharging className="h-3.5 w-3.5" />
        );

      case "Maintenance":
        return (
          <Wrench className="h-3.5 w-3.5" />
        );

      case "Offline":
        return (
          <UserX className="h-3.5 w-3.5" />
        );

      case "Booked":
      case "Occupied":
        return (
          <Activity className="h-3.5 w-3.5" />
        );

      default:
        return (
          <Activity className="h-3.5 w-3.5" />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
            <Zap className="h-6 w-6 animate-pulse text-cyan-400" />
          </div>

          <p className="text-sm text-[var(--text-secondary)]">
            Loading chargers...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
            <Zap className="h-4 w-4" />
            Charger Management
          </div>

          <h1 className="truncate text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            Chargers
          </h1>

          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Manage charging equipment across all stations.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:-translate-y-0.5 hover:from-cyan-300 hover:to-violet-400"
        >
          <Plus className="h-4 w-4" />
          Add Charger
        </button>
      </div>

      {/* Alerts */}
      {error && !showModal && (
        <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && !showModal && (
        <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Chargers"
          value={stats.total}
          icon={Zap}
          description="Across all stations"
          iconClass="text-cyan-400"
          iconBg="bg-cyan-400/10"
        />

        <StatCard
          title="Available"
          value={stats.available}
          icon={CheckCircle2}
          description="Ready for charging"
          iconClass="text-emerald-400"
          iconBg="bg-emerald-400/10"
        />

        <StatCard
          title="In Use"
          value={stats.inUse}
          icon={BatteryCharging}
          description="Booked or charging"
          iconClass="text-blue-400"
          iconBg="bg-blue-400/10"
        />

        <StatCard
          title="Maintenance"
          value={stats.maintenance}
          icon={Wrench}
          description="Currently maintained"
          iconClass="text-amber-400"
          iconBg="bg-amber-400/10"
        />

        <StatCard
          title="Offline"
          value={stats.offline}
          icon={UserX}
          description="Not available"
          iconClass="text-red-400"
          iconBg="bg-red-400/10"
        />
      </div>

      {/* Filters */}
      <section className="mt-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Search & Filters
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Find chargers by station, type, connector or status.
            </p>
          </div>

          {(search ||
            stationFilter ||
            typeFilter ||
            connectorFilter ||
            statusFilter) && (
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

        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {/* Search */}
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search chargers..."
              className="h-11 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/10"
            />
          </div>

          {/* Station */}
          <select
            value={stationFilter}
            onChange={(event) =>
              setStationFilter(event.target.value)
            }
            className="h-11 min-w-0 rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-cyan-400/40"
          >
            <option value="">All Stations</option>

            {stations.map((station) => (
              <option
                key={station.stationId}
                value={station.stationId}
              >
                {station.stationName}
              </option>
            ))}
          </select>

          {/* Charger Type */}
          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value)
            }
            className="h-11 min-w-0 rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-cyan-400/40"
          >
            <option value="">
              All Charger Types
            </option>

            {chargerTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* Connector */}
          <select
            value={connectorFilter}
            onChange={(event) =>
              setConnectorFilter(event.target.value)
            }
            className="h-11 min-w-0 rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-cyan-400/40"
          >
            <option value="">
              All Connectors
            </option>

            {connectorTypes.map((connector) => (
              <option
                key={connector}
                value={connector}
              >
                {connector}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="h-11 min-w-0 rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-cyan-400/40"
          >
            <option value="">All Statuses</option>

            {chargerStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Results */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-[var(--text-muted)]">
          Showing{" "}
          <span className="font-semibold text-[var(--text-secondary)]">
            {filteredChargers.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-[var(--text-secondary)]">
            {chargers.length}
          </span>{" "}
          chargers
        </p>
      </div>

      {/* Desktop Table */}
<section className="mt-4 hidden w-full min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] lg:block">
  <div className="w-full min-w-0">
    <table className="w-full table-fixed">
      <thead>
        <tr className="border-b border-[var(--border-primary)] text-left">
          <th className="w-[11%] px-3 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:px-4">
            Charger
          </th>

          <th className="w-[19%] px-3 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:px-4">
            Station
          </th>

          <th className="w-[16%] px-3 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:px-4">
            Type
          </th>

          <th className="w-[10%] px-3 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:px-4">
            Connector
          </th>

          <th className="w-[9%] px-3 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:px-4">
            Power
          </th>

          <th className="w-[10%] px-3 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:px-4">
            Price/kWh
          </th>

          <th className="w-[13%] px-3 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:px-4">
            Status
          </th>

          <th className="w-[12%] px-3 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:px-4">
            Actions
          </th>
        </tr>
      </thead>

      <tbody>
        {filteredChargers.length === 0 ? (
          <tr>
            <td
              colSpan={8}
              className="px-5 py-16 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-tertiary)]">
                <Zap className="h-6 w-6 text-[var(--text-muted)]" />
              </div>

              <p className="mt-4 text-sm font-medium text-[var(--text-secondary)]">
                No chargers found
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Try changing your search or filters.
              </p>
            </td>
          </tr>
        ) : (
          filteredChargers.map((charger) => (
            <tr
              key={charger.id}
              className="border-b border-[var(--border-primary)] last:border-0 transition hover:bg-[var(--bg-secondary)]"
            >
              {/* Charger */}
              <td className="min-w-0 px-3 py-4 xl:px-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                    {charger.chargerId}
                  </p>

                  <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                    {charger.chargerNumber}
                  </p>
                </div>
              </td>

              {/* Station */}
              <td className="min-w-0 px-3 py-4 xl:px-4">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10">
                    <Building2 className="h-4 w-4 text-cyan-400" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {getStationName(
                        charger.stationId
                      )}
                    </p>

                    <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                      {getStation(
                        charger.stationId
                      )?.city ?? charger.stationId}
                    </p>
                  </div>
                </div>
              </td>

              {/* Charger Type */}
              <td className="min-w-0 px-3 py-4 xl:px-4">
                <p
                  className="truncate text-sm text-[var(--text-secondary)]"
                  title={charger.chargerType}
                >
                  {charger.chargerType}
                </p>
              </td>

              {/* Connector */}
              <td className="min-w-0 px-3 py-4 xl:px-4">
                <p
                  className="truncate text-sm text-[var(--text-secondary)]"
                  title={charger.connectorType}
                >
                  {charger.connectorType}
                </p>
              </td>

              {/* Power */}
              <td className="px-3 py-4 xl:px-4">
                <span className="whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">
                  {charger.powerOutput} kW
                </span>
              </td>

              {/* Price */}
              <td className="px-3 py-4 xl:px-4">
                <span className="whitespace-nowrap text-sm font-medium text-cyan-300">
                  ₹{charger.pricePerKwh}
                </span>
              </td>

              {/* Status */}
              <td className="px-3 py-4 xl:px-4">
                <div className="flex min-w-0 items-center">
                  <StatusBadge
                    status={charger.status}
                    className={getStatusClass(
                      charger.status
                    )}
                    icon={getStatusIcon(
                      charger.status
                    )}
                  />
                </div>
              </td>

              {/* Actions */}
              <td className="px-3 py-4 xl:px-4">
                <div className="flex items-center justify-end gap-1.5 xl:gap-2">
                  {/* Edit */}
                  <ActionButton
                    label="Edit charger"
                    onClick={() =>
                      openEditModal(charger)
                    }
                    className="hover:border-cyan-400/40 hover:bg-cyan-400 hover:text-slate-950"
                  >
                    <Edit3 className="h-4 w-4" />
                  </ActionButton>

                  {/* Activate / Deactivate */}
                  <ActionButton
                    label={
                      charger.status === "Offline"
                        ? "Activate charger"
                        : "Deactivate charger"
                    }
                    onClick={() =>
                      void handleToggleStatus(
                        charger
                      )
                    }
                    className={
                      charger.status === "Offline"
                        ? "hover:border-emerald-400/40 hover:bg-emerald-400 hover:text-slate-950"
                        : "hover:border-amber-400/40 hover:bg-amber-400 hover:text-slate-950"
                    }
                  >
                    {charger.status ===
                    "Offline" ? (
                      <UserCheck className="h-4 w-4" />
                    ) : (
                      <UserX className="h-4 w-4" />
                    )}
                  </ActionButton>

                  {/* Delete */}
                  <ActionButton
                    label="Delete charger"
                    onClick={() =>
                      setDeleteId(charger.id)
                    }
                    className="hover:border-red-400/40 hover:bg-red-400 hover:text-[var(--text-primary)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </ActionButton>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
</section>

      {/* Mobile / Tablet Cards */}
      <section className="mt-4 grid gap-4 lg:hidden">
        {filteredChargers.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] px-5 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-tertiary)]">
              <Zap className="h-6 w-6 text-[var(--text-muted)]" />
            </div>

            <p className="mt-4 text-sm font-medium text-[var(--text-secondary)]">
              No chargers found
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          filteredChargers.map((charger) => (
            <div
              key={charger.id}
              className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 transition hover:border-cyan-400/20"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                    <Zap className="h-5 w-5 text-cyan-400" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                      {charger.chargerId}
                    </p>

                    <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                      {charger.chargerNumber}
                    </p>
                  </div>
                </div>

                <StatusBadge
                  status={charger.status}
                  className={getStatusClass(
                    charger.status
                  )}
                  icon={getStatusIcon(
                    charger.status
                  )}
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <InfoItem
                  label="Station"
                  value={getStationName(
                    charger.stationId
                  )}
                />

                <InfoItem
                  label="City"
                  value={
                    getStation(charger.stationId)
                      ?.city ?? "-"
                  }
                />

                <InfoItem
                  label="Charger Type"
                  value={charger.chargerType}
                />

                <InfoItem
                  label="Connector"
                  value={charger.connectorType}
                />

                <InfoItem
                  label="Power"
                  value={`${charger.powerOutput} kW`}
                />

                <InfoItem
                  label="Price"
                  value={`₹${charger.pricePerKwh}/kWh`}
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-[var(--border-primary)] pt-4">
                <ActionButton
                  label="Edit charger"
                  onClick={() =>
                    openEditModal(charger)
                  }
                  className="hover:border-cyan-400/40 hover:bg-cyan-400 hover:text-slate-950"
                >
                  <Edit3 className="h-4 w-4" />
                </ActionButton>

                <ActionButton
                  label={
                    charger.status === "Offline"
                      ? "Activate charger"
                      : "Deactivate charger"
                  }
                  onClick={() =>
                    void handleToggleStatus(charger)
                  }
                  className={
                    charger.status === "Offline"
                      ? "hover:border-emerald-400/40 hover:bg-emerald-400 hover:text-slate-950"
                      : "hover:border-amber-400/40 hover:bg-amber-400 hover:text-slate-950"
                  }
                >
                  {charger.status === "Offline" ? (
                    <UserCheck className="h-4 w-4" />
                  ) : (
                    <UserX className="h-4 w-4" />
                  )}
                </ActionButton>

                <ActionButton
                  label="Delete charger"
                  onClick={() =>
                    setDeleteId(charger.id)
                  }
                  className="hover:border-red-400/40 hover:bg-red-400 hover:text-[var(--text-primary)]"
                >
                  <Trash2 className="h-4 w-4" />
                </ActionButton>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-5">
          <div className="flex max-h-[calc(100vh-24px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-40px)]">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-primary)] px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {editingCharger
                    ? "Edit Charger"
                    : "Add Charger"}
                </h2>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {editingCharger
                    ? "Update charger configuration and status."
                    : "Add a new charger to your network."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <form
              onSubmit={handleSubmit}
              className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6"
            >
              {error && (
                <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                {/* Station */}
                <FormField label="Station">
                  <select
                    value={form.stationId}
                    onChange={(event) =>
                      updateForm(
                        "stationId",
                        event.target.value
                      )
                    }
                    className="input-field"
                    required
                  >
                    <option value="">
                      Select station
                    </option>

                    {stations.map((station) => (
                      <option
                        key={station.stationId}
                        value={station.stationId}
                      >
                        {station.stationName} —{" "}
                        {station.city}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Charger Number */}
                <FormField label="Charger Number">
                  <input
                    type="text"
                    value={form.chargerNumber}
                    onChange={(event) =>
                      updateForm(
                        "chargerNumber",
                        event.target.value
                      )
                    }
                    placeholder="Example: Charger 01"
                    className="input-field"
                    required
                  />
                </FormField>

                {/* Charger Type */}
                <FormField label="Charger Type">
                  <select
                    value={form.chargerType}
                    onChange={(event) =>
                      updateForm(
                        "chargerType",
                        event.target
                          .value as ChargerType
                      )
                    }
                    className="input-field"
                    required
                  >
                    {chargerTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Connector */}
                <FormField label="Connector Type">
                  <select
                    value={form.connectorType}
                    onChange={(event) =>
                      updateForm(
                        "connectorType",
                        event.target
                          .value as ConnectorType
                      )
                    }
                    className="input-field"
                    required
                  >
                    {connectorTypes.map(
                      (connector) => (
                        <option
                          key={connector}
                          value={connector}
                        >
                          {connector}
                        </option>
                      )
                    )}
                  </select>
                </FormField>

                {/* Power */}
                <FormField label="Power Output (kW)">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.powerOutput}
                    onChange={(event) =>
                      updateForm(
                        "powerOutput",
                        event.target.value
                      )
                    }
                    placeholder="Example: 60"
                    className="input-field"
                    required
                  />
                </FormField>

                {/* Price */}
                <FormField label="Price per kWh (₹)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.pricePerKwh}
                    onChange={(event) =>
                      updateForm(
                        "pricePerKwh",
                        event.target.value
                      )
                    }
                    placeholder="Example: 18"
                    className="input-field"
                    required
                  />
                </FormField>

                {/* Status */}
                <FormField label="Status">
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateForm(
                        "status",
                        event.target
                          .value as ChargerStatus
                      )
                    }
                    className="input-field"
                    required
                  >
                    {chargerStatuses.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      )
                    )}
                  </select>
                </FormField>

                {/* Generated ID */}
                <FormField label="Charger ID">
                  <input
                    type="text"
                    value={
                      editingCharger
                        ? editingCharger.chargerId
                        : "Generated automatically"
                    }
                    readOnly
                    className="input-field cursor-not-allowed opacity-60"
                  />
                </FormField>
              </div>

              {/* Footer */}
              <div className="mt-5 flex shrink-0 flex-col-reverse gap-3 border-t border-[var(--border-primary)] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-11 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="h-11 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-6 text-sm font-bold text-slate-950 transition hover:from-cyan-300 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingCharger
                      ? "Update Charger"
                      : "Add Charger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-6 shadow-2xl shadow-black/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-400/10">
              <Trash2 className="h-5 w-5 text-red-400" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-[var(--text-primary)]">
              Delete Charger?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              This action will permanently remove the
              charger from the system. This cannot be
              undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="h-11 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white hover:text-slate-950"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleDelete()}
                className="h-11 rounded-xl bg-red-500 px-5 text-sm font-bold text-[var(--text-primary)] transition hover:bg-red-400"
              >
                Delete Charger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Local styles */}
      <style>{`
        .input-field {
          width: 100%;
          height: 44px;
          min-width: 0;
          border-radius: 0.75rem;
          border: 1px solid var(--border-primary);
          background: var(--input-bg);
          padding: 0 0.875rem;
          font-size: 0.875rem;
          color: var(--input-text);
          outline: none;
          transition: all 0.2s ease;
        }

        .input-field::placeholder {
          color: var(--text-muted);
        }

        .input-field:focus {
          border-color: rgba(34,211,238,0.40);
          box-shadow: 0 0 0 2px rgba(34,211,238,0.08);
        }

        .input-field option {
          background: var(--input-bg);
          color: var(--input-text);
        }

        select.input-field {
          color-scheme: inherit;
        }

        input[type="number"].input-field {
          color-scheme: inherit;
        }
      `}</style>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  iconClass: string;
  iconBg: string;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
  iconBg,
}: StatCardProps) {
  return (
    <div className="group min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5 shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/20 hover:bg-[var(--bg-tertiary)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            {value}
          </p>

          <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon className={`h-5 w-5 ${iconClass}`} />
        </div>
      </div>
    </div>
  );
}

interface StatusBadgeProps {
  status: ChargerStatus;
  className: string;
  icon: React.ReactNode;
}

function StatusBadge({
  status,
  className,
  icon,
}: StatusBadgeProps) {
  return (
    <span
      className={`
        inline-flex
        max-w-full
        items-center
        gap-1.5
        rounded-full
        border
        px-2.5
        py-1
        text-[11px]
        font-semibold
        leading-4
        whitespace-nowrap
        ${className}
      `}
      title={status}
    >
      {icon}

      <span className="truncate">
        {status}
      </span>
    </span>
  );
}

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}

function ActionButton({
  label,
  onClick,
  className = "",
  children,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition ${className}`}
    >
      {children}
    </button>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
}

function InfoItem({
  label,
  value,
}: InfoItemProps) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-medium text-[var(--text-secondary)]">
        {value}
      </p>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
}

function FormField({
  label,
  children,
}: FormFieldProps) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
        {label}
      </label>

      {children}
    </div>
  );
}

export default Chargers;