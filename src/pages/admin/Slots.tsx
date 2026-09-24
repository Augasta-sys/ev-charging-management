import type {
  ElementType,
  ReactNode,
  SyntheticEvent,
} from "react";
import {
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Plus,
  Search,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import api from "../../services/api";
import type { SlotStatus } from "../../types";

/* =========================================================
   TYPES
========================================================= */

interface ChargingSlot {
  id: string;
  slotId: string;
  chargerId: string;
  stationId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
}

interface Charger {
  id: string;
  chargerId: string;
  stationId: string;
  chargerNumber: string;
  chargerType: string;
  connectorType: string;
  powerOutput: number;
  pricePerKwh: number;
  status: string;
}

interface Station {
  id: string;
  stationId: string;
  stationName: string;
  city: string;
}

interface SlotFormData {
  stationId: string;
  chargerId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
}

/* =========================================================
   CONSTANTS
========================================================= */

const slotStatuses: SlotStatus[] = [
  "Available",
  "Booked",
  "Blocked",
  "Completed",
  "Cancelled",
];

const emptyForm: SlotFormData = {
  stationId: "",
  chargerId: "",
  date: "",
  startTime: "",
  endTime: "",
  status: "Available",
};

/* =========================================================
   COMPONENT
========================================================= */

function Slots() {
  const [slots, setSlots] = useState<ChargingSlot[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [chargers, setChargers] = useState<Charger[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [stationFilter, setStationFilter] =
    useState("");
  const [chargerFilter, setChargerFilter] =
    useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] =
    useState<ChargingSlot | null>(null);

  const [form, setForm] =
    useState<SlotFormData>(emptyForm);

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
    if (showModal || deleteId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
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
        slotsResponse,
        stationsResponse,
        chargersResponse,
      ] = await Promise.all([
        api.get<ChargingSlot[]>("/slots"),
        api.get<Station[]>("/stations"),
        api.get<Charger[]>("/chargers"),
      ]);

      setSlots(slotsResponse.data);
      setStations(stationsResponse.data);
      setChargers(chargersResponse.data);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load slot data. Please make sure JSON Server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     HELPERS
  ======================================================= */

  const getStation = (stationId: string) =>
    stations.find(
      (station) =>
        station.stationId === stationId
    );

  const getCharger = (chargerId: string) =>
    chargers.find(
      (charger) =>
        charger.chargerId === chargerId
    );

  const getStationName = (stationId: string) =>
    getStation(stationId)?.stationName ??
    stationId;

  const getChargerNumber = (chargerId: string) =>
    getCharger(chargerId)?.chargerNumber ??
    chargerId;

  /* =======================================================
     FORM CHARGERS
  ======================================================= */

  const filteredFormChargers = useMemo(() => {
    if (!form.stationId) {
      return chargers;
    }

    return chargers.filter(
      (charger) =>
        charger.stationId === form.stationId
    );
  }, [chargers, form.stationId]);

  /* =======================================================
     FILTER CHARGERS
  ======================================================= */

  const filteredFilterChargers = useMemo(() => {
    if (!stationFilter) {
      return chargers;
    }

    return chargers.filter(
      (charger) =>
        charger.stationId === stationFilter
    );
  }, [chargers, stationFilter]);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const stats = useMemo(
    () => ({
      total: slots.length,

      available: slots.filter(
        (slot) => slot.status === "Available"
      ).length,

      booked: slots.filter(
        (slot) => slot.status === "Booked"
      ).length,

      blocked: slots.filter(
        (slot) => slot.status === "Blocked"
      ).length,

      completed: slots.filter(
        (slot) => slot.status === "Completed"
      ).length,
    }),
    [slots]
  );

  /* =======================================================
     FILTERED SLOTS
  ======================================================= */

  const filteredSlots = useMemo(() => {
    const query = search.trim().toLowerCase();

    return slots.filter((slot) => {
      const station = getStation(
        slot.stationId
      );

      const charger = getCharger(
        slot.chargerId
      );

      const matchesSearch =
        !query ||
        slot.slotId
          .toLowerCase()
          .includes(query) ||
        slot.chargerId
          .toLowerCase()
          .includes(query) ||
        slot.stationId
          .toLowerCase()
          .includes(query) ||
        station?.stationName
          .toLowerCase()
          .includes(query) ||
        station?.city
          .toLowerCase()
          .includes(query) ||
        charger?.chargerNumber
          .toLowerCase()
          .includes(query);

      const matchesStation =
        !stationFilter ||
        slot.stationId === stationFilter;

      const matchesCharger =
        !chargerFilter ||
        slot.chargerId === chargerFilter;

      const matchesDate =
        !dateFilter ||
        slot.date === dateFilter;

      const matchesStatus =
        !statusFilter ||
        slot.status === statusFilter;

      return (
        matchesSearch &&
        matchesStation &&
        matchesCharger &&
        matchesDate &&
        matchesStatus
      );
    });
  }, [
    slots,
    stations,
    chargers,
    search,
    stationFilter,
    chargerFilter,
    dateFilter,
    statusFilter,
  ]);

  /* =======================================================
     FORM UPDATE
  ======================================================= */

  const updateForm = <K extends keyof SlotFormData>(
    key: K,
    value: SlotFormData[K]
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
    const defaultStation =
      stations[0]?.stationId ?? "";

    const stationChargers =
      chargers.filter(
        (charger) =>
          charger.stationId ===
          defaultStation
      );

    setEditingSlot(null);

    setForm({
      ...emptyForm,
      stationId: defaultStation,
      chargerId:
        stationChargers[0]?.chargerId ?? "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  /* =======================================================
     OPEN EDIT MODAL
  ======================================================= */

  const openEditModal = (
    slot: ChargingSlot
  ) => {
    setEditingSlot(slot);

    setForm({
      stationId: slot.stationId,
      chargerId: slot.chargerId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingSlot(null);
    setForm(emptyForm);
    setError("");
  };

  /* =======================================================
     GENERATE SLOT ID
  ======================================================= */

  const generateSlotId = () => {
    let highest = 0;

    slots.forEach((slot) => {
      const match =
        slot.slotId.match(/SL(\d+)/i);

      if (match) {
        highest = Math.max(
          highest,
          Number(match[1])
        );
      }
    });

    return `SL${String(
      highest + 1
    ).padStart(3, "0")}`;
  };

  /* =======================================================
     TIME HELPERS
  ======================================================= */

  const timeToMinutes = (
    time: string
  ) => {
    const [hours, minutes] = time
      .split(":")
      .map(Number);

    return (
      hours * 60 + minutes
    );
  };

  const hasTimeOverlap = (
    newStart: string,
    newEnd: string,
    existingStart: string,
    existingEnd: string
  ) => {
    const start =
      timeToMinutes(newStart);

    const end =
      timeToMinutes(newEnd);

    const existingStartMinutes =
      timeToMinutes(existingStart);

    const existingEndMinutes =
      timeToMinutes(existingEnd);

    return (
      start < existingEndMinutes &&
      end > existingStartMinutes
    );
  };

  /* =======================================================
     VALIDATE FORM
  ======================================================= */

  const validateForm = () => {
    if (!form.stationId) {
      return "Please select a station.";
    }

    if (!form.chargerId) {
      return "Please select a charger.";
    }

    if (!form.date) {
      return "Please select a date.";
    }

    if (!form.startTime) {
      return "Please select a start time.";
    }

    if (!form.endTime) {
      return "Please select an end time.";
    }

    if (
      timeToMinutes(form.startTime) >=
      timeToMinutes(form.endTime)
    ) {
      return "End time must be later than start time.";
    }

    const charger = getCharger(
      form.chargerId
    );

    if (
      !charger ||
      charger.stationId !==
        form.stationId
    ) {
      return "The selected charger does not belong to the selected station.";
    }

    const conflictingSlot =
      slots.find((slot) => {
        if (
          slot.id === editingSlot?.id
        ) {
          return false;
        }

        if (
          slot.chargerId !==
          form.chargerId
        ) {
          return false;
        }

        if (
          slot.date !== form.date
        ) {
          return false;
        }

        if (
          slot.status ===
            "Cancelled" ||
          slot.status === "Completed"
        ) {
          return false;
        }

        return hasTimeOverlap(
          form.startTime,
          form.endTime,
          slot.startTime,
          slot.endTime
        );
      });

    if (conflictingSlot) {
      return `This charger already has a slot from ${conflictingSlot.startTime} to ${conflictingSlot.endTime} on ${conflictingSlot.date}.`;
    }

    return "";
  };

  /* =======================================================
     ADD / UPDATE SLOT
  ======================================================= */

const handleSubmit = async (
  event: SyntheticEvent<HTMLFormElement>
) => {
  event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        stationId: form.stationId,
        chargerId: form.chargerId,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        status: form.status,
      };

      if (editingSlot) {
        const response =
          await api.patch<ChargingSlot>(
            `/slots/${editingSlot.id}`,
            payload
          );

        setSlots((previous) =>
          previous.map((slot) =>
            slot.id === editingSlot.id
              ? response.data
              : slot
          )
        );

        setSuccess(
          "Charging slot updated successfully."
        );
      } else {
        const newSlotId =
          generateSlotId();

        const response =
          await api.post<ChargingSlot>(
            "/slots",
            {
              id: newSlotId,
              slotId: newSlotId,
              ...payload,
            }
          );

        setSlots((previous) => [
          ...previous,
          response.data,
        ]);

        setSuccess(
          "Charging slot added successfully."
        );
      }

      setTimeout(() => {
        closeModal();
        setSuccess("");
      }, 500);
    } catch (err) {
      console.error(err);

      setError(
        editingSlot
          ? "Unable to update charging slot."
          : "Unable to add charging slot."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     CHANGE SLOT STATUS
  ======================================================= */

  const handleStatusChange = async (
    slot: ChargingSlot,
    status: SlotStatus
  ) => {
    try {
      setError("");

      const response =
        await api.patch<ChargingSlot>(
          `/slots/${slot.id}`,
          {
            status,
          }
        );

      setSlots((previous) =>
        previous.map((item) =>
          item.id === slot.id
            ? response.data
            : item
        )
      );

      setSuccess(
        `${slot.slotId} status changed to ${status}.`
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to update the slot status."
      );
    }
  };

  /* =======================================================
     DELETE SLOT
  ======================================================= */

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setError("");

      await api.delete(
        `/slots/${deleteId}`
      );

      setSlots((previous) =>
        previous.filter(
          (slot) =>
            slot.id !== deleteId
        )
      );

      setDeleteId(null);

      setSuccess(
        "Charging slot deleted successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to delete charging slot."
      );
    }
  };

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters = () => {
    setSearch("");
    setStationFilter("");
    setChargerFilter("");
    setDateFilter("");
    setStatusFilter("");
  };

  /* =======================================================
     STATUS COLORS
  ======================================================= */

  const getStatusClass = (
    status: SlotStatus
  ) => {
    switch (status) {
      case "Available":
        return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

      case "Booked":
        return "border-blue-400/20 bg-blue-400/10 text-blue-300";

      case "Blocked":
        return "border-amber-400/20 bg-amber-400/10 text-amber-300";

      case "Completed":
        return "border-violet-400/20 bg-violet-400/10 text-violet-300";

      case "Cancelled":
        return "border-red-400/20 bg-red-400/10 text-red-300";

      default:
        return "border-white/10 bg-white/5 text-slate-300";
    }
  };

  /* =======================================================
     STATUS ICON
  ======================================================= */

  const getStatusIcon = (
    status: SlotStatus
  ) => {
    switch (status) {
      case "Available":
        return (
          <CheckCircle2 className="h-3.5 w-3.5" />
        );

      case "Booked":
        return (
          <CalendarDays className="h-3.5 w-3.5" />
        );

      case "Blocked":
        return (
          <Ban className="h-3.5 w-3.5" />
        );

      case "Completed":
        return (
          <CheckCircle2 className="h-3.5 w-3.5" />
        );

      case "Cancelled":
        return (
          <X className="h-3.5 w-3.5" />
        );

      default:
        return (
          <Clock3 className="h-3.5 w-3.5" />
        );
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
            <CalendarDays className="h-6 w-6 animate-pulse text-cyan-400" />
          </div>

          <p className="text-sm text-slate-400">
            Loading charging slots...
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
      {/* ===================================================
          HEADER
      =================================================== */}
      <div className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
            <CalendarDays className="h-4 w-4" />

            Slot Management
          </div>

          <h1 className="truncate text-2xl font-bold text-white sm:text-3xl">
            Charging Slots
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage charger availability and booking time slots.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:-translate-y-0.5 hover:from-cyan-300 hover:to-violet-400"
        >
          <Plus className="h-4 w-4" />

          Add Slot
        </button>
      </div>

      {/* ===================================================
          ALERTS
      =================================================== */}
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

      {/* ===================================================
          STATS
      =================================================== */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Slots"
          value={stats.total}
          description="All charging slots"
          icon={CalendarDays}
          iconClass="text-cyan-400"
          iconBg="bg-cyan-400/10"
        />

        <StatCard
          title="Available"
          value={stats.available}
          description="Ready for booking"
          icon={CheckCircle2}
          iconClass="text-emerald-400"
          iconBg="bg-emerald-400/10"
        />

        <StatCard
          title="Booked"
          value={stats.booked}
          description="Currently reserved"
          icon={Zap}
          iconClass="text-blue-400"
          iconBg="bg-blue-400/10"
        />

        <StatCard
          title="Blocked"
          value={stats.blocked}
          description="Unavailable slots"
          icon={Ban}
          iconClass="text-amber-400"
          iconBg="bg-amber-400/10"
        />

        <StatCard
          title="Completed"
          value={stats.completed}
          description="Completed slots"
          icon={CheckCircle2}
          iconClass="text-violet-400"
          iconBg="bg-violet-400/10"
        />
      </div>

     {/* ===================================================
    FILTERS
=================================================== */}
<section className="mt-6 rounded-2xl border border-white/10 bg-[#0D1B2A] p-4 sm:p-5">
  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-sm font-semibold text-white">
        Search & Filters
      </h2>

      <p className="mt-1 text-xs text-slate-500">
        Find slots by station, charger, date or status.
      </p>
    </div>

    {(search ||
      stationFilter ||
      chargerFilter ||
      dateFilter ||
      statusFilter) && (
      <button
        type="button"
        onClick={clearFilters}
        className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-cyan-400 transition hover:text-white"
      >
        <X className="h-3.5 w-3.5" />
        Clear filters
      </button>
    )}
  </div>

  <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
    {/* Search */}
    <div className="relative min-w-0">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 !text-white"
      />

      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search slots..."
        className="input-field !pl-11"
      />
    </div>

    {/* Station */}
    <select
      value={stationFilter}
      onChange={(event) => {
        setStationFilter(event.target.value);
        setChargerFilter("");
      }}
      className="input-field"
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

    {/* Charger */}
    <select
      value={chargerFilter}
      onChange={(event) =>
        setChargerFilter(event.target.value)
      }
      className="input-field"
    >
      <option value="">All Chargers</option>

      {filteredFilterChargers.map((charger) => (
        <option
          key={charger.chargerId}
          value={charger.chargerId}
        >
          {charger.chargerId} — {charger.chargerNumber}
        </option>
      ))}
    </select>

    {/* Date */}
    <div className="relative min-w-0">
      <input
        type="date"
        value={dateFilter}
        onChange={(event) =>
          setDateFilter(event.target.value)
        }
        className="input-field"
      />
    </div>

    {/* Status */}
    <select
      value={statusFilter}
      onChange={(event) =>
        setStatusFilter(event.target.value)
      }
      className="input-field"
    >
      <option value="">All Statuses</option>

      {slotStatuses.map((status) => (
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

      {/* ===================================================
          RESULT COUNT
      =================================================== */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-300">
            {filteredSlots.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-300">
            {slots.length}
          </span>{" "}
          slots
        </p>
      </div>

     {/* ===================================================
    DESKTOP TABLE
=================================================== */}
<section className="mt-4 hidden w-full min-w-0 rounded-2xl border border-white/10 bg-[#0D1B2A] lg:block">
  <div className="w-full min-w-0">
    <table className="w-full table-fixed border-separate border-spacing-0">
     <thead>
  <tr className="border-b border-white/10 text-left">
    <th className="w-[10%] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 xl:px-5">
      Slot
    </th>

    <th className="w-[20%] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 xl:px-5">
      Station
    </th>

    <th className="w-[14%] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 xl:px-5">
      Charger
    </th>

    <th className="w-[13%] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 xl:px-5">
      Date
    </th>

    <th className="w-[14%] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 xl:px-5">
      Time
    </th>

    <th className="w-[17%] px-3 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
      Status
    </th>

    <th className="w-[12%] px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 xl:px-5">
      Actions
    </th>
  </tr>
</thead>

      <tbody>
        {filteredSlots.length === 0 ? (
          <tr>
            <td
              colSpan={7}
              className="px-5 py-16 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                <CalendarDays className="h-6 w-6 text-white" />
              </div>

              <p className="mt-4 text-sm font-medium text-slate-400">
                No slots found
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Try changing your search or filters.
              </p>
            </td>
          </tr>
        ) : (
          filteredSlots.map((slot) => (
            <tr
              key={slot.id}
              className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.025]"
            >
              {/* Slot */}
              <td className="min-w-0 px-4 py-5 xl:px-5">
                <p className="truncate text-sm font-bold text-white">
                  {slot.slotId}
                </p>
              </td>

              {/* Station */}
              <td className="min-w-0 px-4 py-5 xl:px-5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {getStationName(slot.stationId)}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {getStation(slot.stationId)?.city ??
                      slot.stationId}
                  </p>
                </div>
              </td>

              {/* Charger */}
              <td className="min-w-0 px-4 py-5 xl:px-5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Zap className="h-4 w-4 shrink-0 text-white" />

                  <span className="truncate text-sm text-slate-300">
                    {getChargerNumber(slot.chargerId)}
                  </span>
                </div>
              </td>

              {/* Date */}
             <td className="px-4 py-5 xl:px-5">
  <div className="flex min-w-0 items-center gap-2.5">
    <CalendarDays className="h-4 w-4 shrink-0 !text-white" />

    <span className="truncate text-sm text-slate-200">
      {slot.date}
    </span>
  </div>
</td>

              {/* Time */}
             <td className="px-4 py-5 xl:px-5">
  <div className="flex min-w-0 items-center gap-2.5">
    <Clock3 className="h-4 w-4 shrink-0 !text-white" />

    <span className="truncate text-sm text-slate-200">
      {slot.startTime} - {slot.endTime}
    </span>
  </div>
</td>

              {/* Status */}
              <td className="px-3 py-5">
                <div className="flex items-center">
                  <StatusBadge
                    status={slot.status}
                    className={getStatusClass(slot.status)}
                    icon={getStatusIcon(slot.status)}
                  />
                </div>
              </td>

              {/* Actions */}
              <td className="px-4 py-5 xl:px-5">
                <div className="flex items-center justify-end gap-2.5">
                  {/* Edit */}
                  <ActionButton
                    label="Edit slot"
                    onClick={() => openEditModal(slot)}
                    className="border-white/10 bg-white/5 text-white hover:border-cyan-400/40 hover:bg-cyan-400 hover:text-slate-950"
                  >
                    <Edit3 className="h-4 w-4 text-white" />
                  </ActionButton>

                  {/* Block */}
                  {slot.status === "Available" && (
                    <ActionButton
                      label="Block slot"
                      onClick={() =>
                        void handleStatusChange(
                          slot,
                          "Blocked"
                        )
                      }
                      className="border-white/10 bg-white/5 text-white hover:border-amber-400/40 hover:bg-amber-400 hover:text-slate-950"
                    >
                      <Ban className="h-4 w-4 text-white" />
                    </ActionButton>
                  )}

                  {/* Release blocked */}
                  {slot.status === "Blocked" && (
                    <ActionButton
                      label="Release slot"
                      onClick={() =>
                        void handleStatusChange(
                          slot,
                          "Available"
                        )
                      }
                      className="border-white/10 bg-white/5 text-white hover:border-emerald-400/40 hover:bg-emerald-400 hover:text-slate-950"
                    >
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </ActionButton>
                  )}

                  {/* Release cancelled */}
                  {slot.status === "Cancelled" && (
                    <ActionButton
                      label="Release cancelled slot"
                      onClick={() =>
                        void handleStatusChange(
                          slot,
                          "Available"
                        )
                      }
                      className="border-white/10 bg-white/5 text-white hover:border-emerald-400/40 hover:bg-emerald-400 hover:text-slate-950"
                    >
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </ActionButton>
                  )}

                  {/* Delete */}
                  <ActionButton
                    label="Delete slot"
                    onClick={() =>
                      setDeleteId(slot.id)
                    }
                    className="border-white/10 bg-white/5 text-white hover:border-red-400/40 hover:bg-red-400 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4 text-white" />
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

      {/* ===================================================
          MOBILE CARDS
      =================================================== */}
      <section className="mt-4 grid gap-4 lg:hidden">
        {filteredSlots.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0D1B2A] px-5 py-14 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-slate-600" />

            <p className="mt-3 text-sm font-medium text-slate-400">
              No slots found
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          filteredSlots.map(
            (slot) => (
              <div
                key={slot.id}
                className="min-w-0 rounded-2xl border border-white/10 bg-[#0D1B2A] p-4 transition hover:border-cyan-400/20"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                      <CalendarDays className="h-5 w-5 text-white" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">
                        {slot.slotId}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {getChargerNumber(
                          slot.chargerId
                        )}
                      </p>
                    </div>
                  </div>

                  <StatusBadge
                    status={slot.status}
                    className={getStatusClass(
                      slot.status
                    )}
                    icon={getStatusIcon(
                      slot.status
                    )}
                  />
                </div>

                {/* Card Details */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <InfoItem
                    label="Station"
                    value={getStationName(
                      slot.stationId
                    )}
                  />

                  <InfoItem
                    label="Charger"
                    value={getChargerNumber(
                      slot.chargerId
                    )}
                  />

                  <InfoItem
                    label="Date"
                    value={slot.date}
                    icon={
                      <CalendarDays className="h-3.5 w-3.5 text-white" />
                    }
                  />

                  <InfoItem
                    label="Time"
                    value={`${slot.startTime} - ${slot.endTime}`}
                    icon={
                      <Clock3 className="h-3.5 w-3.5 text-white" />
                    }
                  />
                </div>

                {/* Card Actions */}
                <div className="mt-5 flex items-center justify-end gap-2 border-t border-white/5 pt-4">
                  {/* Edit */}
                  <ActionButton
                    label="Edit slot"
                    onClick={() =>
                      openEditModal(slot)
                    }
                    className="hover:border-cyan-400/40 hover:bg-cyan-400 hover:text-slate-950"
                  >
                    <Edit3 className="h-4 w-4" />
                  </ActionButton>

                  {/* Block */}
                  {slot.status ===
                    "Available" && (
                    <ActionButton
                      label="Block slot"
                      onClick={() =>
                        void handleStatusChange(
                          slot,
                          "Blocked"
                        )
                      }
                      className="hover:border-amber-400/40 hover:bg-amber-400 hover:text-slate-950"
                    >
                      <Ban className="h-4 w-4 text-white" />
                    </ActionButton>
                  )}

                  {/* Release blocked */}
                  {slot.status ===
                    "Blocked" && (
                    <ActionButton
                      label="Release slot"
                      onClick={() =>
                        void handleStatusChange(
                          slot,
                          "Available"
                        )
                      }
                      className="hover:border-emerald-400/40 hover:bg-emerald-400 hover:text-slate-950"
                    >
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </ActionButton>
                  )}

                  {/* Release cancelled */}
                  {slot.status ===
                    "Cancelled" && (
                    <ActionButton
                      label="Release cancelled slot"
                      onClick={() =>
                        void handleStatusChange(
                          slot,
                          "Available"
                        )
                      }
                      className="hover:border-emerald-400/40 hover:bg-emerald-400 hover:text-slate-950"
                    >
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </ActionButton>
                  )}

                  {/* Delete */}
                  <ActionButton
                    label="Delete slot"
                    onClick={() =>
                      setDeleteId(
                        slot.id
                      )
                    }
                    className="hover:border-red-400/40 hover:bg-red-400 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </ActionButton>
                </div>
              </div>
            )
          )
        )}
      </section>

      {/* ===================================================
          ADD / EDIT MODAL
      =================================================== */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-5">
          <div className="flex max-h-[calc(100vh-24px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0D1A2A] shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-40px)]">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingSlot
                    ? "Edit Charging Slot"
                    : "Add Charging Slot"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Configure the station, charger and booking time.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:bg-white hover:text-slate-950 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSubmit}
              className="min-h-0 flex-1 px-5 py-5 sm:px-6"
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
                    onChange={(event) => {
                      const stationId =
                        event.target.value;

                      const stationChargers =
                        chargers.filter(
                          (charger) =>
                            charger.stationId ===
                            stationId
                        );

                      updateForm(
                        "stationId",
                        stationId
                      );

                      updateForm(
                        "chargerId",
                        stationChargers[0]
                          ?.chargerId ?? ""
                      );
                    }}
                    className="input-field"
                    required
                  >
                    <option value="">
                      Select station
                    </option>

                    {stations.map(
                      (station) => (
                        <option
                          key={
                            station.stationId
                          }
                          value={
                            station.stationId
                          }
                        >
                          {
                            station.stationName
                          }{" "}
                          — {station.city}
                        </option>
                      )
                    )}
                  </select>
                </FormField>

                {/* Charger */}
                <FormField label="Charger">
                  <select
                    value={form.chargerId}
                    onChange={(event) =>
                      updateForm(
                        "chargerId",
                        event.target.value
                      )
                    }
                    className="input-field"
                    required
                  >
                    <option value="">
                      Select charger
                    </option>

                    {filteredFormChargers.map(
                      (charger) => (
                        <option
                          key={
                            charger.chargerId
                          }
                          value={
                            charger.chargerId
                          }
                        >
                          {
                            charger.chargerId
                          }{" "}
                          —{" "}
                          {
                            charger.chargerNumber
                          }
                        </option>
                      )
                    )}
                  </select>
                </FormField>

                {/* Date */}
                <FormField label="Date">
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      updateForm(
                        "date",
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
                        event.target
                          .value as SlotStatus
                      )
                    }
                    className="input-field"
                    required
                  >
                    {slotStatuses.map(
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

                {/* Start Time */}
                <FormField label="Start Time">
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(event) =>
                      updateForm(
                        "startTime",
                        event.target.value
                      )
                    }
                    className="input-field"
                    required
                  />
                </FormField>

                {/* End Time */}
                <FormField label="End Time">
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(event) =>
                      updateForm(
                        "endTime",
                        event.target.value
                      )
                    }
                    className="input-field"
                    required
                  />
                </FormField>
              </div>

              {/* Modal Footer */}
              <div className="mt-5 flex shrink-0 flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-11 rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white hover:text-slate-950 disabled:opacity-50"
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
                    : editingSlot
                      ? "Update Slot"
                      : "Add Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================
          DELETE CONFIRMATION
      =================================================== */}
      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0D1A2A] p-6 shadow-2xl shadow-black/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-400/10">
              <Trash2 className="h-5 w-5 text-red-400" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-white">
              Delete Charging Slot?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              This slot will be permanently removed from
              the system. This action cannot be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setDeleteId(null)
                }
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white hover:text-slate-950"
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
                Delete Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          COMPONENT STYLES
      =================================================== */}
     <style>{`
  .input-field {
    width: 100%;
    height: 44px;
    min-width: 0;
    border-radius: 0.75rem;
    border: 1px solid rgba(255,255,255,0.10);
    background: #101f31;
    padding: 0 0.875rem;
    font-size: 0.875rem;
    color: white;
    outline: none;
    transition: all 0.2s ease;
  }

  .input-field::placeholder {
    color: rgb(71 85 105);
  }

  .input-field:focus {
    border-color: rgba(34,211,238,0.40);
    box-shadow: 0 0 0 2px rgba(34,211,238,0.08);
  }

  .input-field option {
    background: #101f31;
    color: white;
  }

  /* =========================================
     WHITE DATE / TIME NATIVE ICONS
     ========================================= */

  input[type="date"].input-field,
  input[type="time"].input-field {
    color-scheme: dark;
  }

  input[type="date"].input-field::-webkit-calendar-picker-indicator,
  input[type="time"].input-field::-webkit-calendar-picker-indicator {
    filter: brightness(0) invert(1) !important;
    opacity: 1 !important;
    cursor: pointer;
  }

  input[type="date"].input-field::-webkit-inner-spin-button,
  input[type="time"].input-field::-webkit-inner-spin-button {
    filter: brightness(0) invert(1) !important;
  }

  /* Keep native controls dark while icons stay white */
  input[type="date"],
  input[type="time"],
  select {
    color-scheme: dark;
  }

  /* Prevent horizontal overflow */
  .input-field {
    max-width: 100%;
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
  value: number;
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
    <div className="group min-w-0 rounded-2xl border border-white/10 bg-[#0D1B2A] p-5 shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/20 hover:bg-[#102236]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wider text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {value}
          </p>

          <p className="mt-1 truncate text-xs text-slate-600">
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
  status: SlotStatus;
  className: string;
  icon: ReactNode;
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
        border-white/10
        bg-white/5
        text-white
        transition
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
    <div className="min-w-0 rounded-xl border border-white/5 bg-white/[0.025] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <div className="mt-1 flex min-w-0 items-center gap-1.5">
        {icon}

        <p className="truncate text-xs font-medium text-slate-300">
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
      <label className="mb-2 block text-xs font-medium text-slate-400">
        {label}
      </label>

      {children}
    </div>
  );
}

export default Slots;
