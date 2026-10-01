import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  Edit3,
  Eye,
  Filter,
  Loader2,
  Plus,
  Search,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import api from "../../services/api";

type MaintenanceStatus =
  | "Reported"
  | "Scheduled"
  | "In Progress"
  | "Completed"
  | "Cancelled";

interface Maintenance {
  id: string;
  maintenanceId: string;
  stationId: string;
  chargerId?: string;
  issue: string;
  description?: string;
  reportedDate: string;
  scheduledDate?: string;
  completedDate?: string;
  status: MaintenanceStatus;
  priority?: "Low" | "Medium" | "High" | "Critical";
  technician?: string;
  notes?: string;
}

interface Station {
  id: string;
  stationId: string;
  name: string;
}

interface Charger {
  id: string;
  chargerId: string;
  stationId: string;
  type?: string;
  connectorType?: string;
}

type MaintenanceForm = {
  stationId: string;
  chargerId: string;
  issue: string;
  description: string;
  reportedDate: string;
  scheduledDate: string;
  completedDate: string;
  status: MaintenanceStatus;
  priority: "Low" | "Medium" | "High" | "Critical";
  technician: string;
  notes: string;
};

const statusOptions: MaintenanceStatus[] = [
  "Reported",
  "Scheduled",
  "In Progress",
  "Completed",
  "Cancelled",
];

const priorityOptions = ["Low", "Medium", "High", "Critical"] as const;

const emptyForm: MaintenanceForm = {
  stationId: "",
  chargerId: "",
  issue: "",
  description: "",
  reportedDate: new Date().toISOString().slice(0, 10),
  scheduledDate: "",
  completedDate: "",
  status: "Reported",
  priority: "Medium",
  technician: "",
  notes: "",
};

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

function getStatusClass(status: MaintenanceStatus) {
  switch (status) {
    case "Reported":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    case "Scheduled":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";
    case "In Progress":
      return "border-violet-400/20 bg-violet-400/10 text-violet-300";
    case "Completed":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    case "Cancelled":
      return "border-red-400/20 bg-red-400/10 text-red-300";
    default:
      return "border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]";
  }
}

function getPriorityClass(
  priority?: "Low" | "Medium" | "High" | "Critical",
) {
  switch (priority) {
    case "Low":
      return "border-slate-400/20 bg-slate-400/10 text-[var(--text-secondary)]";
    case "Medium":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";
    case "High":
      return "border-orange-400/20 bg-orange-400/10 text-orange-300";
    case "Critical":
      return "border-red-400/20 bg-red-400/10 text-red-300";
    default:
      return "border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]";
  }
}

function ActionButton({
  label,
  onClick,
  children,
  className = "",
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition hover:border-white/20 hover:bg-[var(--bg-tertiary)] ${className}`}
    >
      {children}
    </button>
  );
}

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3.5">
      <p className="mb-1.5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {icon}
        {label}
      </p>
      <p className="break-words text-sm font-medium text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

export default function Maintenance() {
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [chargers, setChargers] = useState<Charger[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingMaintenance, setEditingMaintenance] =
    useState<Maintenance | null>(null);

  const [viewMaintenance, setViewMaintenance] =
    useState<Maintenance | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState<MaintenanceForm>(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const modalOpen = Boolean(showModal || viewMaintenance || deleteId);

    if (modalOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [showModal, viewMaintenance, deleteId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [maintenanceResponse, stationsResponse, chargersResponse] =
        await Promise.all([
          api.get<Maintenance[]>("/maintenance"),
          api.get<Station[]>("/stations"),
          api.get<Charger[]>("/chargers"),
        ]);

      setMaintenance(maintenanceResponse.data);
      setStations(stationsResponse.data);
      setChargers(chargersResponse.data);
    } catch (err) {
      console.error("Failed to fetch maintenance data:", err);
      setError("Unable to load maintenance data.");
    } finally {
      setLoading(false);
    }
  };

  const getStation = (stationId?: string) =>
    stations.find(
      (station) => station.id === stationId || station.stationId === stationId,
    );

  const getCharger = (chargerId?: string) =>
    chargers.find(
      (charger) => charger.id === chargerId || charger.chargerId === chargerId,
    );

  const getStationName = (stationId?: string) => {
    if (!stationId) return "—";

    const station = getStation(stationId);

    return station ? station.name : stationId;
  };

  const getStationCode = (stationId?: string) => {
    if (!stationId) return "—";

    const station = getStation(stationId);

    return station?.stationId || stationId;
  };

  const getChargerCode = (chargerId?: string) => {
    if (!chargerId) return "—";

    const charger = getCharger(chargerId);

    return charger?.chargerId || chargerId;
  };

  const filteredMaintenance = useMemo(() => {
    const query = search.trim().toLowerCase();

    return maintenance.filter((item) => {
      const matchesSearch =
        !query ||
        item.maintenanceId.toLowerCase().includes(query) ||
        item.issue.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        getStationName(item.stationId).toLowerCase().includes(query) ||
        getChargerCode(item.chargerId).toLowerCase().includes(query) ||
        item.technician?.toLowerCase().includes(query);

      const matchesStation =
        !stationFilter || item.stationId === stationFilter;

      const matchesStatus =
        !statusFilter || item.status === statusFilter;

      const matchesPriority =
        !priorityFilter || item.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStation &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [
    maintenance,
    search,
    stationFilter,
    statusFilter,
    priorityFilter,
    stations,
    chargers,
  ]);

  const scheduledCount = maintenance.filter(
    (item) => item.status === "Scheduled",
  ).length;

  const inProgressCount = maintenance.filter(
    (item) => item.status === "In Progress",
  ).length;

  const completedCount = maintenance.filter(
    (item) => item.status === "Completed",
  ).length;

  const openCount = maintenance.filter(
    (item) =>
      item.status === "Reported" ||
      item.status === "Scheduled" ||
      item.status === "In Progress",
  ).length;

  const clearFilters = () => {
    setSearch("");
    setStationFilter("");
    setStatusFilter("");
    setPriorityFilter("");
  };

  const generateMaintenanceId = () => {
    const numbers = maintenance
      .map((item) => {
        const match = item.maintenanceId?.match(/\d+$/);
        return match ? Number(match[0]) : 0;
      })
      .filter((number) => Number.isFinite(number));

    const nextNumber = Math.max(0, ...numbers) + 1;

    return `MT${String(nextNumber).padStart(3, "0")}`;
  };

  const openAddModal = () => {
    setEditingMaintenance(null);
    setForm({
      ...emptyForm,
      reportedDate: new Date().toISOString().slice(0, 10),
    });
    setError("");
    setShowModal(true);
  };

  const openEditModal = (item: Maintenance) => {
    setEditingMaintenance(item);

    setForm({
      stationId: item.stationId || "",
      chargerId: item.chargerId || "",
      issue: item.issue || "",
      description: item.description || "",
      reportedDate: item.reportedDate || "",
      scheduledDate: item.scheduledDate || "",
      completedDate: item.completedDate || "",
      status: item.status,
      priority: item.priority || "Medium",
      technician: item.technician || "",
      notes: item.notes || "",
    });

    setError("");
    setShowModal(true);
  };

  const updateForm = <K extends keyof MaintenanceForm>(
    key: K,
    value: MaintenanceForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = async (
    event: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!form.stationId) {
      setError("Please select a station.");
      return;
    }

    if (!form.issue.trim()) {
      setError("Please enter the maintenance issue.");
      return;
    }

    if (!form.reportedDate) {
      setError("Please select the reported date.");
      return;
    }

    if (
      form.scheduledDate &&
      form.reportedDate &&
      form.scheduledDate < form.reportedDate
    ) {
      setError("Scheduled date cannot be before the reported date.");
      return;
    }

    if (
      form.completedDate &&
      form.scheduledDate &&
      form.completedDate < form.scheduledDate
    ) {
      setError("Completed date cannot be before the scheduled date.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingMaintenance) {
        const updatedMaintenance: Maintenance = {
          ...editingMaintenance,
          stationId: form.stationId,
          chargerId: form.chargerId || undefined,
          issue: form.issue.trim(),
          description: form.description.trim() || undefined,
          reportedDate: form.reportedDate,
          scheduledDate: form.scheduledDate || undefined,
          completedDate: form.completedDate || undefined,
          status: form.status,
          priority: form.priority,
          technician: form.technician.trim() || undefined,
          notes: form.notes.trim() || undefined,
        };

        const response = await api.put<Maintenance>(
          `/maintenance/${editingMaintenance.id}`,
          updatedMaintenance,
        );

        setMaintenance((current) =>
          current.map((item) =>
            item.id === editingMaintenance.id ? response.data : item,
          ),
        );
      } else {
        const maintenanceId = generateMaintenanceId();

        const newMaintenance: Maintenance = {
          id: maintenanceId,
          maintenanceId,
          stationId: form.stationId,
          chargerId: form.chargerId || undefined,
          issue: form.issue.trim(),
          description: form.description.trim() || undefined,
          reportedDate: form.reportedDate,
          scheduledDate: form.scheduledDate || undefined,
          completedDate: form.completedDate || undefined,
          status: form.status,
          priority: form.priority,
          technician: form.technician.trim() || undefined,
          notes: form.notes.trim() || undefined,
        };

        const response = await api.post<Maintenance>(
          "/maintenance",
          newMaintenance,
        );

        setMaintenance((current) => [...current, response.data]);
      }

      setShowModal(false);
      setEditingMaintenance(null);
      setForm(emptyForm);
    } catch (err) {
      console.error("Failed to save maintenance:", err);
      setError("Unable to save maintenance record.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setSaving(true);

      await api.delete(`/maintenance/${deleteId}`);

      setMaintenance((current) =>
        current.filter((item) => item.id !== deleteId),
      );

      setDeleteId(null);
    } catch (err) {
      console.error("Failed to delete maintenance:", err);
      setError("Unable to delete maintenance record.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (
    item: Maintenance,
    status: MaintenanceStatus,
  ) => {
    try {
      const updatedItem: Maintenance = {
        ...item,
        status,
        completedDate:
          status === "Completed"
            ? item.completedDate || new Date().toISOString().slice(0, 10)
            : item.completedDate,
        scheduledDate:
          status === "Scheduled" || status === "In Progress"
            ? item.scheduledDate || new Date().toISOString().slice(0, 10)
            : item.scheduledDate,
      };

      const response = await api.put<Maintenance>(
        `/maintenance/${item.id}`,
        updatedItem,
      );

      setMaintenance((current) =>
        current.map((record) =>
          record.id === item.id ? response.data : record,
        ),
      );
    } catch (err) {
      console.error("Failed to update maintenance status:", err);
      setError("Unable to update maintenance status.");
    }
  };

  const getNextStatus = (
    status: MaintenanceStatus,
  ): MaintenanceStatus | null => {
    switch (status) {
      case "Reported":
        return "Scheduled";
      case "Scheduled":
        return "In Progress";
      case "In Progress":
        return "Completed";
      default:
        return null;
    }
  };

  const nextStatusLabel = (status: MaintenanceStatus) => {
    switch (status) {
      case "Reported":
        return "Schedule";
      case "Scheduled":
        return "Start";
      case "In Progress":
        return "Complete";
      default:
        return "";
    }
  };

  return (
    <div className="w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-cyan-400">
            <Wrench className="h-4 w-4" />
            Admin / Maintenance
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Maintenance Management
          </h1>

          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
            Monitor charger maintenance, service issues and repair progress.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 text-sm font-semibold text-[#06111F] shadow-lg shadow-cyan-500/10 transition hover:bg-cyan-400"
        >
          <Plus className="h-4 w-4" />
          Add Maintenance
        </button>
      </div>

      {/* Stats */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total Records"
          value={maintenance.length}
          icon={<Wrench className="h-5 w-5" />}
          iconClass="bg-cyan-400/10 text-cyan-300"
        />

        <StatCard
          label="Open Issues"
          value={openCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconClass="bg-amber-400/10 text-amber-300"
        />

        <StatCard
          label="Scheduled"
          value={scheduledCount}
          icon={<CalendarDays className="h-5 w-5" />}
          iconClass="bg-blue-400/10 text-blue-300"
        />

        <StatCard
          label="In Progress"
          value={inProgressCount}
          icon={<Loader2 className="h-5 w-5" />}
          iconClass="bg-violet-400/10 text-violet-300"
        />

        <StatCard
          label="Completed"
          value={completedCount}
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconClass="bg-emerald-400/10 text-emerald-300"
        />
      </section>

      {/* Filters */}
      <section className="mt-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Search & Filters
              </h2>
            </div>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Find maintenance records by issue, station, status or priority.
            </p>
          </div>

          {(search ||
            stationFilter ||
            statusFilter ||
            priorityFilter) && (
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
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 !text-[var(--text-primary)]" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search maintenance..."
              className="input-field !pl-11"
            />
          </div>

          <select
            value={stationFilter}
            onChange={(event) => setStationFilter(event.target.value)}
            className="input-field"
          >
            <option value="">All Stations</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.stationId} — {station.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="input-field"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="input-field"
          >
            <option value="">All Priorities</option>
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Table */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)]">
        <div className="flex flex-col gap-1 border-b border-[var(--border-primary)] px-4 py-4 sm:px-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Maintenance Records
          </h2>

          <p className="text-xs text-[var(--text-muted)]">
            Showing {filteredMaintenance.length} of {maintenance.length}{" "}
            records
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
              Loading maintenance records...
            </div>
          </div>
        ) : filteredMaintenance.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
              <Wrench className="h-5 w-5 text-[var(--text-muted)]" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
              No maintenance records found
            </h3>

            <p className="mt-1 max-w-md text-xs leading-5 text-[var(--text-muted)]">
              Try changing your filters or add a new maintenance record.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden w-full lg:block">
              <table className="w-full table-fixed border-collapse">
            <colgroup>
  <col className="w-[8%]" />
  <col className="w-[6%]" />
  <col className="w-[6%]" />
  <col className="w-[12%]" />
  <col className="w-[12%]" />
  <col className="w-[8%]" />
  <col className="w-[8%]" />
  <col className="w-[18%]" />
</colgroup>
                <thead>
                  <tr className="border-b border-[var(--border-primary)] text-left">
                    <th className="px-4 py-4 text-xs font-semibold text-[var(--text-secondary)]">
                      Maintenance ID
                    </th>
                    <th className="px-4 py-4 text-xs font-semibold text-[var(--text-secondary)]">
                      Station
                    </th>
                    <th className="px-4 py-4 text-xs font-semibold text-[var(--text-secondary)]">
                      Charger
                    </th>
                    <th className="px-4 py-4 text-xs font-semibold text-[var(--text-secondary)]">
                      Issue
                    </th>
                    <th className="px-4 py-4 text-xs font-semibold text-[var(--text-secondary)]">
                      Reported
                    </th>
                    <th className="px-4 py-4 text-xs font-semibold text-[var(--text-secondary)]">
                      Priority
                    </th>
                    <th className="px-4 py-4 text-xs font-semibold text-[var(--text-secondary)]">
                      Status
                    </th>
                    <th className="px-4 py-4 text-xs font-semibold text-[var(--text-secondary)]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMaintenance.map((item) => {
                    const nextStatus = getNextStatus(item.status);

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-[var(--border-primary)] transition hover:bg-[var(--bg-tertiary)]"
                      >
                        <td className="px-4 py-5 align-middle">
                          <span className="font-mono text-xs font-semibold text-cyan-300">
                            {item.maintenanceId}
                          </span>
                        </td>

                        <td className="px-4 py-5 align-middle">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                              {getStationName(item.stationId)}
                            </p>
                            <p className="mt-1 truncate text-[11px] text-[var(--text-muted)]">
                              {getStationCode(item.stationId)}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-5 align-middle">
                          <span className="font-mono text-xs text-[var(--text-secondary)]">
                            {getChargerCode(item.chargerId)}
                          </span>
                        </td>

                        <td className="px-4 py-5 align-middle">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                              {item.issue}
                            </p>

                            {item.description && (
                              <p className="mt-1 truncate text-[11px] text-[var(--text-muted)]">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-5 align-middle">
                          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                            <CalendarDays className="h-4 w-4 shrink-0 !text-[var(--text-primary)]" />
                            <span>{formatDate(item.reportedDate)}</span>
                          </div>
                        </td>

                        <td className="px-4 py-5 align-middle">
                          <span
                            className={`maintenance-priority-badge inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${getPriorityClass(
                              item.priority,
                            )}`}
                          >
                            {item.priority || "Medium"}
                          </span>
                        </td>

                        <td className="px-4 py-5 align-middle">
                          <span
                            className={`maintenance-status-badge inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusClass(
                              item.status,
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>

         <td className="px-3 py-5 align-middle">
  <div className="flex items-center gap-2.5">
    <ActionButton
      label="View maintenance"
      onClick={() => setViewMaintenance(item)}
    >
      <Eye className="h-4 w-4 !text-[var(--text-primary)]" />
    </ActionButton>

    <ActionButton
      label="Edit maintenance"
      onClick={() => openEditModal(item)}
    >
      <Edit3 className="h-4 w-4 !text-[var(--text-primary)]" />
    </ActionButton>

    {nextStatus && (
      <ActionButton
        label={nextStatusLabel(item.status)}
        onClick={() => updateStatus(item, nextStatus)}
        className="hover:border-cyan-400/30 hover:bg-cyan-400/10"
      >
        <Check className="h-4 w-4 !text-[var(--text-primary)]" />
      </ActionButton>
    )}

    <ActionButton
      label="Delete maintenance"
      onClick={() => setDeleteId(item.id)}
      className="hover:border-red-400/30 hover:bg-red-400/10"
    >
      <Trash2 className="h-4 w-4 !text-[var(--text-primary)]" />
    </ActionButton>
  </div>
</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet */}
            <div className="grid gap-3 p-3 lg:hidden sm:p-4">
              {filteredMaintenance.map((item) => {
                const nextStatus = getNextStatus(item.status);

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-semibold text-cyan-300">
                          {item.maintenanceId}
                        </p>

                        <h3 className="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]">
                          {item.issue}
                        </h3>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium ${getStatusClass(
                          item.status,
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <MobileDetail
                        label="Station"
                        value={`${getStationCode(item.stationId)} — ${getStationName(
                          item.stationId,
                        )}`}
                      />

                      <MobileDetail
                        label="Charger"
                        value={getChargerCode(item.chargerId)}
                      />

                      <MobileDetail
                        label="Reported"
                        value={formatDate(item.reportedDate)}
                      />

                      <MobileDetail
                        label="Priority"
                        value={item.priority || "Medium"}
                      />

                      <MobileDetail
                        label="Scheduled"
                        value={formatDate(item.scheduledDate)}
                      />

                      <MobileDetail
                        label="Technician"
                        value={item.technician || "Not assigned"}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border-primary)] pt-3">
                      <ActionButton
                        label="View maintenance"
                        onClick={() => setViewMaintenance(item)}
                      >
                        <Eye className="h-4 w-4 !text-[var(--text-primary)]" />
                      </ActionButton>

                      <ActionButton
                        label="Edit maintenance"
                        onClick={() => openEditModal(item)}
                      >
                        <Edit3 className="h-4 w-4 !text-[var(--text-primary)]" />
                      </ActionButton>

                      {nextStatus && (
                        <button
                          type="button"
                          onClick={() => updateStatus(item, nextStatus)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/20"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {nextStatusLabel(item.status)}
                        </button>
                      )}

                      <ActionButton
                        label="Delete maintenance"
                        onClick={() => setDeleteId(item.id)}
                        className="hover:border-red-400/30 hover:bg-red-400/10"
                      >
                        <Trash2 className="h-4 w-4 !text-[var(--text-primary)]" />
                      </ActionButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex min-h-0 items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-2rem)]">
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-primary)] px-4 py-4 sm:px-5">
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  {editingMaintenance
                    ? "Edit Maintenance"
                    : "Add Maintenance"}
                </h2>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {editingMaintenance
                    ? `Update ${editingMaintenance.maintenanceId}`
                    : "Create a new charger maintenance record"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="hide-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain"
            >
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5">
                {/* Station */}
                <Field label="Station" required>
                  <select
                    value={form.stationId}
                    onChange={(event) =>
                      updateForm("stationId", event.target.value)
                    }
                    className="input-field"
                  >
                    <option value="">Select station</option>
                    {stations.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.stationId} — {station.name}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* Charger */}
                <Field label="Charger">
                  <select
                    value={form.chargerId}
                    onChange={(event) =>
                      updateForm("chargerId", event.target.value)
                    }
                    className="input-field"
                  >
                    <option value="">Select charger</option>
                    {chargers
                      .filter(
                        (charger) =>
                          !form.stationId ||
                          charger.stationId === form.stationId,
                      )
                      .map((charger) => (
                        <option key={charger.id} value={charger.id}>
                          {charger.chargerId}
                          {charger.type ? ` — ${charger.type}` : ""}
                        </option>
                      ))}
                  </select>
                </Field>

                {/* Issue */}
                <Field label="Issue" required full>
                  <input
                    type="text"
                    value={form.issue}
                    onChange={(event) =>
                      updateForm("issue", event.target.value)
                    }
                    placeholder="e.g. Connector fault"
                    className="input-field"
                  />
                </Field>

                {/* Description */}
                <Field label="Description" full>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    placeholder="Describe the maintenance issue..."
                    rows={3}
                    className="input-field resize-none"
                  />
                </Field>

                {/* Reported date */}
                <Field label="Reported Date" required>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 !text-[var(--text-primary)]" />

                    <input
                      type="date"
                      value={form.reportedDate}
                      onChange={(event) =>
                        updateForm("reportedDate", event.target.value)
                      }
                      className="input-field !pl-10"
                    />
                  </div>
                </Field>

                {/* Scheduled date */}
                <Field label="Scheduled Date">
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 !text-[var(--text-primary)]" />

                    <input
                      type="date"
                      value={form.scheduledDate}
                      onChange={(event) =>
                        updateForm("scheduledDate", event.target.value)
                      }
                      className="input-field !pl-10"
                    />
                  </div>
                </Field>

                {/* Completed date */}
                <Field label="Completed Date">
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 !text-[var(--text-primary)]" />

                    <input
                      type="date"
                      value={form.completedDate}
                      onChange={(event) =>
                        updateForm("completedDate", event.target.value)
                      }
                      className="input-field !pl-10"
                    />
                  </div>
                </Field>

                {/* Status */}
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateForm(
                        "status",
                        event.target.value as MaintenanceStatus,
                      )
                    }
                    className="input-field"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* Priority */}
                <Field label="Priority">
                  <select
                    value={form.priority}
                    onChange={(event) =>
                      updateForm(
                        "priority",
                        event.target.value as MaintenanceForm["priority"],
                      )
                    }
                    className="input-field"
                  >
                    {priorityOptions.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* Technician */}
                <Field label="Technician">
                  <input
                    type="text"
                    value={form.technician}
                    onChange={(event) =>
                      updateForm("technician", event.target.value)
                    }
                    placeholder="Technician name"
                    className="input-field"
                  />
                </Field>

                {/* Notes */}
                <Field label="Notes" full>
                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      updateForm("notes", event.target.value)
                    }
                    placeholder="Additional notes..."
                    rows={3}
                    className="input-field resize-none"
                  />
                </Field>

                {error && (
                  <div className="col-span-full rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[var(--border-primary)] bg-[var(--card-bg)] px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-10 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 text-sm font-semibold text-[#06111F] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {editingMaintenance
                    ? "Save Changes"
                    : "Add Maintenance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewMaintenance && (
        <div className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center overflow-hidden bg-black/70 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex h-full max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-2rem)]">
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-primary)] px-4 py-4 sm:px-5">
              <div>
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-cyan-400" />
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">
                    Maintenance Details
                  </h2>
                </div>

                <p className="mt-1 font-mono text-xs text-cyan-800">
                  {viewMaintenance.maintenanceId}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewMaintenance(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5">
                <DetailItem
                  label="Maintenance ID"
                  value={viewMaintenance.maintenanceId}
                />

                <DetailItem
                  label="Status"
                  value={
                    <span
                      className={`maintenance-status-badge inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusClass(
                        viewMaintenance.status,
                      )}`}
                    >
                      {viewMaintenance.status}
                    </span>
                  }
                />

                <DetailItem
                  label="Station"
                  value={`${getStationCode(
                    viewMaintenance.stationId,
                  )} — ${getStationName(viewMaintenance.stationId)}`}
                />

                <DetailItem
                  label="Charger"
                  value={getChargerCode(viewMaintenance.chargerId)}
                />

                <DetailItem
                  label="Issue"
                  value={viewMaintenance.issue}
                />

                <DetailItem
                  label="Priority"
                  value={
                    <span
                      className={`maintenance-priority-badge inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${getPriorityClass(
                        viewMaintenance.priority,
                      )}`}
                    >
                      {viewMaintenance.priority || "Medium"}
                    </span>
                  }
                />

                <DetailItem
                  label="Reported Date"
                  value={formatDate(viewMaintenance.reportedDate)}
                  icon={<CalendarDays className="h-3.5 w-3.5" />}
                />

                <DetailItem
                  label="Scheduled Date"
                  value={formatDate(viewMaintenance.scheduledDate)}
                  icon={<CalendarDays className="h-3.5 w-3.5" />}
                />

                <DetailItem
                  label="Completed Date"
                  value={formatDate(viewMaintenance.completedDate)}
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                />

                <DetailItem
                  label="Technician"
                  value={viewMaintenance.technician || "Not assigned"}
                />

                <div className="sm:col-span-2">
                  <DetailItem
                    label="Description"
                    value={viewMaintenance.description || "No description"}
                  />
                </div>

                <div className="sm:col-span-2">
                  <DetailItem
                    label="Notes"
                    value={viewMaintenance.notes || "No notes"}
                  />
                </div>
              </div>
            </div>

            <div className="flex shrink-0 justify-end border-t border-[var(--border-primary)] px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={() => setViewMaintenance(null)}
                className="h-10 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-tertiary)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5 shadow-2xl shadow-black/60 sm:p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10">
              <Trash2 className="h-5 w-5 text-red-300" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
              Delete Maintenance Record?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              This action will permanently remove the maintenance record.
              This cannot be undone.
            </p>

            {error && (
              <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setDeleteId(null);
                  setError("");
                }}
                className="h-10 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-500 px-5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .input-field {
          width: 100%;
          min-width: 0;
          height: 42px;
          border-radius: 10px;
          border: 1px solid var(--border-primary);
          background: var(--input-bg);
          padding: 0 14px;
          color: var(--input-text);
          outline: none;
          transition: border-color 150ms ease, background 150ms ease;
        }

        .input-field::placeholder {
          color: var(--text-muted);
        }

        .input-field:focus {
          border-color: rgba(34,211,238,0.55);
          background: var(--input-bg);
        }

        select.input-field {
          color-scheme: inherit;
        }

        input[type="date"].input-field,
        input[type="time"].input-field {
          color-scheme: inherit;
        }

        html.dark input[type="date"].input-field::-webkit-calendar-picker-indicator,
        html.dark input[type="time"].input-field::-webkit-calendar-picker-indicator {
          filter: brightness(0) invert(1) !important;
          opacity: 1 !important;
          cursor: pointer;
        }

        html.light input[type="date"].input-field::-webkit-calendar-picker-indicator,
        html.light input[type="time"].input-field::-webkit-calendar-picker-indicator {
          filter: none !important;
          opacity: 1 !important;
          cursor: pointer;
        }

        html.dark input[type="date"].input-field::-webkit-inner-spin-button,
        html.dark input[type="time"].input-field::-webkit-inner-spin-button {
          filter: brightness(0) invert(1) !important;
        }

        .input-field option {
          background: var(--input-bg);
          color: var(--input-text);
        }



        html.light .maintenance-status-badge {
          color: #334155 !important;
        }

        html.light .maintenance-priority-badge {
          color: #334155 !important;
        }
\n        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
          overscroll-behavior: contain;
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconClass,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {value}
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

function Field({
  label,
  required,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
        {label}
        {required && <span className="ml-1 text-cyan-400">*</span>}
      </label>

      {children}
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
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-medium text-[var(--text-secondary)]">
        {value}
      </p>
    </div>
  );
}