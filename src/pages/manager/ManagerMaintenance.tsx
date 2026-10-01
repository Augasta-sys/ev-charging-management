import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Eye,
  Filter,
  RefreshCw,
  Search,
  Settings,
  Wrench,
  X,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

type MaintenanceStatus =
  | "Reported"
  | "Scheduled"
  | "In Progress"
  | "Completed"
  | "Cancelled";

type MaintenancePriority = "Low" | "Medium" | "High" | "Critical";

interface MaintenanceRecord {
  id: string;
  maintenanceId: string;
  chargerId: string;
  stationId: string;
  issue?: string;
  description?: string;
  issueDescription?: string;
  reportedDate?: string;
  scheduledDate?: string;
  completedDate?: string;
  priority?: MaintenancePriority;
  status: MaintenanceStatus;
  technician?: string;
  technicianName?: string;
  remarks?: string;
  notes?: string;
  cost?: number;
  createdDate?: string;
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
  chargerType?: string;
  connectorType?: string;
  status?: string;
}

const maintenanceStatuses: MaintenanceStatus[] = [
  "Reported",
  "Scheduled",
  "In Progress",
  "Completed",
  "Cancelled",
];

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

function formatAmount(value?: number) {
  if (value === undefined || value === null) {
    return "—";
  }

  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function getStatusClasses(status: MaintenanceStatus) {
  switch (status) {
    case "Reported":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    case "Scheduled":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    case "In Progress":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "Completed":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "Cancelled":
      return "border-slate-400/20 bg-slate-400/10 text-[var(--text-secondary)]";

    default:
      return "border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]";
  }
}

function getPriorityClasses(priority?: MaintenancePriority) {
  switch (priority) {
    case "Critical":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    case "High":
      return "border-orange-400/20 bg-orange-400/10 text-orange-300";

    case "Medium":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "Low":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    default:
      return "border-slate-400/20 bg-slate-400/10 text-[var(--text-secondary)]";
  }
}

function getStatusIcon(status: MaintenanceStatus) {
  switch (status) {
    case "Reported":
      return <AlertTriangle className="h-3.5 w-3.5" />;

    case "Scheduled":
      return <CalendarDays className="h-3.5 w-3.5" />;

    case "In Progress":
      return <Wrench className="h-3.5 w-3.5" />;

    case "Completed":
      return <CheckCircle2 className="h-3.5 w-3.5" />;

    case "Cancelled":
      return <XCircle className="h-3.5 w-3.5" />;

    default:
      return <Settings className="h-3.5 w-3.5" />;
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
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition hover:bg-white hover:text-black"
    >
      {children}
    </button>
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
        className="h-11 w-full appearance-none rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-4 pr-11 text-sm text-[var(--input-text)] outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
        style={{ colorScheme: "light dark" }}
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

      <p className="mt-1 break-words text-xs font-medium text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

export default function ManagerMaintenance() {
  const { user } = useAuth();

  const [maintenance, setMaintenance] = useState<
    MaintenanceRecord[]
  >([]);

  const [station, setStation] = useState<Station | null>(null);
  const [chargers, setChargers] = useState<Charger[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    "All" | MaintenanceStatus
  >("All");

  const [priorityFilter, setPriorityFilter] = useState<
    "All" | MaintenancePriority
  >("All");

  const [viewMaintenance, setViewMaintenance] =
    useState<MaintenanceRecord | null>(null);

  const [savingStatus, setSavingStatus] = useState(false);

  const assignedStationId = user?.assignedStationId || "";

  const fetchMaintenance = async () => {
    if (!assignedStationId) {
      setError("No station is assigned to this manager.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        maintenanceResponse,
        stationsResponse,
        chargersResponse,
      ] = await Promise.all([
        api.get<MaintenanceRecord[]>("/maintenance"),
        api.get<Station[]>("/stations"),
        api.get<Charger[]>("/chargers"),
      ]);

      const allMaintenance = maintenanceResponse.data || [];
      const allStations = stationsResponse.data || [];
      const allChargers = chargersResponse.data || [];

      const assignedStation =
        allStations.find(
          (item) =>
            item.stationId === assignedStationId ||
            item.id === assignedStationId
        ) || null;

      setStation(assignedStation);

      const stationChargers = allChargers.filter(
        (charger) =>
          charger.stationId === assignedStationId ||
          charger.stationId === assignedStation?.id
      );

      setChargers(stationChargers);

      setMaintenance(
        allMaintenance.filter(
          (record) =>
            record.stationId === assignedStationId ||
            record.stationId === assignedStation?.id
        )
      );
    } catch (err) {
      console.error("Failed to load manager maintenance:", err);

      setError(
        "Unable to load maintenance records. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMaintenance();
  }, [assignedStationId]);

  /*
   * Lock background scrolling while the popup is open.
   */
  useEffect(() => {
    if (!viewMaintenance) return;

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
  }, [viewMaintenance]);

  const filteredMaintenance = useMemo(() => {
    const query = search.trim().toLowerCase();

    return maintenance.filter((record) => {
      const charger = chargers.find(
        (item) =>
          item.id === record.chargerId ||
          item.chargerId === record.chargerId
      );

      const searchableText = [
        record.maintenanceId,
        record.chargerId,
        charger?.chargerId || "",
        record.issue || "",
        record.description || "",
        record.issueDescription || "",
        record.technician || "",
        record.technicianName || "",
        record.status,
        record.priority || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        record.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" ||
        record.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [
    maintenance,
    chargers,
    search,
    statusFilter,
    priorityFilter,
  ]);

  const reportedCount = maintenance.filter(
    (record) => record.status === "Reported"
  ).length;

  const scheduledCount = maintenance.filter(
    (record) => record.status === "Scheduled"
  ).length;

  const inProgressCount = maintenance.filter(
    (record) => record.status === "In Progress"
  ).length;

  const completedCount = maintenance.filter(
    (record) => record.status === "Completed"
  ).length;

  const getCharger = (record: MaintenanceRecord) =>
    chargers.find(
      (charger) =>
        charger.id === record.chargerId ||
        charger.chargerId === record.chargerId
    );

  const getIssue = (record: MaintenanceRecord) =>
    record.issue ||
    record.issueDescription ||
    record.description ||
    "No issue description";

  const getTechnician = (
    record: MaintenanceRecord
  ) =>
    record.technicianName ||
    record.technician ||
    "Not assigned";

  const getRemarks = (record: MaintenanceRecord) =>
    record.remarks ||
    record.notes ||
    "No remarks";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setPriorityFilter("All");
  };

  const handleStatusChange = async (
    record: MaintenanceRecord,
    status: MaintenanceStatus
  ) => {
    try {
      setSavingStatus(true);
      setError("");

      const updates: Partial<MaintenanceRecord> = {
        status,
      };

      if (
        status === "Completed" &&
        !record.completedDate
      ) {
        updates.completedDate = new Date()
          .toISOString()
          .split("T")[0];
      }

      await api.patch(
        `/maintenance/${record.id}`,
        updates
      );

      setViewMaintenance(null);

      await fetchMaintenance();
    } catch (err) {
      console.error(
        "Failed to update maintenance status:",
        err
      );

      setError(
        "Unable to update maintenance status."
      );
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-cyan-400" />

          <p className="text-sm text-[var(--text-secondary)]">
            Loading maintenance records...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-[var(--border-primary)] bg-white dark:bg-[var(--card-bg)] p-5 shadow-xl shadow-black/10 sm:p-6">
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
              Maintenance Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Monitor charger maintenance and service
              activities for your assigned station.
            </p>

            {station && (
              <p className="mt-2 text-sm font-medium text-cyan-300">
                {station.name}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => void fetchMaintenance()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white hover:text-black"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />

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

      {/* Statistics */}
      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={<Settings className="h-5 w-5" />}
          label="Total"
          value={maintenance.length}
          description="All maintenance records"
        />

        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Reported"
          value={reportedCount}
          description="Recently reported"
        />

        <StatCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Scheduled"
          value={scheduledCount}
          description="Scheduled service"
        />

        <StatCard
          icon={<Wrench className="h-5 w-5" />}
          label="In Progress"
          value={inProgressCount}
          description="Currently being serviced"
        />

        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Completed"
          value={completedCount}
          description="Maintenance completed"
        />
      </section>

      {/* Search and filters */}
      <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Search & Filters
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Search by maintenance ID, charger,
              issue or technician.
            </p>
          </div>

          {(search ||
            statusFilter !== "All" ||
            priorityFilter !== "All") && (
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

        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--text-primary)]" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search maintenance..."
              className="h-11 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] pl-11 pr-4 text-sm text-[var(--input-text)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
            />
          </div>

          <FilterSelect
            value={statusFilter}
            onChange={(value) =>
              setStatusFilter(
                value as "All" | MaintenanceStatus
              )
            }
            options={["All", ...maintenanceStatuses]}
            placeholder="All Statuses"
          />

          <FilterSelect
            value={priorityFilter}
            onChange={(value) =>
              setPriorityFilter(
                value as
                  | "All"
                  | MaintenancePriority
              )
            }
            options={[
              "All",
              "Low",
              "Medium",
              "High",
              "Critical",
            ]}
            placeholder="All Priorities"
          />
        </div>
      </section>

      {/* Maintenance list */}
      <section className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-lg shadow-black/10">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-primary)] p-5">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Maintenance Records
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Showing {filteredMaintenance.length} of{" "}
              {maintenance.length} records
            </p>
          </div>

          <Filter className="h-5 w-5 shrink-0 text-cyan-400" />
        </div>

        {filteredMaintenance.length === 0 ? (
          <div className="p-6">
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-8 text-center">
              <Wrench className="mx-auto h-8 w-8 text-[var(--text-muted)]" />

              <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
                No maintenance records found
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Try changing your search or filters.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[24%]" />
                  <col className="w-[14%]" />
                  <col className="w-[13%]" />
                  <col className="w-[13%]" />
                  <col className="w-[8%]" />
                </colgroup>

                <thead>
                  <tr className="border-b border-[var(--border-primary)] text-left">
                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Maintenance ID
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Charger
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Issue
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Reported
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Priority
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Status
                    </th>

                    <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border-primary)]">
                  {filteredMaintenance.map((record) => {
                    const charger =
                      getCharger(record);

                    return (
                      <tr
                        key={record.id}
                        className="transition hover:bg-[var(--bg-tertiary)]"
                      >
                        <td className="px-4 py-5">
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                            {record.maintenanceId}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                              <ZapIcon />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                                {charger?.chargerId ||
                                  record.chargerId}
                              </p>

                              <p className="truncate text-xs text-[var(--text-muted)]">
                                {charger?.chargerType ||
                                  "Charger"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-5">
                          <p className="line-clamp-2 text-sm leading-5 text-[var(--text-secondary)]">
                            {getIssue(record)}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 shrink-0 text-[var(--text-primary)]" />

                            <p className="text-sm text-[var(--text-secondary)]">
                              {formatDate(
                                record.reportedDate ||
                                  record.createdDate
                              )}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-5">
                          <span
                            className={`manager-maintenance-priority-badge inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${getPriorityClasses(
                              record.priority
                            )}`}
                          >
                            {record.priority ||
                              "Not Set"}
                          </span>
                        </td>

                        <td className="px-4 py-5">
                          <span
                            className={`manager-maintenance-status-badge inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                              record.status
                            )}`}
                          >
                            {getStatusIcon(
                              record.status
                            )}

                            {record.status}
                          </span>
                        </td>

                        <td className="px-4 py-5">
                          <div className="flex justify-end">
                            <ActionButton
                              label="View Maintenance"
                              onClick={() =>
                                setViewMaintenance(
                                  record
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

            {/* Mobile */}
            <div className="grid gap-3 p-4 md:hidden">
              {filteredMaintenance.map((record) => {
                const charger =
                  getCharger(record);

                return (
                  <div
                    key={record.id}
                    className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                          {record.maintenanceId}
                        </p>

                        <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                          {charger?.chargerId ||
                            record.chargerId}
                        </p>
                      </div>

                      <span
                        className={`manager-maintenance-status-badge inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium ${getStatusClasses(
                          record.status
                        )}`}
                      >
                        {record.status}
                      </span>
                    </div>

                    <p className="mt-4 line-clamp-2 text-sm leading-5 text-[var(--text-secondary)]">
                      {getIssue(record)}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <MobileDetail
                        label="Reported"
                        value={formatDate(
                          record.reportedDate ||
                            record.createdDate
                        )}
                      />

                      <MobileDetail
                        label="Priority"
                        value={
                          record.priority ||
                          "Not Set"
                        }
                      />

                      <MobileDetail
                        label="Technician"
                        value={getTechnician(record)}
                      />

                      <MobileDetail
                        label="Cost"
                        value={formatAmount(
                          record.cost
                        )}
                      />
                    </div>

                    <div className="mt-4 flex justify-end">
                      <ActionButton
                        label="View Maintenance"
                        onClick={() =>
                          setViewMaintenance(record)
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </ActionButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {  <style>{`
        html.light .manager-maintenance-status-badge,
        html.light .manager-maintenance-priority-badge {
          color: #1e293b !important;
        }
      `}</style>

      /* View popup */}
      {viewMaintenance && (
        <div className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center overflow-hidden bg-black/70 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-2rem)]">
            {/* Popup header */}
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-primary)] px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Maintenance Details
                </h2>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {viewMaintenance.maintenanceId}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewMaintenance(null)
                }
                disabled={savingStatus}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Popup content */}
            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
              <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
                <DetailItem
                  label="Maintenance ID"
                  value={
                    viewMaintenance.maintenanceId
                  }
                />

                <DetailItem
                  label="Status"
                  value={viewMaintenance.status}
                />

                <DetailItem
                  label="Station"
                  value={station?.name || "—"}
                />

                <DetailItem
                  label="Station ID"
                  value={
                    station?.stationId || "—"
                  }
                />

                <DetailItem
                  label="Charger"
                  value={
                    getCharger(viewMaintenance)
                      ?.chargerId ||
                    viewMaintenance.chargerId
                  }
                />

                <DetailItem
                  label="Charger Type"
                  value={
                    getCharger(viewMaintenance)
                      ?.chargerType || "—"
                  }
                />

                <DetailItem
                  label="Priority"
                  value={
                    viewMaintenance.priority ||
                    "Not Set"
                  }
                />

                <DetailItem
                  label="Technician"
                  value={getTechnician(
                    viewMaintenance
                  )}
                />

                <DetailItem
                  label="Reported Date"
                  value={formatDate(
                    viewMaintenance.reportedDate ||
                      viewMaintenance.createdDate
                  )}
                />

                <DetailItem
                  label="Scheduled Date"
                  value={formatDate(
                    viewMaintenance.scheduledDate
                  )}
                />

                <DetailItem
                  label="Completed Date"
                  value={formatDate(
                    viewMaintenance.completedDate
                  )}
                />

                <DetailItem
                  label="Maintenance Cost"
                  value={formatAmount(
                    viewMaintenance.cost
                  )}
                />

                <div className="sm:col-span-2">
                  <DetailItem
                    label="Issue"
                    value={getIssue(
                      viewMaintenance
                    )}
                  />
                </div>

                <div className="sm:col-span-2">
                  <DetailItem
                    label="Remarks / Notes"
                    value={getRemarks(
                      viewMaintenance
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Popup actions */}
            <div className="flex shrink-0 flex-col gap-3 border-t border-[var(--border-primary)] bg-[var(--card-bg)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex flex-wrap gap-2">
                {viewMaintenance.status ===
                  "Reported" && (
                  <button
                    type="button"
                    disabled={savingStatus}
                    onClick={() =>
                      void handleStatusChange(
                        viewMaintenance,
                        "Scheduled"
                      )
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-400/20 bg-blue-400/10 px-4 text-xs font-semibold text-blue-300 transition hover:bg-blue-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Mark Scheduled
                  </button>
                )}

                {viewMaintenance.status ===
                  "Scheduled" && (
                  <button
                    type="button"
                    disabled={savingStatus}
                    onClick={() =>
                      void handleStatusChange(
                        viewMaintenance,
                        "In Progress"
                      )
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 text-xs font-semibold text-amber-300 transition hover:bg-amber-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Wrench className="h-4 w-4" />
                    Start Maintenance
                  </button>
                )}

                {viewMaintenance.status ===
                  "In Progress" && (
                  <button
                    type="button"
                    disabled={savingStatus}
                    onClick={() =>
                      void handleStatusChange(
                        viewMaintenance,
                        "Completed"
                      )
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Complete
                  </button>
                )}

                {viewMaintenance.status !==
                  "Completed" &&
                  viewMaintenance.status !==
                    "Cancelled" && (
                    <button
                      type="button"
                      disabled={savingStatus}
                      onClick={() =>
                        void handleStatusChange(
                          viewMaintenance,
                          "Cancelled"
                        )
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 text-xs font-semibold text-red-300 transition hover:bg-red-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel
                    </button>
                  )}
              </div>

              <button
                type="button"
                disabled={savingStatus}
                onClick={() =>
                  setViewMaintenance(null)
                }
                className="h-10 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
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

/*
 * Small local charging icon.
 * Keeping this local avoids adding another imported icon.
 */
function ZapIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
    </svg>
  );
}