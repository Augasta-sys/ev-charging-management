import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarCheck,
  Car,
  CheckCircle2,
  Edit3,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

interface CustomerRecord {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  createdAt?: string;
}

interface Vehicle {
  id: string;
  vehicleId?: string;
  customerId?: string;
  userId?: string;
  vehicleNumber?: string;
  brand?: string;
  model?: string;
  vehicleType?: string;
  connectorType?: string;
  isDefault?: boolean;
}

interface Booking {
  id: string;
  bookingId?: string;
  customerId?: string;
  userId?: string;
  status?: string;
}

interface ChargingSession {
  id: string;
  sessionId?: string;
  bookingId?: string;
  customerId?: string;
  userId?: string;
  status?: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

const emptyForm: FormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10">
          <Icon className="h-4 w-4 text-cyan-300" />
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-medium text-[var(--text-primary)]">
            {value || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CustomerProfile() {
  const { user } = useAuth();

  const customerId = user?.id || "";

  const [customer, setCustomer] =
    useState<CustomerRecord | null>(null);

  const [vehicles, setVehicles] =
    useState<Vehicle[]>([]);

  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [sessions, setSessions] =
    useState<ChargingSession[]>([]);

  const [form, setForm] =
    useState<FormData>(emptyForm);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* ========================================
     FETCH DATA
  ======================================== */

  const fetchData = async () => {
    if (!customerId) {
      setLoading(false);

      setError(
        "Unable to identify the logged-in customer."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        usersResponse,
        vehiclesResponse,
        bookingsResponse,
        sessionsResponse,
      ] = await Promise.all([
        api.get<CustomerRecord[]>("/users"),
        api.get<Vehicle[]>("/vehicles"),
        api.get<Booking[]>("/bookings"),
        api.get<ChargingSession[]>(
          "/chargingSessions"
        ),
      ]);

      const foundCustomer =
        usersResponse.data.find(
          (item) => item.id === customerId
        );

      if (!foundCustomer) {
        setCustomer(null);

        setError(
          "Customer account could not be found."
        );

        return;
      }

      setCustomer(foundCustomer);

      setForm({
        name: foundCustomer.name || "",
        email: foundCustomer.email || "",
        phone: foundCustomer.phone || "",
        address: foundCustomer.address || "",
        city: foundCustomer.city || "",
        state: foundCustomer.state || "",
        pincode: foundCustomer.pincode || "",
      });

      const customerVehicles =
        vehiclesResponse.data.filter(
          (vehicle) =>
            vehicle.customerId === customerId ||
            vehicle.userId === customerId
        );

      const customerBookings =
        bookingsResponse.data.filter(
          (booking) =>
            booking.customerId === customerId ||
            booking.userId === customerId
        );

      const bookingIds =
        customerBookings
          .flatMap((booking) => [
            booking.id,
            booking.bookingId,
          ])
          .filter(
            (value): value is string =>
              Boolean(value)
          );

      const customerSessions =
        sessionsResponse.data.filter(
          (session) =>
            session.customerId === customerId ||
            session.userId === customerId ||
            (Boolean(session.bookingId) &&
              bookingIds.includes(
                session.bookingId as string
              ))
        );

      setVehicles(customerVehicles);
      setBookings(customerBookings);
      setSessions(customerSessions);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load your profile. Please make sure JSON Server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [customerId]);

  /* ========================================
     STATS
  ======================================== */

  const activeBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status === "Pending" ||
          booking.status === "Confirmed" ||
          booking.status === "Checked In" ||
          booking.status === "Charging"
      ).length,
    [bookings]
  );

  const completedSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          session.status === "Completed"
      ).length,
    [sessions]
  );

  const defaultVehicle = useMemo(
    () =>
      vehicles.find(
        (vehicle) => vehicle.isDefault
      ) || vehicles[0],
    [vehicles]
  );

  /* ========================================
     FORM
  ======================================== */

  const handleChange = (
    field: keyof FormData,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Name is required.";
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(form.email.trim())) {
      return "Enter a valid email address.";
    }

    if (form.phone.trim()) {
      const phoneRegex = /^[0-9]{10}$/;

      if (
        !phoneRegex.test(
          form.phone.trim()
        )
      ) {
        return "Phone number must contain 10 digits.";
      }
    }

    if (form.pincode.trim()) {
      const pincodeRegex = /^[0-9]{6}$/;

      if (
        !pincodeRegex.test(
          form.pincode.trim()
        )
      ) {
        return "Pincode must contain 6 digits.";
      }
    }

    return "";
  };

  const handleSave = async () => {
    if (!customer) return;

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name.trim(),
        email: form.email
          .trim()
          .toLowerCase(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
      };

      const response =
        await api.patch<CustomerRecord>(
          `/users/${customer.id}`,
          payload
        );

      setCustomer(response.data);

      setForm({
        name: response.data.name || "",
        email: response.data.email || "",
        phone: response.data.phone || "",
        address:
          response.data.address || "",
        city: response.data.city || "",
        state: response.data.state || "",
        pincode:
          response.data.pincode || "",
      });

      /*
       * Keep the locally persisted logged-in
       * user in sync with the edited profile.
       */
      const storedUser =
        localStorage.getItem("ev_user");

      if (storedUser) {
        try {
          const parsedUser =
            JSON.parse(storedUser);

          localStorage.setItem(
            "ev_user",
            JSON.stringify({
              ...parsedUser,
              ...payload,
            })
          );
        } catch (storageError) {
          console.error(storageError);
        }
      }

      setEditing(false);

      setSuccess(
        "Profile updated successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to update your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!customer) return;

    setForm({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      pincode: customer.pincode || "",
    });

    setEditing(false);
    setError("");
    setSuccess("");
  };

  /* ========================================
     LOADING
  ======================================== */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-cyan-400" />

          <p className="text-sm text-[var(--text-secondary)]">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-6">
        <p className="font-medium text-red-200">
          {error ||
            "Customer profile could not be loaded."}
        </p>
      </div>
    );
  }

  /* ========================================
     UI
  ======================================== */

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* HEADER */}

      <section className="customer-profile-banner rounded-2xl border border-[var(--border-primary)] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
              <UserRound className="h-8 w-8 text-cyan-300" />
            </div>

            <div className="min-w-0">
              <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
                Customer Profile
              </span>

              <h1 className="mt-2 truncate text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
                {customer.name ||
                  "Customer"}
              </h1>

              <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">
                {customer.email || "—"}
              </p>
            </div>
          </div>

          {!editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setError("");
                setSuccess("");
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 text-sm font-semibold text-[#07111F] transition hover:bg-cyan-300"
            >
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </button>
          )}
        </div>
      </section>

      {/* MESSAGES */}

      {success && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />

            <p className="text-sm text-emerald-200">
              {success}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
          >
            <X className="h-4 w-4 text-emerald-300" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
          <p className="text-sm text-red-200">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X className="h-4 w-4 text-red-300" />
          </button>
        </div>
      )}

      {/* SUMMARY */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                My Vehicles
              </p>

              <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
                {vehicles.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10">
              <Car className="h-5 w-5 text-cyan-300" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                Total Bookings
              </p>

              <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
                {bookings.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-400/10">
              <CalendarCheck className="h-5 w-5 text-violet-300" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                Active Bookings
              </p>

              <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
                {activeBookings}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10">
              <Activity className="h-5 w-5 text-amber-300" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                Completed Sessions
              </p>

              <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
                {completedSessions}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            </div>
          </div>
        </div>
      </section>

      {/* PROFILE */}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        {/* PERSONAL DETAILS */}

        <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border-primary)] p-5">
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">
                Personal Information
              </h2>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Your account and contact
                information.
              </p>
            </div>

            {editing && (
              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-300">
                Editing
              </span>
            )}
          </div>

          {!editing ? (
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <DetailItem
                icon={UserRound}
                label="Full Name"
                value={customer.name || "—"}
              />

              <DetailItem
                icon={Mail}
                label="Email"
                value={customer.email || "—"}
              />

              <DetailItem
                icon={Phone}
                label="Phone"
                value={customer.phone || "—"}
              />

              <DetailItem
                icon={ShieldCheck}
                label="Account Status"
                value={customer.status || "Active"}
              />

              <DetailItem
                icon={MapPin}
                label="Address"
                value={customer.address || "—"}
              />

              <DetailItem
                icon={MapPin}
                label="City"
                value={customer.city || "—"}
              />

              <DetailItem
                icon={MapPin}
                label="State"
                value={customer.state || "—"}
              />

              <DetailItem
                icon={MapPin}
                label="Pincode"
                value={customer.pincode || "—"}
              />
            </div>
          ) : (
            <div className="space-y-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
                    Full Name *
                  </span>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      handleChange(
                        "name",
                        event.target.value
                      )
                    }
                    className="customer-profile-input h-11 w-full rounded-xl border border-[var(--border-primary)] px-4 text-sm outline-none focus:border-cyan-400/50"
                    placeholder="Enter full name"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
                    Email *
                  </span>

                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      handleChange(
                        "email",
                        event.target.value
                      )
                    }
                    className="customer-profile-input h-11 w-full rounded-xl border border-[var(--border-primary)] px-4 text-sm outline-none focus:border-cyan-400/50"
                    placeholder="Enter email"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
                    Phone
                  </span>

                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.phone}
                    onChange={(event) =>
                      handleChange(
                        "phone",
                        event.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    className="customer-profile-input h-11 w-full rounded-xl border border-[var(--border-primary)] px-4 text-sm outline-none focus:border-cyan-400/50"
                    placeholder="10 digit phone number"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
                    Pincode
                  </span>

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={form.pincode}
                    onChange={(event) =>
                      handleChange(
                        "pincode",
                        event.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    className="customer-profile-input h-11 w-full rounded-xl border border-[var(--border-primary)] px-4 text-sm outline-none focus:border-cyan-400/50"
                    placeholder="Enter pincode"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
                    Address
                  </span>

                  <input
                    type="text"
                    value={form.address}
                    onChange={(event) =>
                      handleChange(
                        "address",
                        event.target.value
                      )
                    }
                    className="customer-profile-input h-11 w-full rounded-xl border border-[var(--border-primary)] px-4 text-sm outline-none focus:border-cyan-400/50"
                    placeholder="Enter address"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
                    City
                  </span>

                  <input
                    type="text"
                    value={form.city}
                    onChange={(event) =>
                      handleChange(
                        "city",
                        event.target.value
                      )
                    }
                    className="customer-profile-input h-11 w-full rounded-xl border border-[var(--border-primary)] px-4 text-sm outline-none focus:border-cyan-400/50"
                    placeholder="Enter city"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
                    State
                  </span>

                  <input
                    type="text"
                    value={form.state}
                    onChange={(event) =>
                      handleChange(
                        "state",
                        event.target.value
                      )
                    }
                    className="customer-profile-input h-11 w-full rounded-xl border border-[var(--border-primary)] px-4 text-sm outline-none focus:border-cyan-400/50"
                    placeholder="Enter state"
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-primary)] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleCancel}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-5 text-sm font-medium text-[var(--text-primary)] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void handleSave()
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 text-sm font-semibold text-[#07111F] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ACCOUNT / VEHICLE */}

        <div className="space-y-6">
          <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-400/10">
                <ShieldCheck className="h-5 w-5 text-violet-300" />
              </div>

              <div>
                <h2 className="font-semibold text-[var(--text-primary)]">
                  Account
                </h2>

                <p className="text-xs text-[var(--text-muted)]">
                  Role and account status
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4">
                <span className="text-sm text-[var(--text-secondary)]">
                  Role
                </span>

                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium capitalize text-cyan-300">
                  {customer.role ||
                    "customer"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4">
                <span className="text-sm text-[var(--text-secondary)]">
                  Status
                </span>

                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  {customer.status ||
                    "Active"}
                </span>
              </div>

              <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4">
                <p className="text-xs text-[var(--text-muted)]">
                  Customer ID
                </p>

                <p className="mt-2 break-all text-sm font-medium text-[var(--text-primary)]">
                  {customer.id}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10">
                <Car className="h-5 w-5 text-cyan-300" />
              </div>

              <div>
                <h2 className="font-semibold text-[var(--text-primary)]">
                  Default Vehicle
                </h2>

                <p className="text-xs text-[var(--text-muted)]">
                  Preferred vehicle for
                  charging
                </p>
              </div>
            </div>

            {defaultVehicle ? (
              <div className="mt-5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-[var(--text-primary)]">
                      {defaultVehicle.vehicleNumber ||
                        "Vehicle"}
                    </p>

                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {[
                        defaultVehicle.brand,
                        defaultVehicle.model,
                      ]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </p>
                  </div>

                  {defaultVehicle.isDefault && (
                    <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
                      Default
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                      Type
                    </p>

                    <p className="mt-1 text-sm text-[var(--text-primary)]">
                      {defaultVehicle.vehicleType ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                      Connector
                    </p>

                    <p className="mt-1 text-sm text-[var(--text-primary)]">
                      {defaultVehicle.connectorType ||
                        "—"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-[var(--border-primary)] p-6 text-center">
                <Car className="mx-auto h-8 w-8 text-[var(--text-muted)]" />

                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  No vehicle added yet.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
      <style>{`
        .customer-profile-banner { background: #ffffff; }
        html.dark .customer-profile-banner {
          background: linear-gradient(135deg, #0D1B2A 0%, #0B1726 50%, #111A35 100%);
        }
        .customer-profile-input {
          background: var(--input-bg);
          color: var(--input-text);
        }
        .customer-profile-input::placeholder { color: var(--text-muted); }
      `}</style>
    </div>
  );
}