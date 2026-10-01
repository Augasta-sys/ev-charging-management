import type {
  ElementType,
  ReactNode,
  SyntheticEvent,
} from "react";

import {
  CheckCircle2,
  Edit3,
  IndianRupee,
  Plus,
  Search,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

/* =========================================================
   TYPES
========================================================= */

type PricingStatus = "Active" | "Inactive";

interface Pricing {
  id: string;
  pricingId: string;
  stationId?: string;
  chargerType: string;
  powerRange?: string;
  pricePerKwh: number;
  effectiveDate: string;
  status: PricingStatus;
}

interface Station {
  id: string;
  stationId: string;
  stationName: string;
  city: string;
}

interface PricingFormData {
  stationId: string;
  chargerType: string;
  pricePerKwh: string;
  effectiveDate: string;
  status: PricingStatus;
}

/* =========================================================
   CONSTANTS
========================================================= */

const pricingStatuses: PricingStatus[] = [
  "Active",
  "Inactive",
];

const chargerTypes = [
  "AC Charger",
  "DC Fast Charger",
  "DC Ultra Fast Charger",
];

const emptyForm: PricingFormData = {
  stationId: "",
  chargerType: "",
  pricePerKwh: "",
  effectiveDate: "",
  status: "Active",
};

/* =========================================================
   COMPONENT
========================================================= */

function Pricing() {
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [stations, setStations] = useState<Station[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingPricing, setEditingPricing] =
    useState<Pricing | null>(null);

  const [form, setForm] =
    useState<PricingFormData>(emptyForm);

  const [deleteId, setDeleteId] =
    useState<string | null>(null);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {
    void loadData();
  }, []);

  /* =======================================================
     BODY SCROLL LOCK
  ======================================================= */

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

  /* =======================================================
     FETCH DATA
  ======================================================= */

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        pricingResponse,
        stationsResponse,
      ] = await Promise.all([
        api.get<Pricing[]>("/pricing"),
        api.get<Station[]>("/stations"),
      ]);

      setPricing(pricingResponse.data);
      setStations(stationsResponse.data);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load pricing data. Please make sure JSON Server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     STATION HELPERS
  ======================================================= */

  const getStation = (stationId?: string) => {
    if (!stationId) {
      return undefined;
    }

    return stations.find(
      (station) =>
        station.stationId === stationId ||
        station.id === stationId
    );
  };

  const getStationName = (stationId?: string) => {
    const station = getStation(stationId);

    return station?.stationName ?? "All Stations";
  };

  const getStationCity = (stationId?: string) => {
    const station = getStation(stationId);

    return station?.city ?? "Global pricing";
  };

  /* =======================================================
     STATISTICS
  ======================================================= */

  const stats = useMemo(
    () => ({
      total: pricing.length,

      active: pricing.filter(
        (item) => item.status === "Active"
      ).length,

      inactive: pricing.filter(
        (item) => item.status === "Inactive"
      ).length,

      average:
        pricing.length > 0
          ? pricing.reduce(
              (sum, item) =>
                sum + Number(item.pricePerKwh),
              0
            ) / pricing.length
          : 0,
    }),
    [pricing]
  );

  /* =======================================================
     FILTERED PRICING
  ======================================================= */

  const filteredPricing = useMemo(() => {
    const query = search.trim().toLowerCase();

    return pricing.filter((item) => {
      const station = getStation(item.stationId);

      const stationName =
        station?.stationName?.toLowerCase() ?? "";

      const stationCity =
        station?.city?.toLowerCase() ?? "";

      const stationId =
        item.stationId?.toLowerCase() ?? "";

      const matchesSearch =
        !query ||
        item.pricingId
          .toLowerCase()
          .includes(query) ||
        stationId.includes(query) ||
        stationName.includes(query) ||
        stationCity.includes(query) ||
        item.chargerType
          .toLowerCase()
          .includes(query);

      const matchesStation =
        !stationFilter ||
        item.stationId === stationFilter;

      const matchesStatus =
        !statusFilter ||
        item.status === statusFilter;

      return (
        matchesSearch &&
        matchesStation &&
        matchesStatus
      );
    });
  }, [
    pricing,
    stations,
    search,
    stationFilter,
    statusFilter,
  ]);

  /* =======================================================
     FORM UPDATE
  ======================================================= */

  const updateForm = <
    K extends keyof PricingFormData
  >(
    key: K,
    value: PricingFormData[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  /* =======================================================
     OPEN ADD MODAL
  ======================================================= */

  const openAddModal = () => {
    setEditingPricing(null);

    setForm({
      ...emptyForm,
      stationId: stations[0]?.stationId ?? "",
      chargerType: chargerTypes[0] ?? "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  /* =======================================================
     OPEN EDIT MODAL
  ======================================================= */

  const openEditModal = (item: Pricing) => {
    setEditingPricing(item);

    setForm({
      stationId: item.stationId ?? "",
      chargerType: item.chargerType,
      pricePerKwh: String(item.pricePerKwh),
      effectiveDate: item.effectiveDate,
      status: item.status,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingPricing(null);
    setForm(emptyForm);
    setError("");
  };

  /* =======================================================
     GENERATE PRICING ID
  ======================================================= */

  const generatePricingId = () => {
    let highest = 0;

    pricing.forEach((item) => {
      const match =
        item.pricingId.match(/PR(\d+)/i);

      if (match) {
        highest = Math.max(
          highest,
          Number(match[1])
        );
      }
    });

    return `PR${String(
      highest + 1
    ).padStart(3, "0")}`;
  };

  /* =======================================================
     VALIDATE FORM
  ======================================================= */

  const validateForm = () => {
    if (!form.stationId) {
      return "Please select a station.";
    }

    if (!form.chargerType) {
      return "Please select a charger type.";
    }

    if (!form.pricePerKwh) {
      return "Please enter the price per kWh.";
    }

    const price = Number(form.pricePerKwh);

    if (Number.isNaN(price) || price <= 0) {
      return "Price per kWh must be greater than 0.";
    }

    if (!form.effectiveDate) {
      return "Please select an effective date.";
    }

    const duplicate = pricing.find(
      (item) =>
        item.id !== editingPricing?.id &&
        item.stationId === form.stationId &&
        item.chargerType === form.chargerType &&
        item.effectiveDate === form.effectiveDate
    );

    if (duplicate) {
      return "A pricing record already exists for this station, charger type and effective date.";
    }

    return "";
  };

  /* =======================================================
     ADD / UPDATE PRICING
  ======================================================= */

  const handleSubmit = async (
    event: SyntheticEvent<HTMLFormElement>
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

      const payload = {
        stationId: form.stationId,
        chargerType: form.chargerType,
        pricePerKwh: Number(form.pricePerKwh),
        effectiveDate: form.effectiveDate,
        status: form.status,
      };

      if (editingPricing) {
        const response =
          await api.patch<Pricing>(
            `/pricing/${editingPricing.id}`,
            payload
          );

        setPricing((previous) =>
          previous.map((item) =>
            item.id === editingPricing.id
              ? response.data
              : item
          )
        );

        setSuccess(
          "Pricing updated successfully."
        );
      } else {
        const newPricingId =
          generatePricingId();

        const response =
          await api.post<Pricing>(
            "/pricing",
            {
              id: newPricingId,
              pricingId: newPricingId,
              ...payload,
            }
          );

        setPricing((previous) => [
          ...previous,
          response.data,
        ]);

        setSuccess(
          "Pricing added successfully."
        );
      }

      setTimeout(() => {
        closeModal();
        setSuccess("");
      }, 500);
    } catch (err) {
      console.error(err);

      setError(
        editingPricing
          ? "Unable to update pricing."
          : "Unable to add pricing."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     CHANGE STATUS
  ======================================================= */

  const handleStatusChange = async (
    item: Pricing
  ) => {
    const newStatus: PricingStatus =
      item.status === "Active"
        ? "Inactive"
        : "Active";

    try {
      setError("");

      const response =
        await api.patch<Pricing>(
          `/pricing/${item.id}`,
          {
            status: newStatus,
          }
        );

      setPricing((previous) =>
        previous.map((pricingItem) =>
          pricingItem.id === item.id
            ? response.data
            : pricingItem
        )
      );

      setSuccess(
        `${item.pricingId} is now ${newStatus}.`
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to update pricing status."
      );
    }
  };

  /* =======================================================
     DELETE PRICING
  ======================================================= */

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/pricing/${deleteId}`
      );

      setPricing((previous) =>
        previous.filter(
          (item) => item.id !== deleteId
        )
      );

      setDeleteId(null);

      setSuccess(
        "Pricing deleted successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to delete pricing."
      );
    }
  };

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters = () => {
    setSearch("");
    setStationFilter("");
    setStatusFilter("");
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
            <IndianRupee className="h-6 w-6 animate-pulse text-cyan-400" />
          </div>

          <p className="text-sm text-[var(--text-secondary)]">
            Loading pricing...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
            <IndianRupee className="h-4 w-4 text-[var(--text-primary)]" />
            Pricing Management
          </div>

          <h1 className="truncate text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            Pricing
          </h1>

          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Manage charging prices for stations
            and charger types.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:-translate-y-0.5 hover:from-cyan-300 hover:to-violet-400"
        >
          <Plus className="h-4 w-4" />
          Add Pricing
        </button>
      </div>

      {/* =====================================================
          ALERTS
      ===================================================== */}

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

      {/* =====================================================
          STATS
      ===================================================== */}

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Pricing"
          value={stats.total}
          description="All pricing records"
          icon={IndianRupee}
          iconClass="text-cyan-400"
          iconBg="bg-cyan-400/10"
        />

        <StatCard
          title="Active"
          value={stats.active}
          description="Currently active"
          icon={CheckCircle2}
          iconClass="text-emerald-400"
          iconBg="bg-emerald-400/10"
        />

        <StatCard
          title="Inactive"
          value={stats.inactive}
          description="Currently disabled"
          icon={X}
          iconClass="text-red-400"
          iconBg="bg-red-400/10"
        />

        <StatCard
          title="Average Price"
          value={`₹${stats.average.toFixed(2)}`}
          description="Average price per kWh"
          icon={Zap}
          iconClass="text-violet-400"
          iconBg="bg-violet-400/10"
        />
      </div>

      {/* =====================================================
          SEARCH & FILTERS
      ===================================================== */}

      <section className="mt-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Search & Filters
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Find pricing by station, charger
              type or status.
            </p>
          </div>

          {(search ||
            stationFilter ||
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

        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Search */}

          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--text-primary)]" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search pricing..."
              className="input-field !pl-11"
            />
          </div>

          {/* Station */}

          <select
            value={stationFilter}
            onChange={(event) =>
              setStationFilter(
                event.target.value
              )
            }
            className="input-field"
          >
            <option value="">
              All Stations
            </option>

            {stations.map((station) => (
              <option
                key={station.stationId}
                value={station.stationId}
              >
                {station.stationName}
              </option>
            ))}
          </select>

          {/* Status */}

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="input-field"
          >
            <option value="">
              All Statuses
            </option>

            {pricingStatuses.map((status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* =====================================================
          RESULT COUNT
      ===================================================== */}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-[var(--text-muted)]">
          Showing{" "}
          <span className="font-semibold text-[var(--text-secondary)]">
            {filteredPricing.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-[var(--text-secondary)]">
            {pricing.length}
          </span>{" "}
          pricing records
        </p>
      </div>

      {/* =====================================================
          DESKTOP TABLE
      ===================================================== */}

      <div className="mt-4 hidden w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] lg:block">

        <table className="w-full table-fixed border-collapse">

          <colgroup>
  <col className="w-[14%]" />
  <col className="w-[18%]" />
  <col className="w-[16%]" />
  <col className="w-[13%]" />
  <col className="w-[12%]" />
  <col className="w-[11%]" />
  <col className="w-[16%]" />
</colgroup>

          <thead>
            <tr className="border-b border-[var(--border-primary)] text-left">

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:px-4">
                Pricing ID
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:px-10">
                Station
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:px-4">
                Charger Type
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:px-4">
                Price / kWh
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:px-4">
                Effective
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:px-4">
                Status
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] xl:px-4">
                Actions
              </th>

            </tr>
          </thead>

          <tbody>

            {filteredPricing.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-16 text-center"
                >
                  <IndianRupee className="mx-auto h-8 w-8 text-[var(--text-muted)]" />

                  <p className="mt-3 text-sm font-medium text-[var(--text-secondary)]">
                    No pricing records found
                  </p>

                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Try changing your search or filters.
                  </p>
                </td>
              </tr>
            ) : (
              filteredPricing.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[var(--border-primary)] last:border-b-0 transition-colors hover:bg-[var(--bg-tertiary)]"
                >

                  {/* Pricing ID */}

               <td className="px-3 py-5 pr-6 align-middle xl:px-4 xl:pr-8">
  <div className="flex min-w-0 items-center gap-2.5">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300">
      <IndianRupee className="h-4 w-4" />
    </div>

    <span
      className="truncate text-sm font-semibold text-[var(--text-primary)]"
      title={item.pricingId}
    >
      {item.pricingId}
    </span>
  </div>
</td>

                  {/* Station */}

                 <td className="px-3 py-5 pl-6 align-middle xl:px-4 xl:pl-10">
  <div className="min-w-0">
    <p
      className="truncate text-sm font-semibold text-[var(--text-primary)]"
      title={getStationName(item.stationId)}
    >
      {getStationName(item.stationId)}
    </p>

    <p
      className="mt-1 truncate text-[11px] text-[var(--text-muted)]"
      title={getStationCity(item.stationId)}
    >
      {getStationCity(item.stationId)}
    </p>
  </div>
</td>

                  {/* Charger Type */}

                  <td className="px-3 py-5 align-middle xl:px-4">
                    <div className="flex min-w-0 items-center gap-2">

                      <Zap className="h-4 w-4 shrink-0 text-[var(--text-primary)]" />

                      <span
                        className="truncate text-sm font-medium text-[var(--text-primary)]"
                        title={item.chargerType}
                      >
                        {item.chargerType}
                      </span>

                    </div>
                  </td>

                  {/* Price */}

                  <td className="px-3 py-5 align-middle xl:px-4">
                    <div className="flex items-baseline gap-1 whitespace-nowrap">

                      <span className="text-sm font-bold text-[var(--text-primary)]">
                        ₹ {Number(
                          item.pricePerKwh
                        ).toFixed(2)}
                      </span>

                      <span className="text-[11px] text-[var(--text-muted)]">
                        / kWh
                      </span>

                    </div>
                  </td>

                  {/* Effective */}

                  <td className="px-3 py-5 align-middle xl:px-4">
                    <span className="whitespace-nowrap text-xs text-[var(--text-secondary)]">
                      {item.effectiveDate}
                    </span>
                  </td>

                  {/* Status */}

                  <td className="px-3 py-5 align-middle xl:px-4">
                    <div className="flex items-center">
                      <StatusBadge
                        status={item.status}
                      />
                    </div>
                  </td>

                  {/* Actions */}

                  <td className="px-3 py-5 align-middle xl:px-4">
                    <div className="flex items-center gap-2">

                      <ActionButton
                        label="Edit pricing"
                        onClick={() =>
                          openEditModal(item)
                        }
                      >
                        <Edit3 className="h-4 w-4 text-[var(--text-primary)]" />
                      </ActionButton>

                      <ActionButton
                        label={
                          item.status === "Active"
                            ? "Deactivate pricing"
                            : "Activate pricing"
                        }
                        onClick={() =>
                          void handleStatusChange(
                            item
                          )
                        }
                      >
                        <CheckCircle2 className="h-4 w-4 text-[var(--text-primary)]" />
                      </ActionButton>

                      <ActionButton
                        label="Delete pricing"
                        onClick={() =>
                          setDeleteId(item.id)
                        }
                        className="hover:border-red-400/30 hover:bg-red-400/10"
                      >
                        <Trash2 className="h-4 w-4 text-[var(--text-primary)]" />
                      </ActionButton>

                    </div>
                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>
      </div>

      {/* =====================================================
          MOBILE CARDS
      ===================================================== */}

      <section className="mt-4 grid gap-4 lg:hidden">

        {filteredPricing.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] px-5 py-14 text-center">

            <IndianRupee className="mx-auto h-8 w-8 text-[var(--text-muted)]" />

            <p className="mt-3 text-sm font-medium text-[var(--text-secondary)]">
              No pricing records found
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Try changing your search or filters.
            </p>

          </div>
        ) : (
          filteredPricing.map((item) => (
            <div
              key={item.id}
              className="min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 transition hover:border-cyan-400/20"
            >

              {/* Card Header */}

              <div className="flex items-start justify-between gap-3">

                <div className="flex min-w-0 items-center gap-3">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                    <IndianRupee className="h-5 w-5 text-[var(--text-primary)]" />
                  </div>

                  <div className="min-w-0">

                    <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                      {item.pricingId}
                    </p>

                    <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                      {item.chargerType}
                    </p>

                  </div>

                </div>

                <StatusBadge
                  status={item.status}
                />

              </div>

              {/* Card Details */}

              <div className="mt-5 grid grid-cols-2 gap-3">

                <InfoItem
                  label="Station"
                  value={getStationName(
                    item.stationId
                  )}
                />

                <InfoItem
                  label="Price / kWh"
                  value={`₹${Number(
                    item.pricePerKwh
                  ).toFixed(2)}`}
                  icon={
                    <IndianRupee className="h-3.5 w-3.5 text-[var(--text-primary)]" />
                  }
                />

                <InfoItem
                  label="Charger Type"
                  value={item.chargerType}
                  icon={
                    <Zap className="h-3.5 w-3.5 text-[var(--text-primary)]" />
                  }
                />

                <InfoItem
                  label="Effective Date"
                  value={item.effectiveDate}
                />

              </div>

              {/* Card Actions */}

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-[var(--border-primary)] pt-4">

                <ActionButton
                  label="Edit pricing"
                  onClick={() =>
                    openEditModal(item)
                  }
                  className="hover:border-cyan-400/40 hover:bg-cyan-400 hover:text-slate-950"
                >
                  <Edit3 className="h-4 w-4 text-[var(--text-primary)]" />
                </ActionButton>

                <ActionButton
                  label={
                    item.status === "Active"
                      ? "Deactivate pricing"
                      : "Activate pricing"
                  }
                  onClick={() =>
                    void handleStatusChange(
                      item
                    )
                  }
                  className="hover:border-emerald-400/40 hover:bg-emerald-400 hover:text-slate-950"
                >
                  <CheckCircle2 className="h-4 w-4 text-[var(--text-primary)]" />
                </ActionButton>

                <ActionButton
                  label="Delete pricing"
                  onClick={() =>
                    setDeleteId(item.id)
                  }
                  className="hover:border-red-400/40 hover:bg-red-400 hover:text-white"
                >
                  <Trash2 className="h-4 w-4 text-[var(--text-primary)]" />
                </ActionButton>

              </div>

            </div>
          ))
        )}

      </section>

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-5">

          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-2xl shadow-black/60">

            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-5 py-4 sm:px-6">

              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {editingPricing
                    ? "Edit Pricing"
                    : "Add Pricing"}
                </h2>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Configure the charging price for a
                  station and charger type.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition hover:bg-white hover:text-slate-950 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>

            </div>

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              className="px-5 py-5 sm:px-6"
            >

              {error && (
                <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-5 text-red-300">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">

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

                {/* Charger Type */}

                <FormField label="Charger Type">
                  <select
                    value={form.chargerType}
                    onChange={(event) =>
                      updateForm(
                        "chargerType",
                        event.target.value
                      )
                    }
                    className="input-field"
                    required
                  >
                    <option value="">
                      Select charger type
                    </option>

                    {chargerTypes.map(
                      (chargerType) => (
                        <option
                          key={chargerType}
                          value={chargerType}
                        >
                          {chargerType}
                        </option>
                      )
                    )}
                  </select>
                </FormField>

                {/* Price */}

                <FormField label="Price per kWh">
                  <div className="relative">

                    <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-primary)]" />

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.pricePerKwh}
                      onChange={(event) =>
                        updateForm(
                          "pricePerKwh",
                          event.target.value
                        )
                      }
                      placeholder="Enter price"
                      className="input-field !pl-10"
                      required
                    />

                  </div>
                </FormField>

                {/* Effective Date */}

                <FormField label="Effective Date">
                  <input
                    type="date"
                    value={form.effectiveDate}
                    onChange={(event) =>
                      updateForm(
                        "effectiveDate",
                        event.target.value
                      )
                    }
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
                        event.target.value as PricingStatus
                      )
                    }
                    className="input-field"
                    required
                  >
                    {pricingStatuses.map(
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

              </div>

              {/* Footer */}

              <div className="mt-5 flex flex-col-reverse gap-3 border-t border-[var(--border-primary)] pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-11 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white hover:text-slate-950 disabled:opacity-50"
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
                    : editingPricing
                      ? "Update Pricing"
                      : "Add Pricing"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* =====================================================
          DELETE CONFIRMATION
      ===================================================== */}

      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-6 shadow-2xl shadow-black/60">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-400/10">
              <Trash2 className="h-5 w-5 text-red-400" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-[var(--text-primary)]">
              Delete Pricing?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              This pricing record will be permanently
              removed from the system. This action
              cannot be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() =>
                  setDeleteId(null)
                }
                className="h-11 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white hover:text-slate-950"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleDelete()
                }
                className="h-11 rounded-xl bg-red-500 px-5 text-sm font-bold text-white transition hover:bg-red-400"
              >
                Delete Pricing
              </button>

            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          COMPONENT STYLES
      ===================================================== */}

      <style>{`
        .input-field {
          width: 100%;
          height: 44px;
          min-width: 0;
          max-width: 100%;
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

        html.dark input[type="date"].input-field,
        html.dark select.input-field {
          color-scheme: dark;
        }

        html.light input[type="date"].input-field,
        html.light select.input-field {
          color-scheme: light;
        }

        html.dark input[type="date"].input-field::-webkit-calendar-picker-indicator {
          filter: brightness(0) invert(1) !important;
          opacity: 1 !important;
          cursor: pointer;
        }

        html.light input[type="date"].input-field::-webkit-calendar-picker-indicator {
          filter: none !important;
          opacity: 1 !important;
          cursor: pointer;
        }

        html.dark input[type="date"],
        html.dark select {
          color-scheme: dark;
        }

        html.light input[type="date"],
        html.light select {
          color-scheme: light;
        }
      `}</style>

    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: ElementType;
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
          <Icon
            className={`h-5 w-5 ${iconClass}`}
          />
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

interface StatusBadgeProps {
  status: PricingStatus;
}

function StatusBadge({
  status,
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        status === "Active"
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
          : "border-slate-400/20 bg-slate-400/10 text-[var(--text-secondary)]"
      }`}
    >
      {status}
    </span>
  );
}

/* =========================================================
   ACTION BUTTON
========================================================= */

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
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
      className={`
        flex
        h-9
        w-9
        shrink-0
        items-center
        justify-center
        rounded-lg
        border
        border-[var(--border-primary)]
        bg-[var(--bg-tertiary)]
        text-[var(--text-primary)]
        transition
        hover:bg-white/10
        ${className}
      `}
    >
      {children}
    </button>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

interface InfoItemProps {
  label: string;
  value: string;
  icon?: ReactNode;
}

function InfoItem({
  label,
  value,
  icon,
}: InfoItemProps) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3">

      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </p>

      <div className="mt-1 flex min-w-0 items-center gap-1.5">

        {icon}

        <p className="truncate text-xs font-medium text-[var(--text-secondary)]">
          {value}
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

interface FormFieldProps {
  label: string;
  children: ReactNode;
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

/* =========================================================
   EXPORT
========================================================= */

export default Pricing;