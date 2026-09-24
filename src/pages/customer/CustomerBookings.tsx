import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

/* =========================
   TYPES
========================= */

interface Station {
  id: string;
  stationId?: string;
  stationCode?: string;
  stationName: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  openingTime?: string;
  closingTime?: string;
  status?: string;
}

interface Charger {
  id: string;
  chargerId?: string;
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
  slotId?: string;
  stationId: string;
  chargerId: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
}

interface Vehicle {
  id: string;
  vehicleId?: string;
  customerId?: string;
  userId?: string;
  vehicleNumber: string;
  brand: string;
  model: string;
  batteryCapacity?: number;
  vehicleType?: string;
  connectorType?: string;
  isDefault?: boolean;
}

interface Booking {
  id: string;
  bookingId?: string;
  customerId?: string;
  userId?: string;
  customerName?: string;
  vehicleId: string;
  stationId: string;
  chargerId: string;
  slotId: string;
  bookingDate?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  estimatedDuration?: number;
  estimatedCost?: number;
  status?: string;
  createdDate?: string;
}

interface Activity {
  id: string;
  activityId?: string;
}

type BookingStep =
  | "station"
  | "charger"
  | "date"
  | "slot"
  | "vehicle"
  | "review";

const STEPS: Array<{
  key: BookingStep;
  label: string;
}> = [
  { key: "station", label: "Station" },
  { key: "charger", label: "Charger" },
  { key: "date", label: "Date" },
  { key: "slot", label: "Slot" },
  { key: "vehicle", label: "Vehicle" },
  { key: "review", label: "Review" },
];

/* =========================
   HELPERS
========================= */

function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeDate(value?: string) {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value?: string) {
  const normalized = normalizeDate(value);

  if (!normalized) return "—";

  const [year, month, day] = normalized
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value?: string) {
  if (!value) return "—";

  const parts = value.split(":");

  if (parts.length < 2) return value;

  const hour = Number(parts[0]);
  const minute = Number(parts[1]);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return value;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(
    2,
    "0"
  )} ${period}`;
}

function timeToMinutes(value?: string) {
  if (!value) return 0;

  const [hour, minute] = value
    .split(":")
    .map(Number);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return 0;
  }

  return hour * 60 + minute;
}

function calculateDuration(
  start?: string,
  end?: string
) {
  if (!start || !end) return 0;

  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  if (endMinutes <= startMinutes) {
    return 0;
  }

  return endMinutes - startMinutes;
}

function formatDuration(minutes: number) {
  if (!minutes) return "—";

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (hours === 0) {
    return `${remaining} min`;
  }

  if (remaining === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remaining} min`;
}

function formatAmount(value?: number) {
  return `₹${Number(value || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )}`;
}

function getStatusClasses(status?: string) {
  switch (status) {
    case "Pending":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "Confirmed":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    case "Checked In":
      return "border-violet-400/20 bg-violet-400/10 text-violet-300";

    case "Charging":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";

    case "Completed":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "Cancelled":
    case "No Show":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    default:
      return "border-white/10 bg-white/5 text-slate-300";
  }
}

function createNextId(
  values: string[],
  prefix: string
) {
  const highest = values.reduce(
    (currentHighest, value) => {
      const numericPart = Number(
        value.replace(/\D/g, "")
      );

      if (Number.isNaN(numericPart)) {
        return currentHighest;
      }

      return Math.max(
        currentHighest,
        numericPart
      );
    },
    0
  );

  return `${prefix}${String(
    highest + 1
  ).padStart(3, "0")}`;
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

/* =========================
   COMPONENT
========================= */

export default function CustomerBookings() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const customerId = user?.id || "";
  const today = getToday();

  const [stations, setStations] = useState<
    Station[]
  >([]);

  const [chargers, setChargers] = useState<
    Charger[]
  >([]);

  const [slots, setSlots] = useState<Slot[]>(
    []
  );

  const [vehicles, setVehicles] = useState<
    Vehicle[]
  >([]);

  const [bookings, setBookings] = useState<
    Booking[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [showBookingModal, setShowBookingModal] =
    useState(false);

  const [viewBooking, setViewBooking] =
    useState<Booking | null>(null);

  const [cancelBooking, setCancelBooking] =
    useState<Booking | null>(null);

  const [currentStep, setCurrentStep] =
    useState<BookingStep>("station");

  const [
    selectedStationId,
    setSelectedStationId,
  ] = useState("");

  const [
    selectedChargerId,
    setSelectedChargerId,
  ] = useState("");

  const [selectedDate, setSelectedDate] =
    useState("");

  const [selectedSlotId, setSelectedSlotId] =
    useState("");

  const [
    selectedVehicleId,
    setSelectedVehicleId,
  ] = useState("");

  /* =========================
     DATA
  ========================= */

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
        stationsResponse,
        chargersResponse,
        slotsResponse,
        vehiclesResponse,
        bookingsResponse,
      ] = await Promise.all([
        api.get<Station[]>("/stations"),
        api.get<Charger[]>("/chargers"),
        api.get<Slot[]>("/slots"),
        api.get<Vehicle[]>("/vehicles"),
        api.get<Booking[]>("/bookings"),
      ]);

      setStations(
        stationsResponse.data || []
      );

      setChargers(
        chargersResponse.data || []
      );

      setSlots(slotsResponse.data || []);

      setVehicles(
        (vehiclesResponse.data || []).filter(
          (vehicle) =>
            vehicle.customerId === customerId ||
            vehicle.userId === customerId
        )
      );

      setBookings(
        (bookingsResponse.data || []).filter(
          (booking) =>
            booking.customerId === customerId ||
            booking.userId === customerId
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load booking data. Please make sure JSON Server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [customerId]);

  /* =========================
     POPUP LOCK
  ========================= */

  const popupOpen = Boolean(
    showBookingModal ||
      viewBooking ||
      cancelBooking
  );

  useEffect(() => {
    if (!popupOpen) return;

    const bodyOverflow =
      document.body.style.overflow;

    const htmlOverflow =
      document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        bodyOverflow;

      document.documentElement.style.overflow =
        htmlOverflow;
    };
  }, [popupOpen]);

  /* =========================
     RECORD LOOKUPS
  ========================= */

  const getStation = (value?: string) => {
    if (!value) return undefined;

    return stations.find(
      (station) =>
        station.id === value ||
        station.stationId === value ||
        station.stationCode === value
    );
  };

  const getCharger = (value?: string) => {
    if (!value) return undefined;

    return chargers.find(
      (charger) =>
        charger.id === value ||
        charger.chargerId === value
    );
  };

  const getSlot = (value?: string) => {
    if (!value) return undefined;

    return slots.find(
      (slot) =>
        slot.id === value ||
        slot.slotId === value
    );
  };

  const getVehicle = (value?: string) => {
    if (!value) return undefined;

    return vehicles.find(
      (vehicle) =>
        vehicle.id === value ||
        vehicle.vehicleId === value
    );
  };

  const selectedStation =
    getStation(selectedStationId);

  const selectedCharger =
    getCharger(selectedChargerId);

  const selectedSlot =
    getSlot(selectedSlotId);

  const selectedVehicle =
    getVehicle(selectedVehicleId);

  /* =========================
     STATIONS
  ========================= */

  const availableStations = useMemo(() => {
    return stations.filter(
      (station) => station.status === "Active"
    );
  }, [stations]);

  /* =========================
     CHARGERS
  ========================= */

  const stationChargers = useMemo(() => {
    if (!selectedStation) {
      return [];
    }

    const stationIdentifiers = [
      selectedStation.id,
      selectedStation.stationId,
      selectedStation.stationCode,
    ].filter(
      (value): value is string =>
        Boolean(value)
    );

    return chargers.filter((charger) => {
      const belongsToStation =
        stationIdentifiers.includes(
          charger.stationId
        );

      const allowedStatus =
        charger.status !== "Maintenance" &&
        charger.status !== "Offline";

      return (
        belongsToStation && allowedStatus
      );
    });
  }, [chargers, selectedStation]);

  /* =========================
     DATE SLOTS
  ========================= */

const availableSlots = useMemo(() => {
  if (!selectedCharger || !selectedDate) {
    return [];
  }

  const chargerIdentifiers = [
    selectedCharger.id,
    selectedCharger.chargerId,
  ].filter(
    (value): value is string => Boolean(value)
  );

  const now = new Date();
  const currentMinutes =
    now.getHours() * 60 + now.getMinutes();

  return slots
    .filter((slot) => {
      // Slot must belong to selected charger
      const belongsToCharger =
        chargerIdentifiers.includes(slot.chargerId);

      if (!belongsToCharger) {
        return false;
      }

      // Block slots that are administratively unavailable.
      // "Booked" is allowed here because bookings are
      // date-specific while these records are templates.
      if (
        slot.status === "Blocked" ||
        slot.status === "Cancelled"
      ) {
        return false;
      }

      // For today, don't show a time that has already passed.
      if (
        selectedDate === today &&
        timeToMinutes(slot.startTime) <=
          currentMinutes
      ) {
        return false;
      }

      /*
       * Check whether this charger's time is already
       * booked on the selected date.
       */
      const alreadyBooked = bookings.some(
        (booking) => {
          if (
            booking.status === "Cancelled" ||
            booking.status === "No Show"
          ) {
            return false;
          }

          const bookingDate = normalizeDate(
            booking.bookingDate ||
              booking.date
          );

          if (bookingDate !== selectedDate) {
            return false;
          }

          const sameCharger =
            chargerIdentifiers.includes(
              booking.chargerId
            );

          if (!sameCharger) {
            return false;
          }

          const slotStart = timeToMinutes(
            slot.startTime
          );

          const slotEnd = timeToMinutes(
            slot.endTime
          );

          const bookingStart = timeToMinutes(
            booking.startTime
          );

          const bookingEnd = timeToMinutes(
            booking.endTime
          );

          return (
            slotStart < bookingEnd &&
            slotEnd > bookingStart
          );
        }
      );

      return !alreadyBooked;
    })
    .sort(
      (a, b) =>
        timeToMinutes(a.startTime) -
        timeToMinutes(b.startTime)
    );
}, [
  slots,
  bookings,
  selectedCharger,
  selectedDate,
  today,
]);

  /* =========================
     BOOKING LIST
  ========================= */

  const filteredBookings = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return bookings
      .filter((booking) => {
        const station =
          getStation(booking.stationId);

        const charger =
          getCharger(booking.chargerId);

        const vehicle =
          getVehicle(booking.vehicleId);

        const text = [
          booking.bookingId,
          booking.id,
          station?.stationName,
          station?.stationCode,
          charger?.chargerId,
          charger?.chargerNumber,
          vehicle?.vehicleNumber,
          booking.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !query || text.includes(query);

        const matchesStatus =
          statusFilter === "All" ||
          booking.status === statusFilter;

        return (
          matchesSearch && matchesStatus
        );
      })
      .sort((a, b) => {
        const dateA =
          normalizeDate(
            a.bookingDate || a.date
          );

        const dateB =
          normalizeDate(
            b.bookingDate || b.date
          );

        return dateB.localeCompare(dateA);
      });
  }, [
    bookings,
    search,
    statusFilter,
    stations,
    chargers,
    vehicles,
  ]);

  const activeBookings = bookings.filter(
    (booking) =>
      booking.status === "Pending" ||
      booking.status === "Confirmed" ||
      booking.status === "Checked In" ||
      booking.status === "Charging"
  ).length;

  const completedBookings =
    bookings.filter(
      (booking) =>
        booking.status === "Completed"
    ).length;

  const cancelledBookings =
    bookings.filter(
      (booking) =>
        booking.status === "Cancelled"
    ).length;

  /* =========================
     RESET / OPEN
  ========================= */

  const resetBooking = () => {
    setCurrentStep("station");

    setSelectedStationId("");
    setSelectedChargerId("");
    setSelectedDate("");
    setSelectedSlotId("");

    const defaultVehicle =
      vehicles.find(
        (vehicle) => vehicle.isDefault
      );

    setSelectedVehicleId(
      defaultVehicle?.vehicleId ||
        defaultVehicle?.id ||
        ""
    );

    setError("");
  };

  const openBookingModal = (
    useUrlSelection = false
  ) => {
    setError("");
    setSuccess("");

    const defaultVehicle =
      vehicles.find(
        (vehicle) => vehicle.isDefault
      );

    setSelectedVehicleId(
      defaultVehicle?.vehicleId ||
        defaultVehicle?.id ||
        ""
    );

    setSelectedDate("");
    setSelectedSlotId("");

    if (useUrlSelection) {
      const stationParam =
        searchParams.get("station");

      const chargerParam =
        searchParams.get("charger");

      const station =
        getStation(stationParam || "");

      const charger =
        getCharger(chargerParam || "");

      if (
        station &&
        station.status === "Active"
      ) {
        setSelectedStationId(
          station.stationId ||
            station.id
        );

        if (
          charger &&
          charger.status !==
            "Maintenance" &&
          charger.status !== "Offline"
        ) {
          setSelectedChargerId(
            charger.chargerId ||
              charger.id
          );

          setCurrentStep("date");
        } else {
          setSelectedChargerId("");
          setCurrentStep("charger");
        }
      } else {
        setSelectedStationId("");
        setSelectedChargerId("");
        setCurrentStep("station");
      }
    } else {
      setSelectedStationId("");
      setSelectedChargerId("");
      setCurrentStep("station");
    }

    setShowBookingModal(true);
  };

  /*
   * Open automatically when coming from
   * CustomerStations:
   *
   * /customer/bookings?station=...
   */
  useEffect(() => {
    if (loading) return;

    if (searchParams.get("station")) {
      openBookingModal(true);
    }
    // Intentionally runs after initial data load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  /* =========================
     STEP ACTIONS
  ========================= */

  const selectStation = (
    station: Station
  ) => {
    setError("");

    setSelectedStationId(
      station.stationId || station.id
    );

    setSelectedChargerId("");
    setSelectedDate("");
    setSelectedSlotId("");

    setCurrentStep("charger");
  };

  const selectCharger = (
    charger: Charger
  ) => {
    if (
      charger.status === "Maintenance" ||
      charger.status === "Offline"
    ) {
      setError(
        "This charger cannot be booked."
      );
      return;
    }

    setError("");

    setSelectedChargerId(
      charger.chargerId || charger.id
    );

    setSelectedDate("");
    setSelectedSlotId("");

    setCurrentStep("date");
  };

  const handleDateContinue = () => {
    if (!selectedDate) {
      setError(
        "Please select a booking date."
      );
      return;
    }

    if (selectedDate < today) {
      setError(
        "Past dates cannot be selected."
      );
      return;
    }

    setError("");
    setSelectedSlotId("");
    setCurrentStep("slot");
  };

 const selectSlot = (slot: Slot) => {
  if (
    slot.status === "Blocked" ||
    slot.status === "Cancelled"
  ) {
    setError(
      "This slot is currently unavailable."
    );
    return;
  }

  setError("");

  setSelectedSlotId(
    slot.slotId || slot.id
  );

  setCurrentStep("vehicle");
};

  const selectVehicle = (
    vehicle: Vehicle
  ) => {
    if (
      selectedCharger?.connectorType &&
      vehicle.connectorType &&
      selectedCharger.connectorType !==
        vehicle.connectorType
    ) {
      setError(
        `This vehicle uses ${vehicle.connectorType}, but the selected charger uses ${selectedCharger.connectorType}.`
      );

      return;
    }

    setError("");

    setSelectedVehicleId(
      vehicle.vehicleId || vehicle.id
    );

    setCurrentStep("review");
  };

  /* =========================
     COST
  ========================= */

  const estimatedDuration =
    calculateDuration(
      selectedSlot?.startTime,
      selectedSlot?.endTime
    );

  const estimatedEnergy =
    selectedCharger &&
    estimatedDuration > 0
      ? Number(
          selectedCharger.powerOutput || 0
        ) *
        (estimatedDuration / 60)
      : 0;

  const estimatedCost =
    estimatedEnergy *
    Number(
      selectedCharger?.pricePerKwh || 0
    );

  /* =========================
     ACTIVITY
  ========================= */

  const createActivity = async (
    action: string,
    description: string,
    relatedRecordId: string
  ) => {
    try {
      const response =
        await api.get<Activity[]>(
          "/activities"
        );

      const activityId =
        createNextId(
          (response.data || []).map(
            (activity) =>
              activity.activityId ||
              activity.id
          ),
          "ACT"
        );

      await api.post("/activities", {
        id: activityId,
        activityId,
        userId: customerId,
        userName:
          user?.name || "Customer",
        action,
        description,
        relatedRecordId,
        timestamp:
          new Date().toISOString(),
      });
    } catch (err) {
      console.error(
        "Activity creation failed:",
        err
      );
    }
  };

  /* =========================
     VALIDATION
  ========================= */

  const validateBooking =
    async (): Promise<string> => {
      if (!selectedStation) {
        return "Please select a station.";
      }

      if (selectedStation.status !== "Active") {
        return "The selected station is not active.";
      }

      if (!selectedCharger) {
        return "Please select a charger.";
      }

      if (
        selectedCharger.status === "Maintenance" ||
        selectedCharger.status === "Offline"
      ) {
        return "Maintenance or offline chargers cannot be booked.";
      }

      if (!selectedDate) {
        return "Please select a date.";
      }

      if (selectedDate < today) {
        return "Past dates cannot be booked.";
      }

      if (!selectedSlot) {
        return "Please select a slot.";
      }

      if (!selectedVehicle) {
        return "Please select a vehicle.";
      }

      if (
        selectedVehicle.connectorType &&
        selectedCharger.connectorType &&
        selectedVehicle.connectorType !==
          selectedCharger.connectorType
      ) {
        return "The selected vehicle connector is not compatible with this charger.";
      }

      const [
        slotsResponse,
        bookingsResponse,
        chargersResponse,
      ] = await Promise.all([
        api.get<Slot[]>("/slots"),
        api.get<Booking[]>("/bookings"),
        api.get<Charger[]>("/chargers"),
      ]);

      const latestSlot = slotsResponse.data.find(
        (slot) =>
          slot.id === selectedSlot.id ||
          slot.slotId === selectedSlot.slotId
      );

      if (!latestSlot) {
        return "The selected slot could not be found.";
      }

      const latestCharger = chargersResponse.data.find(
        (charger) =>
          charger.id === selectedCharger.id ||
          charger.chargerId === selectedCharger.chargerId
      );

      if (
        !latestCharger ||
        latestCharger.status === "Maintenance" ||
        latestCharger.status === "Offline"
      ) {
        return "The charger is no longer available.";
      }

      const allBookings = bookingsResponse.data || [];
      const selectedStart = timeToMinutes(
        selectedSlot.startTime
      );
      const selectedEnd = timeToMinutes(
        selectedSlot.endTime
      );

      if (selectedEnd <= selectedStart) {
        return "The selected slot has an invalid time range.";
      }

      const chargerIdentifiers = [
        selectedCharger.id,
        selectedCharger.chargerId,
      ].filter(
        (value): value is string => Boolean(value)
      );

      // The charger/time must be free for everyone on this date.
      const slotAlreadyBooked = allBookings.some(
        (booking) => {
          const bookingDate = normalizeDate(
            booking.bookingDate || booking.date
          );

          if (bookingDate !== selectedDate) {
            return false;
          }

          if (
            booking.status === "Cancelled" ||
            booking.status === "No Show"
          ) {
            return false;
          }

          if (
            !chargerIdentifiers.includes(booking.chargerId)
          ) {
            return false;
          }

          const existingStart = timeToMinutes(
            booking.startTime
          );
          const existingEnd = timeToMinutes(
            booking.endTime
          );

          return (
            selectedStart < existingEnd &&
            selectedEnd > existingStart
          );
        }
      );

      if (slotAlreadyBooked) {
        return "This charging time is already booked for the selected date.";
      }

      // Also prevent this customer from overlapping bookings
      // across different chargers/stations on the same date.
      const customerOverlap = allBookings.some(
        (booking) => {
          const belongsToCustomer =
            booking.customerId === customerId ||
            booking.userId === customerId;

          if (!belongsToCustomer) {
            return false;
          }

          if (
            booking.status === "Cancelled" ||
            booking.status === "Completed" ||
            booking.status === "No Show"
          ) {
            return false;
          }

          const bookingDate = normalizeDate(
            booking.bookingDate || booking.date
          );

          if (bookingDate !== selectedDate) {
            return false;
          }

          const existingStart = timeToMinutes(
            booking.startTime
          );
          const existingEnd = timeToMinutes(
            booking.endTime
          );

          return (
            selectedStart < existingEnd &&
            selectedEnd > existingStart
          );
        }
      );

      if (customerOverlap) {
        return "You already have another booking that overlaps this time.";
      }

      return "";
    };

  /* =========================
     CONFIRM BOOKING
  ========================= */

  const confirmBooking = async () => {
    if (
      !selectedStation ||
      !selectedCharger ||
      !selectedSlot ||
      !selectedVehicle
    ) {
      setError(
        "Complete all booking steps first."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const validationMessage =
        await validateBooking();

      if (validationMessage) {
        setError(validationMessage);
        return;
      }

      const response =
        await api.get<Booking[]>(
          "/bookings"
        );

      const bookingId =
        createNextId(
          (response.data || []).map(
            (booking) =>
              booking.bookingId ||
              booking.id
          ),
          "BK"
        );

      const stationValue =
        selectedStation.stationId ||
        selectedStation.id;

      const chargerValue =
        selectedCharger.chargerId ||
        selectedCharger.id;

      const slotValue =
        selectedSlot.slotId ||
        selectedSlot.id;

      const vehicleValue =
        selectedVehicle.vehicleId ||
        selectedVehicle.id;

      const newBooking = {
        id: bookingId,
        bookingId,
        customerId,
        userId: customerId,
        customerName:
          user?.name || "Customer",

        vehicleId: vehicleValue,

        stationId: stationValue,

        chargerId: chargerValue,

        slotId: slotValue,

        bookingDate: selectedDate,

        date: selectedDate,

        startTime:
          selectedSlot.startTime,

        endTime:
          selectedSlot.endTime,

        estimatedDuration,

        estimatedCost: Number(
          estimatedCost.toFixed(2)
        ),

        status: "Confirmed",

        createdDate:
          new Date().toISOString(),
      };

      await api.post(
        "/bookings",
        newBooking
      );

   await createActivity(
  "Slot Booked",
  `${
    user?.name || "Customer"
  } booked ${
    selectedSlot.slotId ||
    selectedSlot.id
  } at ${selectedStation.stationName}.`,
  bookingId
);

      setShowBookingModal(false);

      setSuccess(
        `Booking ${bookingId} confirmed successfully.`
      );

      resetBooking();

      await fetchData();
    } catch (err) {
      console.error(err);

      setError(
        "Unable to confirm the booking. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     CANCEL BOOKING
  ========================= */

  const canCancel = (
    booking: Booking
  ) =>
    booking.status === "Pending" ||
    booking.status === "Confirmed";

  const handleCancelBooking =
    async () => {
      if (!cancelBooking) return;

      if (
        !canCancel(cancelBooking)
      ) {
        setCancelBooking(null);

        setError(
          "This booking can no longer be cancelled."
        );

        return;
      }

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        await api.patch(
          `/bookings/${cancelBooking.id}`,
          {
            status: "Cancelled",
          }
        );


        await createActivity(
          "Booking Cancelled",
          `${
            user?.name || "Customer"
          } cancelled booking ${
            cancelBooking.bookingId ||
            cancelBooking.id
          }.`,
          cancelBooking.bookingId ||
            cancelBooking.id
        );

        setSuccess(
          `Booking ${
            cancelBooking.bookingId ||
            cancelBooking.id
          } cancelled successfully.`
        );

        setCancelBooking(null);

        await fetchData();
      } catch (err) {
        console.error(err);

        setError(
          "Unable to cancel the booking."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =========================
     STEP ACCESS
  ========================= */

  const canOpenStep = (
    step: BookingStep
  ) => {
    switch (step) {
      case "station":
        return true;

      case "charger":
        return Boolean(
          selectedStation
        );

      case "date":
        return Boolean(
          selectedCharger
        );

      case "slot":
        return Boolean(
          selectedCharger &&
            selectedDate
        );

      case "vehicle":
        return Boolean(
          selectedSlot
        );

      case "review":
        return Boolean(
          selectedStation &&
            selectedCharger &&
            selectedDate &&
            selectedSlot &&
            selectedVehicle
        );

      default:
        return false;
    }
  };

  const currentStepIndex =
    STEPS.findIndex(
      (step) =>
        step.key === currentStep
    );

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-cyan-400" />

          <p className="text-sm text-slate-400">
            Loading bookings...
          </p>
        </div>
      </div>
    );
  }

  /* =========================
     UI
  ========================= */

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* HEADER */}

      <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0D1B2A] via-[#0B1726] to-[#111A35] p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
              Customer Bookings
            </span>

            <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              My Bookings
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Reserve charging slots and manage your
              charging bookings.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                void fetchData()
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white hover:text-black"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                openBookingModal(false)
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 text-sm font-semibold text-[#07111F] transition hover:bg-cyan-300"
            >
              <Plus className="h-4 w-4" />
              New Booking
            </button>
          </div>
        </div>
      </section>

      {/* SUCCESS */}

      {success && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
          <div className="flex gap-3">
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

      {/* ERROR */}

      {error && !showBookingModal && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
          <div className="flex gap-3">
            <XCircle className="h-5 w-5 shrink-0 text-red-300" />

            <p className="text-sm text-red-200">
              {error}
            </p>
          </div>

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

      {/* STATS */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Bookings",
            value: bookings.length,
          },
          {
            label: "Active Bookings",
            value: activeBookings,
          },
          {
            label: "Completed",
            value: completedBookings,
          },
          {
            label: "Cancelled",
            value: cancelledBookings,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/10 bg-[#0D1B2A] p-5"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {item.label}
            </p>

            <p className="mt-2 text-3xl font-bold text-white">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      {/* FILTERS */}

      <section className="rounded-2xl border border-white/10 bg-[#0D1B2A] p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search booking, station, charger or vehicle..."
              className="h-11 w-full rounded-xl border border-white/10 bg-[#07111F] pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="h-11 w-full rounded-xl border border-white/10 bg-[#07111F] px-4 text-sm text-white outline-none"
          >
            <option value="All">
              All Statuses
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Confirmed">
              Confirmed
            </option>

            <option value="Checked In">
              Checked In
            </option>

            <option value="Charging">
              Charging
            </option>

            <option value="Completed">
              Completed
            </option>

            <option value="Cancelled">
              Cancelled
            </option>

            <option value="No Show">
              No Show
            </option>
          </select>
        </div>
      </section>

      {/* BOOKING HISTORY */}

      <section className="rounded-2xl border border-white/10 bg-[#0D1B2A]">
        <div className="border-b border-white/10 p-5">
          <h2 className="font-semibold text-white">
            Booking History
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {filteredBookings.length} booking
            {filteredBookings.length === 1
              ? ""
              : "s"}{" "}
            found
          </p>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="p-8 text-center">
            <CalendarDays className="mx-auto h-9 w-9 text-slate-600" />

            <p className="mt-3 text-sm font-medium text-white">
              No bookings found
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Create a charging reservation to get
              started.
            </p>

            <button
              type="button"
              onClick={() =>
                openBookingModal(false)
              }
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-400 px-4 text-sm font-semibold text-[#07111F]"
            >
              <Plus className="h-4 w-4" />
              Create Booking
            </button>
          </div>
        ) : (
          <>
            {/* DESKTOP */}

            <div className="hidden md:block">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[12%]" />
                  <col className="w-[20%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                  <col className="w-[17%]" />
                  <col className="w-[12%]" />
                  <col className="w-[9%]" />
                </colgroup>

                <thead>
                  <tr className="border-b border-white/10">
                    {[
                      "Booking",
                      "Station",
                      "Vehicle",
                      "Date",
                      "Time",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-3 py-4 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {filteredBookings.map(
                    (booking) => {
                      const station =
                        getStation(
                          booking.stationId
                        );

                      const vehicle =
                        getVehicle(
                          booking.vehicleId
                        );

                      return (
                        <tr
                          key={booking.id}
                          className="transition hover:bg-white/[0.02]"
                        >
                          <td className="px-3 py-5 text-sm font-semibold text-white">
                            {booking.bookingId ||
                              booking.id}
                          </td>

                          <td className="px-3 py-5">
                            <p className="truncate text-sm text-white">
                             {station?.stationName || "—"}
                            </p>
                          </td>

                          <td className="px-3 py-5 text-sm text-slate-300">
                            {vehicle?.vehicleNumber ||
                              "—"}
                          </td>

                          <td className="px-3 py-5 text-sm text-slate-300">
                            {formatDate(
                              booking.bookingDate ||
                                booking.date
                            )}
                          </td>

                          <td className="px-3 py-5 text-sm text-slate-300">
                            {formatTime(
                              booking.startTime
                            )}
                            {" - "}
                            {formatTime(
                              booking.endTime
                            )}
                          </td>

                          <td className="px-3 py-5">
                            <span
                              className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-medium ${getStatusClasses(
                                booking.status
                              )}`}
                            >
                              {booking.status ||
                                "—"}
                            </span>
                          </td>

                          <td className="px-3 py-5">
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                title="View"
                                onClick={() =>
                                  setViewBooking(
                                    booking
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:bg-white hover:text-black"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>

                              {canCancel(
                                booking
                              ) && (
                                <button
                                  type="button"
                                  title="Cancel Booking"
                                  onClick={() =>
                                    setCancelBooking(
                                      booking
                                    )
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-400/20 bg-red-400/10 text-red-300 transition hover:bg-red-400 hover:text-white"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}

            <div className="grid gap-3 p-4 md:hidden">
              {filteredBookings.map(
                (booking) => {
                  const station =
                    getStation(
                      booking.stationId
                    );

                  const vehicle =
                    getVehicle(
                      booking.vehicleId
                    );

                  return (
                    <div
                      key={booking.id}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {booking.bookingId ||
                              booking.id}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {station?.stationName || "—"}
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] ${getStatusClasses(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <DetailItem
                          label="Vehicle"
                          value={
                            vehicle?.vehicleNumber ||
                            "—"
                          }
                        />

                        <DetailItem
                          label="Date"
                          value={formatDate(
                            booking.bookingDate ||
                              booking.date
                          )}
                        />

                        <DetailItem
                          label="Start"
                          value={formatTime(
                            booking.startTime
                          )}
                        />

                        <DetailItem
                          label="End"
                          value={formatTime(
                            booking.endTime
                          )}
                        />
                      </div>

                      <div className="mt-4 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setViewBooking(
                              booking
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {canCancel(
                          booking
                        ) && (
                          <button
                            type="button"
                            onClick={() =>
                              setCancelBooking(
                                booking
                              )
                            }
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/10 px-3 text-xs font-medium text-red-300"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}
      </section>

      {/* =========================
          NEW BOOKING POPUP
      ========================= */}

      {showBookingModal && (
        <div className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center overflow-hidden bg-black/75 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0D1A2A] shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-2rem)]">
            {/* POPUP HEADER */}

            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Book Charging Slot
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Complete each step to reserve your
                  charger.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setShowBookingModal(
                    false
                  );
                  resetBooking();
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:bg-white hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* STEP NAVIGATION */}

            <div className="shrink-0 border-b border-white/10 px-4 py-4 sm:px-6">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {STEPS.map(
                  (step, index) => {
                    const allowed =
                      canOpenStep(step.key);

                    const active =
                      currentStep ===
                      step.key;

                    const completed =
                      index <
                      currentStepIndex;

                    return (
                      <button
                        key={step.key}
                        type="button"
                        disabled={!allowed}
                        onClick={() => {
                          if (!allowed) return;

                          setError("");

                          setCurrentStep(
                            step.key
                          );
                        }}
                        className={`rounded-lg border px-2 py-2 text-center text-[10px] font-medium transition sm:text-xs ${
                          active
                            ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                            : completed
                              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:border-emerald-400/50"
                              : allowed
                                ? "border-white/10 bg-white/[0.02] text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300"
                                : "cursor-not-allowed border-white/5 bg-white/[0.01] text-slate-600"
                        }`}
                      >
                        {completed && (
                          <Check className="mr-1 inline h-3 w-3" />
                        )}

                        {step.label}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* POPUP CONTENT */}

            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              {error && (
                <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
                  <div className="flex gap-3">
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />

                    <p className="text-sm text-red-200">
                      {error}
                    </p>
                  </div>

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

              {/* =====================
                  STATION
              ===================== */}

              {currentStep ===
                "station" && (
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Select Station
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Choose an active charging station.
                  </p>

                  {availableStations.length ===
                  0 ? (
                    <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
                      <MapPin className="mx-auto h-8 w-8 text-slate-600" />

                      <p className="mt-3 text-sm font-medium text-white">
                        No active stations found
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {availableStations.map(
                        (station) => (
                          <button
                            key={station.id}
                            type="button"
                            onClick={() =>
                              selectStation(
                                station
                              )
                            }
                            className="group w-full cursor-pointer rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:border-cyan-400/50 hover:bg-cyan-400/[0.06]"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                                <MapPin className="h-5 w-5 text-cyan-400" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-white">
  {station.stationName}
</p>

                                    <p className="mt-1 text-xs font-medium text-cyan-400">
                                      {station.stationCode ||
                                        station.stationId ||
                                        station.id}
                                    </p>
                                  </div>

                                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300">
                                    Active
                                  </span>
                                </div>

                                <p className="mt-3 text-xs leading-5 text-slate-500">
                                  {[
                                    station.address,
                                    station.city,
                                    station.state,
                                  ]
                                    .filter(
                                      Boolean
                                    )
                                    .join(", ") ||
                                    "Address unavailable"}
                                </p>

                                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                                  <span className="text-xs text-slate-400">
                                    Select station
                                  </span>

                                  <span className="text-lg text-cyan-400 transition group-hover:translate-x-1">
                                    →
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* =====================
                  CHARGER
              ===================== */}

              {currentStep ===
                "charger" && (
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentStep(
                        "station"
                      )
                    }
                    className="mb-4 text-xs font-medium text-cyan-400 hover:text-white"
                  >
                    ← Change Station
                  </button>

                  <h3 className="text-lg font-semibold text-white">
                    Select Charger
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
  {selectedStation?.stationName || "Selected station"}
</p>

                  {stationChargers.length ===
                  0 ? (
                    <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-8 text-center">
                      <Zap className="mx-auto h-8 w-8 text-amber-300" />

                      <p className="mt-3 text-sm font-medium text-white">
                        No bookable chargers found
                      </p>

                      <p className="mt-1 text-xs text-amber-200/70">
                        This station has no charger
                        records available for booking.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {stationChargers.map(
                        (charger) => (
                          <button
                            key={charger.id}
                            type="button"
                            onClick={() =>
                              selectCharger(
                                charger
                              )
                            }
                            className="group w-full cursor-pointer rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:border-cyan-400/50 hover:bg-cyan-400/[0.06]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                                  <Zap className="h-5 w-5 text-cyan-400" />
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-white">
                                    {charger.chargerNumber
                                      ? `Charger ${charger.chargerNumber}`
                                      : charger.chargerId ||
                                        charger.id}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {charger.chargerType ||
                                      "Charger"}
                                    {" • "}
                                    {charger.connectorType ||
                                      "Connector"}
                                  </p>
                                </div>
                              </div>

                              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300">
                                {charger.status ||
                                  "Available"}
                              </span>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                              <DetailItem
                                label="Power"
                                value={`${Number(
                                  charger.powerOutput ||
                                    0
                                )} kW`}
                              />

                              <DetailItem
                                label="Price"
                                value={
                                  charger.pricePerKwh !==
                                  undefined
                                    ? `₹${charger.pricePerKwh}/kWh`
                                    : "Configured"
                                }
                              />
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                              <span className="text-xs text-slate-400">
                                Select charger
                              </span>

                              <span className="text-lg text-cyan-400 transition group-hover:translate-x-1">
                                →
                              </span>
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* =====================
                  DATE
              ===================== */}

              {currentStep ===
                "date" && (
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentStep(
                        "charger"
                      )
                    }
                    className="mb-4 text-xs font-medium text-cyan-400 hover:text-white"
                  >
                    ← Change Charger
                  </button>

                  <h3 className="text-lg font-semibold text-white">
                    Select Booking Date
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Choose today or a future date.
                  </p>

                  <div className="mt-6 max-w-md rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <label>
                      <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                        Booking Date
                      </span>

                      <div className="relative">
                        <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />

                        <input
                          type="date"
                          min={today}
                          value={
                            selectedDate
                          }
                          onChange={(
                            event
                          ) => {
                            setError("");

                            setSelectedDate(
                              event.target
                                .value
                            );

                            setSelectedSlotId(
                              ""
                            );
                          }}
                          className="h-12 w-full rounded-xl border border-white/10 bg-[#07111F] pl-11 pr-4 text-sm text-white outline-none focus:border-cyan-400/50"
                        />
                      </div>
                    </label>

                    {selectedDate && (
                      <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4">
                        <p className="text-xs text-slate-500">
                          Selected Date
                        </p>

                        <p className="mt-1 text-sm font-semibold text-white">
                          {formatDate(
                            selectedDate
                          )}
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={
                        !selectedDate
                      }
                      onClick={
                        handleDateContinue
                      }
                      className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 text-sm font-semibold text-[#07111F] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Continue to Slots
                      <span>→</span>
                    </button>
                  </div>
                </div>
              )}

              {/* =====================
                  SLOT
              ===================== */}

              {currentStep ===
                "slot" && (
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentStep(
                        "date"
                      )
                    }
                    className="mb-4 text-xs font-medium text-cyan-400 hover:text-white"
                  >
                    ← Change Date
                  </button>

                  <h3 className="text-lg font-semibold text-white">
                    Select Slot
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Available slots for{" "}
                    {formatDate(
                      selectedDate
                    )}
                  </p>

                  {availableSlots.length ===
                  0 ? (
                    <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-8 text-center">
                      <Clock3 className="mx-auto h-8 w-8 text-amber-300" />

                      <p className="mt-3 text-sm font-semibold text-white">
                        No available slots
                      </p>

                      <p className="mt-2 text-xs leading-5 text-amber-100/70">
                        There are no available
                        slots for this charger on{" "}
                        {formatDate(
                          selectedDate
                        )}
                        . Choose another date or
                        charger.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setCurrentStep(
                            "date"
                          )
                        }
                        className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-medium text-amber-200"
                      >
                        Choose Another Date
                      </button>
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {availableSlots.map(
                        (slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() =>
                              selectSlot(slot)
                            }
                            className="group rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:border-cyan-400/50 hover:bg-cyan-400/[0.06]"
                          >
                            <div className="flex items-center justify-between">
                              <Clock3 className="h-5 w-5 text-cyan-400" />

                              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300">
                                Available
                              </span>
                            </div>

                            <p className="mt-4 text-sm font-semibold text-white">
                              {formatTime(
                                slot.startTime
                              )}
                              {" - "}
                              {formatTime(
                                slot.endTime
                              )}
                            </p>

                            <p className="mt-2 text-xs text-slate-500">
                              {slot.slotId ||
                                slot.id}
                            </p>

                            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                              <span className="text-xs text-slate-400">
                                Select slot
                              </span>

                              <span className="text-cyan-400">
                                →
                              </span>
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* =====================
                  VEHICLE
              ===================== */}

              {currentStep ===
                "vehicle" && (
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentStep(
                        "slot"
                      )
                    }
                    className="mb-4 text-xs font-medium text-cyan-400 hover:text-white"
                  >
                    ← Change Slot
                  </button>

                  <h3 className="text-lg font-semibold text-white">
                    Select Vehicle
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Choose the vehicle you will
                    charge.
                  </p>

                  {vehicles.length === 0 ? (
                    <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-6">
                      <p className="text-sm font-semibold text-white">
                        No vehicles found
                      </p>

                      <p className="mt-2 text-xs leading-5 text-amber-100/70">
                        Add a vehicle from My
                        Vehicles before creating a
                        charging booking.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {vehicles.map(
                        (vehicle) => {
                          const compatible =
                            !selectedCharger?.connectorType ||
                            !vehicle.connectorType ||
                            selectedCharger.connectorType ===
                              vehicle.connectorType;

                          return (
                            <button
                              key={
                                vehicle.id
                              }
                              type="button"
                              disabled={
                                !compatible
                              }
                              onClick={() =>
                                selectVehicle(
                                  vehicle
                                )
                              }
                              className="group rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:border-cyan-400/50 hover:bg-cyan-400/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-white">
                                    {
                                      vehicle.vehicleNumber
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {
                                      vehicle.brand
                                    }{" "}
                                    {
                                      vehicle.model
                                    }
                                  </p>
                                </div>

                                {vehicle.isDefault && (
                                  <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[10px] text-amber-300">
                                    Default
                                  </span>
                                )}
                              </div>

                              <div className="mt-4 grid grid-cols-2 gap-3">
                                <DetailItem
                                  label="Connector"
                                  value={
                                    vehicle.connectorType ||
                                    "—"
                                  }
                                />

                                <DetailItem
                                  label="Battery"
                                  value={
                                    vehicle.batteryCapacity
                                      ? `${vehicle.batteryCapacity} kWh`
                                      : "—"
                                  }
                                />
                              </div>

                              {!compatible && (
                                <p className="mt-3 text-xs text-red-300">
                                  Not compatible
                                  with the selected
                                  charger.
                                </p>
                              )}

                              {compatible && (
                                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                                  <span className="text-xs text-slate-400">
                                    Select vehicle
                                  </span>

                                  <span className="text-cyan-400">
                                    →
                                  </span>
                                </div>
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* =====================
                  REVIEW
              ===================== */}

              {currentStep ===
                "review" && (
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentStep(
                        "vehicle"
                      )
                    }
                    className="mb-4 text-xs font-medium text-cyan-400 hover:text-white"
                  >
                    ← Change Vehicle
                  </button>

                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                      <CheckCircle2 className="h-5 w-5 text-cyan-400" />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Review Booking
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Verify the details before
                        confirming.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailItem
                      label="Station"
                      value={
                        selectedStation?.stationName ||
                        "—"
                      }
                    />

                    <DetailItem
                      label="Station Code"
                      value={
                        selectedStation?.stationCode ||
                        selectedStation?.stationId ||
                        "—"
                      }
                    />

                    <DetailItem
                      label="Charger"
                      value={
                        selectedCharger?.chargerId ||
                        selectedCharger?.id ||
                        "—"
                      }
                    />

                    <DetailItem
                      label="Charger Type"
                      value={
                        selectedCharger?.chargerType ||
                        "—"
                      }
                    />

                    <DetailItem
                      label="Connector"
                      value={
                        selectedCharger?.connectorType ||
                        "—"
                      }
                    />

                    <DetailItem
                      label="Power"
                      value={`${Number(
                        selectedCharger?.powerOutput ||
                          0
                      )} kW`}
                    />

                    <DetailItem
                      label="Date"
                      value={formatDate(
                        selectedDate
                      )}
                    />

                    <DetailItem
                      label="Time"
                      value={`${formatTime(
                        selectedSlot?.startTime
                      )} - ${formatTime(
                        selectedSlot?.endTime
                      )}`}
                    />

                    <DetailItem
                      label="Duration"
                      value={formatDuration(
                        estimatedDuration
                      )}
                    />

                    <DetailItem
                      label="Vehicle"
                      value={
                        selectedVehicle?.vehicleNumber ||
                        "—"
                      }
                    />

                    <DetailItem
                      label="Price / kWh"
                      value={
                        selectedCharger?.pricePerKwh !==
                        undefined
                          ? `₹${selectedCharger.pricePerKwh}/kWh`
                          : "—"
                      }
                    />

                    <DetailItem
                      label="Estimated Cost"
                      value={formatAmount(
                        estimatedCost
                      )}
                    />
                  </div>

                  <div className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4">
                    <p className="text-xs leading-5 text-slate-300">
                      The estimated cost is for
                      reference. The final charging
                      amount will be based on actual
                      energy consumed × configured
                      price per kWh.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* POPUP FOOTER */}

            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-white/10 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setShowBookingModal(
                    false
                  );

                  resetBooking();
                }}
                className="h-10 rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-medium text-white transition hover:bg-white hover:text-black"
              >
                Close
              </button>

              {currentStep ===
                "review" && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void confirmBooking()
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 text-sm font-semibold text-[#07111F] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}

                  {saving
                    ? "Confirming..."
                    : "Confirm Booking"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================
          VIEW BOOKING POPUP
      ========================= */}

      {viewBooking && (
        <div className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center overflow-hidden bg-black/75 p-3 backdrop-blur-sm">
          <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0D1A2A]">
            <div className="flex items-center justify-between border-b border-white/10 p-4 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Booking Details
                </h2>

                <p className="mt-1 text-xs text-cyan-400">
                  {viewBooking.bookingId ||
                    viewBooking.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewBooking(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs ${getStatusClasses(
                  viewBooking.status
                )}`}
              >
                {viewBooking.status}
              </span>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <DetailItem
  label="Station"
  value={
    getStation(viewBooking.stationId)?.stationName || "—"
  }
/>

                <DetailItem
                  label="Charger"
                  value={
                    getCharger(
                      viewBooking.chargerId
                    )?.chargerId ||
                    viewBooking.chargerId
                  }
                />

                <DetailItem
                  label="Vehicle"
                  value={
                    getVehicle(
                      viewBooking.vehicleId
                    )?.vehicleNumber ||
                    "—"
                  }
                />

                <DetailItem
                  label="Slot"
                  value={
                    viewBooking.slotId
                  }
                />

                <DetailItem
                  label="Date"
                  value={formatDate(
                    viewBooking.bookingDate ||
                      viewBooking.date
                  )}
                />

                <DetailItem
                  label="Time"
                  value={`${formatTime(
                    viewBooking.startTime
                  )} - ${formatTime(
                    viewBooking.endTime
                  )}`}
                />

                <DetailItem
                  label="Duration"
                  value={formatDuration(
                    Number(
                      viewBooking.estimatedDuration ||
                        0
                    )
                  )}
                />

                <DetailItem
                  label="Estimated Cost"
                  value={formatAmount(
                    viewBooking.estimatedCost
                  )}
                />

                <DetailItem
                  label="Created Date"
                  value={formatDate(
                    viewBooking.createdDate
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 p-4 sm:flex-row sm:justify-end sm:px-6">
              {canCancel(
                viewBooking
              ) && (
                <button
                  type="button"
                  onClick={() => {
                    const booking =
                      viewBooking;

                    setViewBooking(null);

                    setCancelBooking(
                      booking
                    );
                  }}
                  className="h-10 rounded-xl border border-red-400/20 bg-red-400/10 px-5 text-sm font-medium text-red-300 transition hover:bg-red-400 hover:text-white"
                >
                  Cancel Booking
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  setViewBooking(null)
                }
                className="h-10 rounded-xl border border-white/10 bg-white/5 px-5 text-sm text-white transition hover:bg-white hover:text-black"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          CANCEL POPUP
      ========================= */}

      {cancelBooking && (
        <div className="fixed inset-0 z-[110] flex h-screen w-screen items-center justify-center overflow-hidden bg-black/75 p-3 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0D1A2A] shadow-2xl">
            <div className="p-5 sm:p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10 text-red-300">
                <XCircle className="h-5 w-5" />
              </div>

              <h2 className="mt-4 text-lg font-semibold text-white">
                Cancel Booking?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Booking{" "}
                <span className="font-semibold text-white">
                  {cancelBooking.bookingId ||
                    cancelBooking.id}
                </span>{" "}
                will be cancelled and that date/time will
                become available again.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 p-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setCancelBooking(null)
                }
                className="h-10 rounded-xl border border-white/10 bg-white/5 px-5 text-sm text-white"
              >
                Keep Booking
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void handleCancelBooking()
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving && (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                )}

                {saving
                  ? "Cancelling..."
                  : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}