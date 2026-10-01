import { useEffect, useMemo, useState } from "react";
import {
  Battery,
  Car,
  CheckCircle2,
  Edit3,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

type VehicleType =
  | "Car"
  | "Bike"
  | "Scooter"
  | "Commercial Vehicle";

type ConnectorType =
  | "Type 1"
  | "Type 2"
  | "CCS"
  | "CHAdeMO";

interface Vehicle {
  id: string;
  vehicleId: string;
  customerId: string;
  userId?: string;
  vehicleNumber: string;
  brand: string;
  model: string;
  batteryCapacity: number;
  vehicleType: VehicleType;
  connectorType: ConnectorType;
  isDefault?: boolean;
  createdDate?: string;
}

interface VehicleForm {
  vehicleNumber: string;
  brand: string;
  model: string;
  batteryCapacity: string;
  vehicleType: VehicleType;
  connectorType: ConnectorType;
  isDefault: boolean;
}

const emptyForm: VehicleForm = {
  vehicleNumber: "",
  brand: "",
  model: "",
  batteryCapacity: "",
  vehicleType: "Car",
  connectorType: "Type 2",
  isDefault: false,
};

function createVehicleId(vehicles: Vehicle[]) {
  const highestNumber = vehicles.reduce((highest, vehicle) => {
    const match = vehicle.vehicleId?.match(/\d+/);

    if (!match) return highest;

    return Math.max(highest, Number(match[0]));
  }, 0);

  return `VH${String(highestNumber + 1).padStart(3, "0")}`;
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
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition hover:bg-white hover:text-black"
    >
      {children}
    </button>
  );
}

export default function CustomerVehicles() {
  const { user } = useAuth();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [showFormModal, setShowFormModal] =
    useState(false);

  const [viewVehicle, setViewVehicle] =
    useState<Vehicle | null>(null);

  const [deleteVehicle, setDeleteVehicle] =
    useState<Vehicle | null>(null);

  const [editingVehicle, setEditingVehicle] =
    useState<Vehicle | null>(null);

  const [form, setForm] =
    useState<VehicleForm>(emptyForm);

  const customerId = user?.id || "";

  const fetchVehicles = async () => {
    if (!customerId) {
      setError(
        "Unable to identify the logged-in customer."
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await api.get<Vehicle[]>("/vehicles");

      const allVehicles = response.data || [];

      const ownVehicles = allVehicles.filter(
        (vehicle) =>
          vehicle.customerId === customerId ||
          vehicle.userId === customerId
      );

      setVehicles(ownVehicles);
    } catch (err) {
      console.error("Failed to load vehicles:", err);

      setError(
        "Unable to load your vehicles. Please check JSON Server and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchVehicles();
  }, [customerId]);

  const popupOpen = Boolean(
    showFormModal || viewVehicle || deleteVehicle
  );

  /*
   * Lock the page whenever any vehicle popup is open.
   */
  useEffect(() => {
    if (!popupOpen) return;

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
  }, [popupOpen]);

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return vehicles;

    return vehicles.filter((vehicle) => {
      const searchableText = [
        vehicle.vehicleId,
        vehicle.vehicleNumber,
        vehicle.brand,
        vehicle.model,
        vehicle.vehicleType,
        vehicle.connectorType,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [vehicles, search]);

  const defaultVehicle = vehicles.find(
    (vehicle) => vehicle.isDefault
  );

  const openAddModal = () => {
    setEditingVehicle(null);
    setForm(emptyForm);
    setError("");
    setShowFormModal(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);

    setForm({
      vehicleNumber: vehicle.vehicleNumber || "",
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      batteryCapacity: String(
        vehicle.batteryCapacity || ""
      ),
      vehicleType: vehicle.vehicleType || "Car",
      connectorType:
        vehicle.connectorType || "Type 2",
      isDefault: Boolean(vehicle.isDefault),
    });

    setError("");
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (saving) return;

    setShowFormModal(false);
    setEditingVehicle(null);
    setForm(emptyForm);
  };

  const validateForm = () => {
    if (!form.vehicleNumber.trim()) {
      return "Vehicle number is required.";
    }

    if (!form.brand.trim()) {
      return "Vehicle brand is required.";
    }

    if (!form.model.trim()) {
      return "Vehicle model is required.";
    }

    const battery = Number(form.batteryCapacity);

    if (
      !form.batteryCapacity ||
      Number.isNaN(battery) ||
      battery <= 0
    ) {
      return "Enter a valid battery capacity.";
    }

    const duplicate = vehicles.some(
      (vehicle) =>
        vehicle.id !== editingVehicle?.id &&
        vehicle.vehicleNumber
          .trim()
          .toLowerCase() ===
          form.vehicleNumber.trim().toLowerCase()
    );

    if (duplicate) {
      return "This vehicle number is already added.";
    }

    return "";
  };

  const removeOtherDefaults = async (
    currentVehicleId?: string
  ) => {
    const otherDefaults = vehicles.filter(
      (vehicle) =>
        vehicle.isDefault &&
        vehicle.id !== currentVehicleId
    );

    await Promise.all(
      otherDefaults.map((vehicle) =>
        api.patch(`/vehicles/${vehicle.id}`, {
          isDefault: false,
        })
      )
    );
  };

  const handleSubmit = async (
    event: React.SyntheticEvent<HTMLFormElement>
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

      if (form.isDefault) {
        await removeOtherDefaults(
          editingVehicle?.id
        );
      }

      if (editingVehicle) {
        await api.patch(
          `/vehicles/${editingVehicle.id}`,
          {
            vehicleNumber:
              form.vehicleNumber
                .trim()
                .toUpperCase(),
            brand: form.brand.trim(),
            model: form.model.trim(),
            batteryCapacity: Number(
              form.batteryCapacity
            ),
            vehicleType: form.vehicleType,
            connectorType: form.connectorType,
            isDefault: form.isDefault,
          }
        );

        setSuccess(
          "Vehicle updated successfully."
        );
      } else {
        /*
         * Read all vehicles before generating the ID
         * so another customer's IDs are also considered.
         */
        const allVehiclesResponse =
          await api.get<Vehicle[]>("/vehicles");

        const allVehicles =
          allVehiclesResponse.data || [];

        const vehicleId =
          createVehicleId(allVehicles);

        /*
         * First vehicle automatically becomes default.
         */
        const shouldBeDefault =
          vehicles.length === 0 ||
          form.isDefault;

        if (shouldBeDefault) {
          await removeOtherDefaults();
        }

        await api.post("/vehicles", {
          id: vehicleId,
          vehicleId,
          customerId,
          userId: customerId,
          vehicleNumber:
            form.vehicleNumber
              .trim()
              .toUpperCase(),
          brand: form.brand.trim(),
          model: form.model.trim(),
          batteryCapacity: Number(
            form.batteryCapacity
          ),
          vehicleType: form.vehicleType,
          connectorType: form.connectorType,
          isDefault: shouldBeDefault,
          createdDate: new Date().toISOString(),
        });

        setSuccess(
          "Vehicle added successfully."
        );
      }

      setShowFormModal(false);
      setEditingVehicle(null);
      setForm(emptyForm);

      await fetchVehicles();
    } catch (err) {
      console.error("Failed to save vehicle:", err);

      setError(
        "Unable to save the vehicle. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (
    vehicle: Vehicle
  ) => {
    if (vehicle.isDefault) return;

    try {
      setError("");
      setSuccess("");

      await removeOtherDefaults(vehicle.id);

      await api.patch(`/vehicles/${vehicle.id}`, {
        isDefault: true,
      });

      setSuccess(
        `${vehicle.vehicleNumber} is now your default vehicle.`
      );

      await fetchVehicles();
    } catch (err) {
      console.error(
        "Failed to set default vehicle:",
        err
      );

      setError(
        "Unable to set the default vehicle."
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteVehicle) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const deletedWasDefault =
        Boolean(deleteVehicle.isDefault);

      await api.delete(
        `/vehicles/${deleteVehicle.id}`
      );

      /*
       * If the deleted vehicle was the default,
       * automatically make another vehicle default.
       */
      if (deletedWasDefault) {
        const remainingVehicles =
          vehicles.filter(
            (vehicle) =>
              vehicle.id !== deleteVehicle.id
          );

        if (remainingVehicles.length > 0) {
          await api.patch(
            `/vehicles/${remainingVehicles[0].id}`,
            {
              isDefault: true,
            }
          );
        }
      }

      setSuccess(
        "Vehicle deleted successfully."
      );

      setDeleteVehicle(null);

      await fetchVehicles();
    } catch (err) {
      console.error(
        "Failed to delete vehicle:",
        err
      );

      setError(
        "Unable to delete the vehicle. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-cyan-400" />

          <p className="text-sm text-[var(--text-secondary)]">
            Loading your vehicles...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6">\n      <style>{`\n        .customer-vehicles-input {\n          border-color: var(--border-primary);\n          background: var(--input-bg);\n          color: var(--input-text);\n        }\n        .customer-vehicles-input::placeholder {\n          color: var(--text-muted);\n          opacity: 1;\n        }\n        .customer-vehicles-input option {\n          background: var(--input-bg);\n          color: var(--input-text);\n        }\n        html.dark .customer-vehicles-input { color-scheme: dark; }\n        html.light .customer-vehicles-input { color-scheme: light; }\n        .customer-vehicles-banner {\n          background: #ffffff;\n        }\n        html.dark .customer-vehicles-banner {\n          background: linear-gradient(135deg, #0D1B2A, #0B1726, #111A35);\n        }\n      `}</style>\n
      {/* Header */}
      <section className="rounded-2xl border border-[var(--border-primary)] customer-vehicles-banner p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
              Customer Vehicles
            </span>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              My Vehicles
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Manage the EVs you use for charging
              reservations.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void fetchVehicles()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white hover:text-black"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 text-sm font-semibold text-[#07111F] transition hover:bg-cyan-300"
            >
              <Plus className="h-4 w-4" />
              Add Vehicle
            </button>
          </div>
        </div>
      </section>

      {/* Success */}
      {success && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
          <div className="flex min-w-0 items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />

            <p className="text-sm font-medium text-emerald-200">
              {success}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="shrink-0 text-emerald-300 transition hover:text-[var(--text-primary)]"
            aria-label="Close success message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error */}
      {error && !showFormModal && (
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
            className="shrink-0 text-red-300 transition hover:text-[var(--text-primary)]"
            aria-label="Close error message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Summary */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                Total Vehicles
              </p>

              <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
                {vehicles.length}
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Vehicles added to your account
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
              <Car className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                Default Vehicle
              </p>

              <p className="mt-2 truncate text-xl font-bold text-[var(--text-primary)]">
                {defaultVehicle?.vehicleNumber || "Not Set"}
              </p>

              <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                {defaultVehicle
                  ? `${defaultVehicle.brand} ${defaultVehicle.model}`
                  : "Choose a default vehicle"}
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
              <Star className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5 sm:col-span-2 xl:col-span-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                Connector Types
              </p>

              <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
                {
                  new Set(
                    vehicles.map(
                      (vehicle) =>
                        vehicle.connectorType
                    )
                  ).size
                }
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Charging connectors in your vehicles
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
              <Zap className="h-5 w-5" />
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-primary)]" />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search vehicle number, brand, model, type or connector..."
            className="h-11 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--card-bg)] pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
          />
        </div>
      </section>

      {/* Vehicles */}
      <section className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-primary)] p-5">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Vehicle List
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {filteredVehicles.length} vehicle
              {filteredVehicles.length === 1 ? "" : "s"}{" "}
              found
            </p>
          </div>

          <Car className="h-5 w-5 text-cyan-400" />
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="p-6">
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-8 text-center">
              <Car className="mx-auto h-9 w-9 text-[var(--text-muted)]" />

              <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
                {vehicles.length === 0
                  ? "No vehicles added"
                  : "No matching vehicles"}
              </p>

              <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                {vehicles.length === 0
                  ? "Add your EV before creating a charging booking."
                  : "Try changing your search."}
              </p>

              {vehicles.length === 0 && (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 text-sm font-semibold text-[#07111F] transition hover:bg-cyan-300"
                >
                  <Plus className="h-4 w-4" />
                  Add Vehicle
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[13%]" />
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                  <col className="w-[13%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[10%]" />
                </colgroup>

                <thead>
                  <tr className="border-b border-[var(--border-primary)]">
                    <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      ID
                    </th>

                    <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Vehicle
                    </th>

                    <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Brand / Model
                    </th>

                    <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Type
                    </th>

                    <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Battery
                    </th>

                    <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Connector
                    </th>

                    <th className="px-3 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {filteredVehicles.map(
                    (vehicle) => (
                      <tr
                        key={vehicle.id}
                        className="transition hover:bg-[var(--bg-tertiary)]"
                      >
                        <td className="px-3 py-5">
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                            {vehicle.vehicleId}
                          </p>
                        </td>

                        <td className="px-3 py-5">
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                              {vehicle.vehicleNumber}
                            </p>

                            {vehicle.isDefault && (
                              <Star
                                className="h-4 w-4 shrink-0 text-amber-300"
                                fill="currentColor"
                              />
                            )}
                          </div>

                          {vehicle.isDefault && (
                            <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-amber-300">
                              Default
                            </p>
                          )}
                        </td>

                        <td className="px-3 py-5">
                          <p className="truncate text-sm text-[var(--text-secondary)]">
                            {vehicle.brand}
                          </p>

                          <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                            {vehicle.model}
                          </p>
                        </td>

                        <td className="px-3 py-5 text-sm text-[var(--text-secondary)]">
                          {vehicle.vehicleType}
                        </td>

                        <td className="px-3 py-5 text-sm text-[var(--text-secondary)]">
                          {vehicle.batteryCapacity} kWh
                        </td>

                        <td className="px-3 py-5">
                          <span className="inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-2 py-1 text-[10px] font-medium text-violet-300">
                            {vehicle.connectorType}
                          </span>
                        </td>

                        <td className="px-3 py-5">
                          <div className="flex justify-end gap-1.5">
                            {!vehicle.isDefault && (
                              <ActionButton
                                label="Set Default"
                                onClick={() =>
                                  void handleSetDefault(
                                    vehicle
                                  )
                                }
                              >
                                <Star className="h-4 w-4" />
                              </ActionButton>
                            )}

                            <ActionButton
                              label="View"
                              onClick={() =>
                                setViewVehicle(vehicle)
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </ActionButton>

                            <ActionButton
                              label="Edit"
                              onClick={() =>
                                openEditModal(vehicle)
                              }
                            >
                              <Edit3 className="h-4 w-4" />
                            </ActionButton>

                            <ActionButton
                              label="Delete"
                              onClick={() =>
                                setDeleteVehicle(vehicle)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </ActionButton>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="grid gap-3 p-4 md:hidden">
              {filteredVehicles.map(
                (vehicle) => (
                  <div
                    key={vehicle.id}
                    className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                            {vehicle.vehicleNumber}
                          </p>

                          {vehicle.isDefault && (
                            <Star
                              className="h-4 w-4 shrink-0 text-amber-300"
                              fill="currentColor"
                            />
                          )}
                        </div>

                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {vehicle.vehicleId}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full border border-violet-400/20 bg-violet-400/10 px-2 py-1 text-[10px] font-medium text-violet-300">
                        {vehicle.connectorType}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <DetailItem
                        label="Brand"
                        value={vehicle.brand}
                      />

                      <DetailItem
                        label="Model"
                        value={vehicle.model}
                      />

                      <DetailItem
                        label="Vehicle Type"
                        value={vehicle.vehicleType}
                      />

                      <DetailItem
                        label="Battery"
                        value={`${vehicle.batteryCapacity} kWh`}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      {!vehicle.isDefault && (
                        <button
                          type="button"
                          onClick={() =>
                            void handleSetDefault(
                              vehicle
                            )
                          }
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 text-xs font-medium text-amber-300"
                        >
                          <Star className="h-3.5 w-3.5" />
                          Default
                        </button>
                      )}

                      <ActionButton
                        label="View"
                        onClick={() =>
                          setViewVehicle(vehicle)
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </ActionButton>

                      <ActionButton
                        label="Edit"
                        onClick={() =>
                          openEditModal(vehicle)
                        }
                      >
                        <Edit3 className="h-4 w-4" />
                      </ActionButton>

                      <ActionButton
                        label="Delete"
                        onClick={() =>
                          setDeleteVehicle(vehicle)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </ActionButton>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </section>

      {/* Add / Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center overflow-hidden bg-black/70 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-2rem)]">
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--border-primary)] px-4 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {editingVehicle
                    ? "Edit Vehicle"
                    : "Add Vehicle"}
                </h2>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {editingVehicle
                    ? editingVehicle.vehicleId
                    : "Add an EV to your account"}
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={closeFormModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition hover:bg-white hover:text-black disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                {error && (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />

                    <p className="text-sm text-red-200">
                      {error}
                    </p>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
                      Vehicle Number *
                    </span>

                    <input
                      type="text"
                      value={form.vehicleNumber}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          vehicleNumber:
                            event.target.value,
                        }))
                      }
                      placeholder="TN01AB1234"
                      className="h-11 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-4 text-sm uppercase text-[var(--text-primary)] outline-none placeholder:normal-case placeholder:text-[var(--text-muted)] focus:border-cyan-400/50 customer-vehicles-input"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
                      Brand *
                    </span>

                    <input
                      type="text"
                      value={form.brand}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          brand: event.target.value,
                        }))
                      }
                      placeholder="Tata"
                      className="h-11 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-cyan-400/50 customer-vehicles-input"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
                      Model *
                    </span>

                    <input
                      type="text"
                      value={form.model}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          model: event.target.value,
                        }))
                      }
                      placeholder="Nexon EV"
                      className="h-11 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-cyan-400/50 customer-vehicles-input"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
                      Battery Capacity (kWh) *
                    </span>

                    <div className="relative">
                      <Battery className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-primary)]" />

                      <input
                        type="number"
                        min="1"
                        step="0.1"
                        value={form.batteryCapacity}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            batteryCapacity:
                              event.target.value,
                          }))
                        }
                        placeholder="40.5"
                        className="h-11 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-cyan-400/50 customer-vehicles-input"
                      />
                    </div>
                  </label>

                  <label>
                    <span className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
                      Vehicle Type *
                    </span>

                    <select
                      value={form.vehicleType}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          vehicleType:
                            event.target
                              .value as VehicleType,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-cyan-400/50 customer-vehicles-input"
                    >
                      <option value="Car">Car</option>
                      <option value="Bike">Bike</option>
                      <option value="Scooter">
                        Scooter
                      </option>
                      <option value="Commercial Vehicle">
                        Commercial Vehicle
                      </option>
                    </select>
                  </label>

                  <label>
                    <span className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
                      Connector Type *
                    </span>

                    <select
                      value={form.connectorType}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          connectorType:
                            event.target
                              .value as ConnectorType,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-cyan-400/50 customer-vehicles-input"
                    >
                      <option value="Type 1">
                        Type 1
                      </option>
                      <option value="Type 2">
                        Type 2
                      </option>
                      <option value="CCS">CCS</option>
                      <option value="CHAdeMO">
                        CHAdeMO
                      </option>
                    </select>
                  </label>

                  <div className="flex items-end">
                    <label className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-4">
                      <input
                        type="checkbox"
                        checked={form.isDefault}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            isDefault:
                              event.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-cyan-400"
                      />

                      <span className="text-sm text-[var(--text-primary)]">
                        Set as default vehicle
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-[var(--border-primary)] px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  disabled={saving}
                  onClick={closeFormModal}
                  className="h-10 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white hover:text-black disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 text-sm font-semibold text-[#07111F] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingVehicle ? (
                    <>
                      <Edit3 className="h-4 w-4" />
                      Update Vehicle
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Vehicle
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewVehicle && (
        <div className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center overflow-hidden bg-black/70 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border-primary)] px-4 py-4 sm:px-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    Vehicle Details
                  </h2>

                  {viewVehicle.isDefault && (
                    <Star
                      className="h-4 w-4 text-amber-300"
                      fill="currentColor"
                    />
                  )}
                </div>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {viewVehicle.vehicleId}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewVehicle(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition hover:bg-white hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailItem
                  label="Vehicle Number"
                  value={viewVehicle.vehicleNumber}
                />

                <DetailItem
                  label="Vehicle ID"
                  value={viewVehicle.vehicleId}
                />

                <DetailItem
                  label="Brand"
                  value={viewVehicle.brand}
                />

                <DetailItem
                  label="Model"
                  value={viewVehicle.model}
                />

                <DetailItem
                  label="Vehicle Type"
                  value={viewVehicle.vehicleType}
                />

                <DetailItem
                  label="Battery Capacity"
                  value={`${viewVehicle.batteryCapacity} kWh`}
                />

                <DetailItem
                  label="Connector Type"
                  value={viewVehicle.connectorType}
                />

                <DetailItem
                  label="Default Vehicle"
                  value={
                    viewVehicle.isDefault
                      ? "Yes"
                      : "No"
                  }
                />

                <DetailItem
                  label="Added Date"
                  value={formatDate(
                    viewVehicle.createdDate
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-primary)] px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={() =>
                  setViewVehicle(null)
                }
                className="h-10 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white hover:text-black"
              >
                Close
              </button>

              {!viewVehicle.isDefault && (
                <button
                  type="button"
                  onClick={() => {
                    const vehicle =
                      viewVehicle;

                    setViewVehicle(null);

                    void handleSetDefault(
                      vehicle
                    );
                  }}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-5 text-sm font-semibold text-amber-300 transition hover:bg-amber-400 hover:text-black"
                >
                  <Star className="h-4 w-4" />
                  Set Default
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteVehicle && (
        <div className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center overflow-hidden bg-black/70 p-3 backdrop-blur-sm sm:p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-2xl shadow-black/60">
            <div className="p-5 sm:p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10 text-red-300">
                <Trash2 className="h-5 w-5" />
              </div>

              <h2 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
                Delete Vehicle?
              </h2>

              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-[var(--text-primary)]">
                  {deleteVehicle.vehicleNumber}
                </span>
                ? This action cannot be undone.
              </p>

              {deleteVehicle.isDefault && (
                <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-200">
                  This is your default vehicle. Another
                  vehicle will automatically become the
                  default if one is available.
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-primary)] px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setDeleteVehicle(null)
                }
                className="h-10 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white hover:text-black disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void handleDelete()
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-5 text-sm font-semibold text-red-300 transition hover:bg-red-400 hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}

                {saving
                  ? "Deleting..."
                  : "Delete Vehicle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}