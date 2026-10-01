import {
  useEffect,
  useMemo,
  useState,
  type SyntheticEvent,
} from "react";

import {
  Activity,
  Building2,
  CheckCircle2,
  Edit3,
  MapPin,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserX,
  Users,
  X,
  Zap,
} from "lucide-react";

import api from "../../services/api";
import type { Station, StationStatus } from "../../types";

interface Manager {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface StationFormData {
  stationName: string;
  stationCode: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  managerId: string;
  contactNumber: string;
  openingTime: string;
  closingTime: string;
  numberOfChargers: number;
  status: StationStatus;
}

const emptyForm: StationFormData = {
  stationName: "",
  stationCode: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  managerId: "",
  contactNumber: "",
  openingTime: "06:00",
  closingTime: "22:00",
  numberOfChargers: 1,
  status: "Active",
};

function Stations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | StationStatus>(
    "All"
  );
  const [managerFilter, setManagerFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);

  const [formData, setFormData] = useState<StationFormData>(emptyForm);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchStations();
    fetchManagers();
  }, []);

  useEffect(() => {
    if (!showModal) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [showModal]);

  const fetchStations = async () => {
    try {
      setLoading(true);

      const response = await api.get<Station[]>("/stations");

      setStations(response.data);
    } catch (error) {
      console.error("Failed to fetch stations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await api.get<Manager[]>("/users");

      const managerUsers = response.data.filter(
        (user) =>
          user.role.toLowerCase() === "manager" &&
          user.status.toLowerCase() === "active"
      );

      setManagers(managerUsers);
    } catch (error) {
      console.error("Failed to fetch managers:", error);
    }
  };

  const getManagerName = (managerId?: string) => {
    if (!managerId) return "Unassigned";

    const manager = managers.find(
      (item) => item.id === managerId || item.userId === managerId
    );

    return manager?.name ?? "Unassigned";
  };

  const filteredStations = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return stations.filter((station) => {
      const matchesSearch =
        !search ||
        station.stationName.toLowerCase().includes(search) ||
        station.stationCode.toLowerCase().includes(search) ||
        station.stationId.toLowerCase().includes(search) ||
        station.city.toLowerCase().includes(search) ||
        station.state.toLowerCase().includes(search) ||
        station.address.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || station.status === statusFilter;

      const matchesManager =
        managerFilter === "All" || station.managerId === managerFilter;

      return matchesSearch && matchesStatus && matchesManager;
    });
  }, [stations, searchTerm, statusFilter, managerFilter]);

  const totalStations = stations.length;

  const activeStations = stations.filter(
    (station) => station.status === "Active"
  ).length;

  const inactiveStations = stations.filter(
    (station) => station.status === "Inactive"
  ).length;

  const totalChargers = stations.reduce(
    (total, station) => total + Number(station.numberOfChargers || 0),
    0
  );

  const openAddModal = () => {
    setEditingStation(null);
    setFormData(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (station: Station) => {
    setEditingStation(station);

    setFormData({
      stationName: station.stationName,
      stationCode: station.stationCode,
      address: station.address,
      city: station.city,
      state: station.state,
      pincode: station.pincode,
      managerId: station.managerId ?? "",
      contactNumber: station.contactNumber,
      openingTime: station.openingTime,
      closingTime: station.closingTime,
      numberOfChargers: station.numberOfChargers,
      status: station.status,
    });

    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingStation(null);
    setFormData(emptyForm);
    setFormError("");
  };

  const handleInputChange = (
    field: keyof StationFormData,
    value: string | number
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  const generateStationId = () => {
    const highestNumber = stations.reduce((max, station) => {
      const match = station.stationId.match(/ST(\d+)/i);

      if (!match) return max;

      return Math.max(max, Number(match[1]));
    }, 0);

    return `ST${String(highestNumber + 1).padStart(3, "0")}`;
  };

  const validateForm = () => {
    if (!formData.stationName.trim()) {
      return "Station name is required.";
    }

    if (!formData.stationCode.trim()) {
      return "Station code is required.";
    }

    if (!/^[A-Za-z0-9-]+$/.test(formData.stationCode.trim())) {
      return "Station code can contain only letters, numbers and hyphens.";
    }

    if (!formData.address.trim()) {
      return "Address is required.";
    }

    if (!formData.city.trim()) {
      return "City is required.";
    }

    if (!formData.state.trim()) {
      return "State is required.";
    }

    if (!/^\d{6}$/.test(formData.pincode.trim())) {
      return "Pincode must contain exactly 6 digits.";
    }

    if (!/^\d{10}$/.test(formData.contactNumber.trim())) {
      return "Contact number must contain exactly 10 digits.";
    }

    if (formData.numberOfChargers < 1) {
      return "Number of chargers must be at least 1.";
    }

    const duplicateCode = stations.some(
      (station) =>
        station.stationCode.toLowerCase() ===
          formData.stationCode.trim().toLowerCase() &&
        station.id !== editingStation?.id
    );

    if (duplicateCode) {
      return "A station with this station code already exists.";
    }

    return "";
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      if (editingStation) {
        const response = await api.patch<Station>(
          `/stations/${editingStation.id}`,
          {
            ...formData,
            stationName: formData.stationName.trim(),
            stationCode: formData.stationCode.trim().toUpperCase(),
            address: formData.address.trim(),
            city: formData.city.trim(),
            state: formData.state.trim(),
            pincode: formData.pincode.trim(),
            contactNumber: formData.contactNumber.trim(),
          }
        );

        setStations((previous) =>
          previous.map((station) =>
            station.id === editingStation.id ? response.data : station
          )
        );
      } else {
        const stationId = generateStationId();

        const newStation: Omit<Station, "id"> = {
          stationId,
          stationName: formData.stationName.trim(),
          stationCode: formData.stationCode.trim().toUpperCase(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
          managerId: formData.managerId || undefined,
          contactNumber: formData.contactNumber.trim(),
          openingTime: formData.openingTime,
          closingTime: formData.closingTime,
          numberOfChargers: Number(formData.numberOfChargers),
          status: formData.status,
          createdDate: new Date().toISOString().split("T")[0],
        };

        const response = await api.post<Station>("/stations", newStation);

        setStations((previous) => [...previous, response.data]);
      }

      closeModal();
    } catch (error) {
      console.error("Failed to save station:", error);
      setFormError("Unable to save the station. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (station: Station) => {
    const newStatus: StationStatus =
      station.status === "Active" ? "Inactive" : "Active";

    const actionText =
      newStatus === "Active" ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} "${station.stationName}"?`
    );

    if (!confirmed) return;

    try {
      const response = await api.patch<Station>(
        `/stations/${station.id}`,
        {
          status: newStatus,
        }
      );

      setStations((previous) =>
        previous.map((item) =>
          item.id === station.id ? response.data : item
        )
      );
    } catch (error) {
      console.error("Failed to update station status:", error);
      window.alert("Unable to update station status.");
    }
  };

  const handleDelete = async (station: Station) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${station.stationName}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/stations/${station.id}`);

      setStations((previous) =>
        previous.filter((item) => item.id !== station.id)
      );
    } catch (error) {
      console.error("Failed to delete station:", error);
      window.alert("Unable to delete station.");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setManagerFilter("All");
  };

  return (
    <div className="w-full min-w-0 max-w-full">
      {/* Page Header */}
      <div className="flex w-full min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
              <Building2 className="h-5 w-5 text-cyan-300" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
                Charging Stations
              </h1>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Manage charging stations across the network
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-[#07111F] shadow-lg shadow-cyan-400/10 transition hover:bg-cyan-300 sm:w-auto"
        >
          <Plus size={18} />
          Add Station
        </button>
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Stations"
          value={totalStations}
          icon={<Building2 size={20} />}
          iconClass="bg-cyan-400/10 text-cyan-300 border-cyan-400/20"
        />

        <SummaryCard
          title="Active Stations"
          value={activeStations}
          icon={<CheckCircle2 size={20} />}
          iconClass="bg-emerald-400/10 text-emerald-300 border-emerald-400/20"
        />

        <SummaryCard
          title="Inactive Stations"
          value={inactiveStations}
          icon={<Activity size={20} />}
          iconClass="bg-amber-400/10 text-amber-300 border-amber-400/20"
        />

        <SummaryCard
          title="Total Chargers"
          value={totalChargers}
          icon={<Zap size={20} />}
          iconClass="bg-violet-400/10 text-violet-300 border-violet-400/20"
        />
      </div>

      {/* Filters */}
      <div className="mt-6 w-full min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 sm:p-5">
        <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_180px_200px_auto]">
          {/* Search */}
          <div className="relative min-w-0">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search station, code, city..."
              className="h-11 w-full min-w-0 rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-cyan-400/50"
            />
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as "All" | StationStatus
              )
            }
            className="h-11 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-cyan-400/50"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Manager */}
          <select
            value={managerFilter}
            onChange={(event) => setManagerFilter(event.target.value)}
            className="h-11 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-cyan-400/50"
          >
            <option value="All">All Managers</option>

            {managers.map((manager) => (
              <option
                key={manager.id}
                value={manager.id}
              >
                {manager.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={clearFilters}
            className="h-11 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-white/10 hover:text-[var(--text-primary)]"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Station Count */}
      <div className="mt-6 flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Station List
          </h2>

          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Showing {filteredStations.length} of {stations.length} stations
          </p>
        </div>

        <div className="hidden items-center gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-2 text-xs text-[var(--text-secondary)] sm:flex">
          <Users size={14} />
          {managers.length} active managers
        </div>
      </div>

      {/* Station Container */}
      <div className="mt-4 w-full min-w-0 max-w-full rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)]">
        {loading ? (
          <LoadingState />
        ) : filteredStations.length === 0 ? (
          <EmptyState
            searchTerm={searchTerm}
            onAdd={openAddModal}
            onClear={clearFilters}
          />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden w-full min-w-0 md:block">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-primary)] text-left">
                    <th className="w-[21%] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] lg:px-5">
                      Station
                    </th>

                    <th className="w-[16%] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Location
                    </th>

                    <th className="w-[12%] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Manager
                    </th>

                    <th className="w-[10%] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Chargers
                    </th>

                    <th className="w-[11%] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Hours
                    </th>

                    <th className="w-[10%] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Status
                    </th>

                    <th className="w-[20%] px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStations.map((station) => (
                    <StationTableRow
                      key={station.id}
                      station={station}
                      managerName={getManagerName(station.managerId)}
                      onEdit={openEditModal}
                      onToggleStatus={handleToggleStatus}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="grid w-full min-w-0 grid-cols-1 gap-4 p-4 md:hidden">
              {filteredStations.map((station) => (
                <StationMobileCard
                  key={station.id}
                  station={station}
                  managerName={getManagerName(station.managerId)}
                  onEdit={openEditModal}
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <StationFormModal
          editingStation={editingStation}
          formData={formData}
          managers={managers}
          saving={saving}
          error={formError}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Summary Card                                                               */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5 transition hover:border-white/20">
      <div className="flex min-w-0 items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm text-[var(--text-secondary)]">{title}</p>

          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Desktop Row                                                                */
/* -------------------------------------------------------------------------- */

function StationTableRow({
  station,
  managerName,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  station: Station;
  managerName: string;
  onEdit: (station: Station) => void;
  onToggleStatus: (station: Station) => void;
  onDelete: (station: Station) => void;
}) {
  return (
    <tr className="border-b border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--bg-secondary)]">
      {/* Station */}
      <td className="px-4 py-4 lg:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
            <Zap size={17} className="text-cyan-300" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {station.stationName}
            </p>

            <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
              {station.stationCode} · {station.stationId}
            </p>
          </div>
        </div>
      </td>

      {/* Location */}
      <td className="px-4 py-4">
        <div className="flex min-w-0 items-start gap-2">
          <MapPin
            size={15}
            className="mt-0.5 shrink-0 text-[var(--text-muted)]"
          />

          <div className="min-w-0">
            <p className="truncate text-sm text-[var(--text-secondary)]">
              {station.city}
            </p>

            <p className="truncate text-xs text-[var(--text-muted)]">
              {station.state} - {station.pincode}
            </p>
          </div>
        </div>
      </td>

      {/* Manager */}
      <td className="px-4 py-4">
        <p className="truncate text-sm text-[var(--text-secondary)]">
          {managerName}
        </p>
      </td>

      {/* Chargers */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <Zap size={15} className="shrink-0 text-violet-300" />

          <span className="text-sm font-medium text-[var(--text-primary)]">
            {station.numberOfChargers}
          </span>
        </div>
      </td>

      {/* Hours */}
      <td className="px-4 py-4">
        <p className="whitespace-nowrap text-sm text-[var(--text-secondary)]">
          {station.openingTime}
        </p>

        <p className="mt-1 whitespace-nowrap text-xs text-[var(--text-muted)]">
          to {station.closingTime}
        </p>
      </td>

      {/* Status */}
      <td className="px-4 py-4">
        <StatusBadge status={station.status} />
      </td>

      {/* Actions */}
      <td className="px-4 py-4">
        <div className="flex items-center justify-end gap-2">
         <ActionButton
  title="Edit station"
  icon={<Edit3 size={16} />}
  className="border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-cyan-400 hover:text-[var(--text-primary)]"
  onClick={() => onEdit(station)}
/>

<ActionButton
  title={
    station.status === "Active"
      ? "Deactivate station"
      : "Activate station"
  }
  icon={
    station.status === "Active" ? (
      <UserX size={16} />
    ) : (
      <UserCheck size={16} />
    )
  }
  className="border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-amber-400 hover:text-[var(--text-primary)]"
  onClick={() => onToggleStatus(station)}
/>

<ActionButton
  title="Delete station"
  icon={<Trash2 size={16} />}
  className="border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-red-500 hover:text-[var(--text-primary)]"
  onClick={() => onDelete(station)}
/>
        </div>
      </td>
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* Mobile Card                                                                */
/* -------------------------------------------------------------------------- */

function StationMobileCard({
  station,
  managerName,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  station: Station;
  managerName: string;
  onEdit: (station: Station) => void;
  onToggleStatus: (station: Station) => void;
  onDelete: (station: Station) => void;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4">
      {/* Header */}
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
            <Zap size={17} className="text-cyan-300" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {station.stationName}
            </h3>

            <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
              {station.stationCode} · {station.stationId}
            </p>
          </div>
        </div>

        <StatusBadge status={station.status} />
      </div>

      {/* Details */}
      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <DetailItem
          label="Location"
          value={`${station.city}, ${station.state}`}
          icon={<MapPin size={14} />}
        />

        <DetailItem
          label="Manager"
          value={managerName}
          icon={<Users size={14} />}
        />

        <DetailItem
          label="Chargers"
          value={String(station.numberOfChargers)}
          icon={<Zap size={14} />}
        />

        <DetailItem
          label="Operating Hours"
          value={`${station.openingTime} - ${station.closingTime}`}
          icon={<Activity size={14} />}
        />

        <DetailItem
          label="Contact"
          value={station.contactNumber}
          icon={<Activity size={14} />}
        />

        <DetailItem
          label="Pincode"
          value={station.pincode}
          icon={<MapPin size={14} />}
        />
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-end gap-2 border-t border-[var(--border-primary)] pt-4">
        <ActionButton
          title="Edit station"
          icon={<Edit3 size={16} />}
          className="border-cyan-400/20 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400 hover:text-[var(--text-primary)]"
          onClick={() => onEdit(station)}
        />

        <ActionButton
          title={
            station.status === "Active"
              ? "Deactivate station"
              : "Activate station"
          }
          icon={
            station.status === "Active" ? (
              <UserX size={16} />
            ) : (
              <UserCheck size={16} />
            )
          }
          className={
            station.status === "Active"
              ? "border-amber-400/20 bg-amber-400/10 text-amber-300 hover:bg-amber-400 hover:text-[var(--text-primary)]"
              : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400 hover:text-[var(--text-primary)]"
          }
          onClick={() => onToggleStatus(station)}
        />

        <ActionButton
          title="Delete station"
          icon={<Trash2 size={16} />}
          className="border-red-400/20 bg-red-400/10 text-red-300 hover:bg-red-500 hover:text-[var(--text-primary)]"
          onClick={() => onDelete(station)}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Action Button                                                              */
/* -------------------------------------------------------------------------- */

function ActionButton({
  title,
  icon,
  className,
  onClick,
}: {
  title: string;
  icon: React.ReactNode;
  className: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition ${className}`}
    >
      {icon}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Status Badge                                                               */
/* -------------------------------------------------------------------------- */

function StatusBadge({
  status,
}: {
  status: StationStatus;
}) {
  const isActive = status === "Active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${
        isActive
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
          : "border-slate-400/20 bg-slate-400/10 text-[var(--text-secondary)]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-emerald-400" : "bg-slate-500"
        }`}
      />

      {status}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Detail Item                                                                */
/* -------------------------------------------------------------------------- */

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3">
      <div className="flex items-center gap-2 text-[var(--text-muted)]">
        {icon}

        <span className="text-xs">{label}</span>
      </div>

      <p className="mt-1 truncate text-sm font-medium text-slate-200">
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading State                                                               */
/* -------------------------------------------------------------------------- */

function LoadingState() {
  return (
    <div className="flex min-h-[300px] items-center justify-center p-8">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-cyan-400/20 border-t-cyan-400" />

        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          Loading stations...
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty State                                                                 */
/* -------------------------------------------------------------------------- */

function EmptyState({
  searchTerm,
  onAdd,
  onClear,
}: {
  searchTerm: string;
  onAdd: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-[320px] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
          <Building2 size={25} className="text-[var(--text-muted)]" />
        </div>

        <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
          No stations found
        </h3>

        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          {searchTerm
            ? "No stations match your current search or filters."
            : "There are no charging stations available yet."}
        </p>

        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          {searchTerm && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)]"
            >
              Clear Filters
            </button>
          )}

          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-[#07111F] hover:bg-cyan-300"
          >
            <Plus size={17} />
            Add Station
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Station Form Modal                                                          */
/* -------------------------------------------------------------------------- */

function StationFormModal({
  editingStation,
  formData,
  managers,
  saving,
  error,
  onChange,
  onSubmit,
  onClose,
}: {
  editingStation: Station | null;
  formData: StationFormData;
  managers: Manager[];
  saving: boolean;
  error: string;
  onChange: (
    field: keyof StationFormData,
    value: string | number
  ) => void;
  onSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-5">
      <div className="flex max-h-[calc(100vh-24px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-40px)]">
        
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--border-primary)] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-[var(--text-primary)] sm:text-xl">
              {editingStation ? "Edit Station" : "Add New Station"}
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)] sm:text-sm">
              {editingStation
                ? "Update charging station details"
                : "Create a new charging station"}
            </p>
          </div>

          <button
  type="button"
  onClick={onClose}
  disabled={saving}
  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
>
  <X size={18} />
</button>
        </div>

        {/* Form */}
        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-col"
        >
          {/* Form Content */}
          <div className="scrollbar-hidden min-h-0 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
            {error && (
              <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
              {/* Station Name */}
              <FormInput
                label="Station Name"
                value={formData.stationName}
                placeholder="Enter station name"
                required
                onChange={(value) =>
                  onChange("stationName", value)
                }
              />

              {/* Station Code */}
              <FormInput
                label="Station Code"
                value={formData.stationCode}
                placeholder="Example: ANN-NGR"
                required
                onChange={(value) =>
                  onChange("stationCode", value.toUpperCase())
                }
              />

              {/* Address */}
              <div className="sm:col-span-2">
                <FormInput
                  label="Address"
                  value={formData.address}
                  placeholder="Enter complete address"
                  required
                  onChange={(value) =>
                    onChange("address", value)
                  }
                />
              </div>

              {/* City */}
              <FormInput
                label="City"
                value={formData.city}
                placeholder="Enter city"
                required
                onChange={(value) =>
                  onChange("city", value)
                }
              />

              {/* State */}
              <FormInput
                label="State"
                value={formData.state}
                placeholder="Enter state"
                required
                onChange={(value) =>
                  onChange("state", value)
                }
              />

              {/* Pincode */}
              <FormInput
                label="Pincode"
                value={formData.pincode}
                placeholder="6 digit pincode"
                required
                maxLength={6}
                inputMode="numeric"
                onChange={(value) =>
                  onChange(
                    "pincode",
                    value.replace(/\D/g, "").slice(0, 6)
                  )
                }
              />

              {/* Contact */}
              <FormInput
                label="Contact Number"
                value={formData.contactNumber}
                placeholder="10 digit mobile number"
                required
                maxLength={10}
                inputMode="numeric"
                onChange={(value) =>
                  onChange(
                    "contactNumber",
                    value.replace(/\D/g, "").slice(0, 10)
                  )
                }
              />

              {/* Manager */}
              <div className="min-w-0">
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                  Station Manager
                </label>

                <select
                  value={formData.managerId}
                  onChange={(event) =>
                    onChange(
                      "managerId",
                      event.target.value
                    )
                  }
                  className="h-10 w-full min-w-0 rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-cyan-400/50"
                >
                  <option value="">Unassigned</option>

                  {managers.map((manager) => (
                    <option
                      key={manager.id}
                      value={manager.id}
                    >
                      {manager.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chargers */}
              <div className="min-w-0">
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                  Number of Chargers
                </label>

                <input
                  type="number"
                  min={1}
                  value={formData.numberOfChargers}
                  onChange={(event) =>
                    onChange(
                      "numberOfChargers",
                      Math.max(
                        1,
                        Number(event.target.value)
                      )
                    )
                  }
                  className="h-10 w-full min-w-0 rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-cyan-400/50"
                />
              </div>

              {/* Opening Time */}
              <div className="min-w-0">
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                  Opening Time
                </label>

              <input
  type="time"
  value={formData.openingTime}
  onChange={(event) =>
    onChange("openingTime", event.target.value)
  }
  className="h-10 w-full min-w-0 rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-cyan-400/50"
/>
              </div>

              {/* Closing Time */}
              <div className="min-w-0">
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                  Closing Time
                </label>

               <input
  type="time"
  value={formData.closingTime}
  onChange={(event) =>
    onChange("closingTime", event.target.value)
  }
  className="h-10 w-full min-w-0 rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-cyan-400/50"
/>
              </div>

              {/* Status */}
              <div className="min-w-0">
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                  Status
                </label>

               <select
  value={formData.status}
  onChange={(event) =>
    onChange(
      "status",
      event.target.value as StationStatus
    )
  }
  className="h-10 w-full min-w-0 rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-cyan-400/50"
>
  <option value="Active">Active</option>
  <option value="Inactive">Inactive</option>
</select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-[var(--border-primary)] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-10 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-white/10 hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 text-sm font-semibold text-[#07111F] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#07111F]/20 border-t-[#07111F]" />
              )}

              {editingStation
                ? "Save Changes"
                : "Create Station"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Form Input                                                                  */
/* -------------------------------------------------------------------------- */

function FormInput({
  label,
  value,
  placeholder,
  required = false,
  maxLength,
  inputMode,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  required?: boolean;
  maxLength?: number;
  inputMode?: "text" | "numeric" | "tel" | "email";
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
        {label}

        {required && (
          <span className="ml-1 text-cyan-400">*</span>
        )}
      </label>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full min-w-0 rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-cyan-400/50"
      />
    </div>
  );
}

export default Stations;