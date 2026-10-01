import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

type PaymentStatus =
  | "Pending"
  | "Paid"
  | "Failed"
  | "Refunded";

type PaymentMethod =
  | "Cash"
  | "UPI"
  | "Card"
  | "Wallet";

interface Payment {
  id: string;
  paymentId?: string;
  bookingId?: string;
  sessionId?: string;
  customerId?: string;
  userId?: string;

  amount?: number;
  paymentMethod?: PaymentMethod | string;
  method?: PaymentMethod | string;

  paymentStatus?: PaymentStatus | string;
  status?: PaymentStatus | string;

  transactionId?: string;
  transactionReference?: string;
  referenceId?: string;

  paymentDate?: string;
  date?: string;
  createdAt?: string;
}

interface Booking {
  id: string;
  bookingId?: string;
  customerId?: string;
  userId?: string;
  stationId?: string;
  chargerId?: string;
  vehicleId?: string;
  bookingDate?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
}

interface ChargingSession {
  id: string;
  sessionId?: string;
  bookingId?: string;
  customerId?: string;
  userId?: string;
  stationId?: string;
  chargerId?: string;
  vehicleId?: string;
  energyConsumed?: number;
  totalCost?: number;
  amount?: number;
  status?: string;
}

interface Station {
  id: string;
  stationId?: string;
  stationCode?: string;
  stationName: string;
  city?: string;
  state?: string;
  address?: string;
}

interface Charger {
  id: string;
  chargerId?: string;
  chargerNumber?: string;
  stationId?: string;
  chargerType?: string;
  connectorType?: string;
  powerOutput?: number;
}

interface Vehicle {
  id: string;
  vehicleId?: string;
  customerId?: string;
  userId?: string;
  vehicleNumber?: string;
  brand?: string;
  model?: string;
}

/* ========================================
   HELPERS
======================================== */

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

  const month = String(
    parsed.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    parsed.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value?: string) {
  const normalized =
    normalizeDate(value);

  if (!normalized) return "—";

  const [year, month, day] =
    normalized.split("-").map(Number);

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

function formatDateTime(value?: string) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return formatDate(value);
  }

  return parsed.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function formatAmount(value?: number) {
  return `₹${Number(
    value || 0
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function getStatusClasses(
  status?: string
) {
  switch (status) {
    case "Paid":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "Pending":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "Failed":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    case "Refunded":
      return "border-violet-400/20 bg-violet-400/10 text-violet-700 dark:text-violet-300";

    default:
      return "border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]";
  }
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

/* ========================================
   COMPONENT
======================================== */

export default function CustomerPayments() {
  const { user } = useAuth();

  const customerId =
    user?.id || "";

  const [payments, setPayments] =
    useState<Payment[]>([]);

  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [sessions, setSessions] =
    useState<ChargingSession[]>([]);

  const [stations, setStations] =
    useState<Station[]>([]);

  const [chargers, setChargers] =
    useState<Charger[]>([]);

  const [vehicles, setVehicles] =
    useState<Vehicle[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [
    methodFilter,
    setMethodFilter,
  ] = useState("All");

  const [
    viewPayment,
    setViewPayment,
  ] = useState<Payment | null>(
    null
  );

  /* ========================================
     FETCH
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
        paymentsResponse,
        bookingsResponse,
        sessionsResponse,
        stationsResponse,
        chargersResponse,
        vehiclesResponse,
      ] = await Promise.all([
        api.get<Payment[]>(
          "/payments"
        ),

        api.get<Booking[]>(
          "/bookings"
        ),

        api.get<ChargingSession[]>(
          "/chargingSessions"
        ),

        api.get<Station[]>(
          "/stations"
        ),

        api.get<Charger[]>(
          "/chargers"
        ),

        api.get<Vehicle[]>(
          "/vehicles"
        ),
      ]);

      const allBookings =
        bookingsResponse.data || [];

      const customerBookings =
        allBookings.filter(
          (booking) =>
            booking.customerId ===
              customerId ||
            booking.userId ===
              customerId
        );

      const bookingIdentifiers =
        customerBookings.flatMap(
          (booking) =>
            [
              booking.id,
              booking.bookingId,
            ].filter(
              (
                value
              ): value is string =>
                Boolean(value)
            )
        );

      const allSessions =
        sessionsResponse.data || [];

      const customerSessions =
        allSessions.filter(
          (session) => {
            const directMatch =
              session.customerId ===
                customerId ||
              session.userId ===
                customerId;

            const bookingMatch =
              Boolean(
                session.bookingId
              ) &&
              bookingIdentifiers.includes(
                session.bookingId as string
              );

            return (
              directMatch ||
              bookingMatch
            );
          }
        );

      const sessionIdentifiers =
        customerSessions.flatMap(
          (session) =>
            [
              session.id,
              session.sessionId,
            ].filter(
              (
                value
              ): value is string =>
                Boolean(value)
            )
        );

      const customerPayments = (
        paymentsResponse.data || []
      ).filter((payment) => {
        const directMatch =
          payment.customerId ===
            customerId ||
          payment.userId ===
            customerId;

        const bookingMatch =
          Boolean(
            payment.bookingId
          ) &&
          bookingIdentifiers.includes(
            payment.bookingId as string
          );

        const sessionMatch =
          Boolean(
            payment.sessionId
          ) &&
          sessionIdentifiers.includes(
            payment.sessionId as string
          );

        return (
          directMatch ||
          bookingMatch ||
          sessionMatch
        );
      });

      setPayments(customerPayments);
      setBookings(customerBookings);
      setSessions(customerSessions);

      setStations(
        stationsResponse.data || []
      );

      setChargers(
        chargersResponse.data || []
      );

      setVehicles(
        (
          vehiclesResponse.data || []
        ).filter(
          (vehicle) =>
            vehicle.customerId ===
              customerId ||
            vehicle.userId ===
              customerId
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load payments. Please make sure JSON Server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [customerId]);

  /* ========================================
     MODAL BACKGROUND LOCK
  ======================================== */

  useEffect(() => {
    if (!viewPayment) return;

    const bodyOverflow =
      document.body.style.overflow;

    const htmlOverflow =
      document.documentElement.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    document.documentElement.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        bodyOverflow;

      document.documentElement.style.overflow =
        htmlOverflow;
    };
  }, [viewPayment]);

  /* ========================================
     LOOKUPS
  ======================================== */

  const getBooking = (
    value?: string
  ) => {
    if (!value) return undefined;

    return bookings.find(
      (booking) =>
        booking.id === value ||
        booking.bookingId === value
    );
  };

  const getSession = (
    value?: string
  ) => {
    if (!value) return undefined;

    return sessions.find(
      (session) =>
        session.id === value ||
        session.sessionId === value
    );
  };

  const getStation = (
    value?: string
  ) => {
    if (!value) return undefined;

    return stations.find(
      (station) =>
        station.id === value ||
        station.stationId === value ||
        station.stationCode === value
    );
  };

  const getCharger = (
    value?: string
  ) => {
    if (!value) return undefined;

    return chargers.find(
      (charger) =>
        charger.id === value ||
        charger.chargerId === value
    );
  };

  const getVehicle = (
    value?: string
  ) => {
    if (!value) return undefined;

    return vehicles.find(
      (vehicle) =>
        vehicle.id === value ||
        vehicle.vehicleId === value
    );
  };

  const resolveBooking = (
    payment: Payment
  ) => {
    if (payment.bookingId) {
      const booking = getBooking(
        payment.bookingId
      );

      if (booking) return booking;
    }

    const session = getSession(
      payment.sessionId
    );

    if (!session?.bookingId) {
      return undefined;
    }

    return getBooking(
      session.bookingId
    );
  };

  const resolveSession = (
    payment: Payment
  ) => {
    if (payment.sessionId) {
      const session = getSession(
        payment.sessionId
      );

      if (session) return session;
    }

    const booking =
      resolveBooking(payment);

    if (!booking) {
      return undefined;
    }

    return sessions.find(
      (session) =>
        session.bookingId ===
          booking.id ||
        session.bookingId ===
          booking.bookingId
    );
  };

  const resolveStation = (
    payment: Payment
  ) => {
    const booking =
      resolveBooking(payment);

    const session =
      resolveSession(payment);

    return getStation(
      booking?.stationId ||
        session?.stationId
    );
  };

  const resolveCharger = (
    payment: Payment
  ) => {
    const booking =
      resolveBooking(payment);

    const session =
      resolveSession(payment);

    return getCharger(
      booking?.chargerId ||
        session?.chargerId
    );
  };

  const resolveVehicle = (
    payment: Payment
  ) => {
    const booking =
      resolveBooking(payment);

    const session =
      resolveSession(payment);

    return getVehicle(
      booking?.vehicleId ||
        session?.vehicleId
    );
  };

  const getPaymentStatus = (
    payment: Payment
  ) =>
    payment.paymentStatus ||
    payment.status ||
    "Pending";

  const getPaymentMethod = (
    payment: Payment
  ) =>
    payment.paymentMethod ||
    payment.method ||
    "—";

  const getPaymentDate = (
    payment: Payment
  ) =>
    payment.paymentDate ||
    payment.date ||
    payment.createdAt ||
    "";

  const getReference = (
    payment: Payment
  ) =>
    payment.transactionId ||
    payment.transactionReference ||
    payment.referenceId ||
    "—";

  /* ========================================
     FILTER
  ======================================== */

  const filteredPayments =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      return payments
        .filter((payment) => {
          const booking =
            resolveBooking(payment);

          const session =
            resolveSession(payment);

          const station =
            resolveStation(payment);

          const charger =
            resolveCharger(payment);

          const vehicle =
            resolveVehicle(payment);

          const paymentStatus =
            getPaymentStatus(
              payment
            );

          const paymentMethod =
            getPaymentMethod(
              payment
            );

          const text = [
            payment.id,
            payment.paymentId,
            payment.bookingId,
            payment.sessionId,
            booking?.bookingId,
            session?.sessionId,
            station?.stationName,
            station?.stationCode,
            charger?.chargerId,
            charger?.chargerNumber,
            vehicle?.vehicleNumber,
            paymentStatus,
            paymentMethod,
            getReference(payment),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !query ||
            text.includes(query);

          const matchesStatus =
            statusFilter === "All" ||
            paymentStatus ===
              statusFilter;

          const matchesMethod =
            methodFilter === "All" ||
            paymentMethod ===
              methodFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesMethod
          );
        })
        .sort((a, b) => {
          const dateA =
            new Date(
              getPaymentDate(a) || 0
            ).getTime();

          const dateB =
            new Date(
              getPaymentDate(b) || 0
            ).getTime();

          return dateB - dateA;
        });
    }, [
      payments,
      bookings,
      sessions,
      stations,
      chargers,
      vehicles,
      search,
      statusFilter,
      methodFilter,
    ]);

  /* ========================================
     STATS
  ======================================== */

  const paidPayments =
    payments.filter(
      (payment) =>
        getPaymentStatus(
          payment
        ) === "Paid"
    );

  const pendingPayments =
    payments.filter(
      (payment) =>
        getPaymentStatus(
          payment
        ) === "Pending"
    );

  const refundedPayments =
    payments.filter(
      (payment) =>
        getPaymentStatus(
          payment
        ) === "Refunded"
    );

  const failedPayments =
    payments.filter(
      (payment) =>
        getPaymentStatus(
          payment
        ) === "Failed"
    );

  const totalPaid =
    paidPayments.reduce(
      (total, payment) =>
        total +
        Number(
          payment.amount || 0
        ),
      0
    );

  const totalPending =
    pendingPayments.reduce(
      (total, payment) =>
        total +
        Number(
          payment.amount || 0
        ),
      0
    );

  const totalRefunded =
    refundedPayments.reduce(
      (total, payment) =>
        total +
        Number(
          payment.amount || 0
        ),
      0
    );

  /* ========================================
     LOADING
  ======================================== */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-cyan-400" />

          <p className="text-sm text-[var(--text-secondary)]">
            Loading payments...
          </p>
        </div>
      </div>
    );
  }

  /* ========================================
     UI
  ======================================== */

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* HEADER */}

      <section className="customer-payments-banner rounded-2xl border border-[var(--border-primary)] bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
              Customer Portal
            </span>

            <h1 className="mt-3 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
              Payments
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
              View your charging
              payments, transaction
              details and payment
              history.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void fetchData()
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white hover:text-black"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      {/* ERROR */}

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
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

      {/* STATS */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* PAID */}

        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                Amount Paid
              </p>

              <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
                {formatAmount(
                  totalPaid
                )}
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {paidPayments.length}{" "}
                successful
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            </div>
          </div>
        </div>

        {/* PENDING */}

        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                Pending
              </p>

              <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
                {formatAmount(
                  totalPending
                )}
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {
                  pendingPayments.length
                }{" "}
                payment
                {pendingPayments.length ===
                1
                  ? ""
                  : "s"}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10">
              <Clock3 className="h-5 w-5 text-amber-300" />
            </div>
          </div>
        </div>

        {/* REFUNDED */}

        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                Refunded
              </p>

              <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
                {formatAmount(
                  totalRefunded
                )}
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {
                  refundedPayments.length
                }{" "}
                refunded
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-400/10">
              <RotateCcw className="h-5 w-5 text-violet-300" />
            </div>
          </div>
        </div>

        {/* TOTAL */}

        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                Total Payments
              </p>

              <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
                {payments.length}
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {
                  failedPayments.length
                }{" "}
                failed
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10">
              <ReceiptText className="h-5 w-5 text-cyan-300" />
            </div>
          </div>
        </div>
      </section>

      {/* FILTERS */}

      <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_190px_190px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-primary)]" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search payment, station, booking or transaction..."
              className="customer-payments-input h-11 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] pl-11 pr-4 text-sm text-[var(--input-text)] outline-none placeholder:text-[var(--text-muted)] focus:border-cyan-400/50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="customer-payments-input customer-payments-select h-11 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-4 text-sm text-[var(--input-text)] outline-none"
          >
            <option value="All">
              All Statuses
            </option>

            <option value="Paid">
              Paid
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Failed">
              Failed
            </option>

            <option value="Refunded">
              Refunded
            </option>
          </select>

          <select
            value={methodFilter}
            onChange={(event) =>
              setMethodFilter(
                event.target.value
              )
            }
            className="customer-payments-input customer-payments-select h-11 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-4 text-sm text-[var(--input-text)] outline-none"
          >
            <option value="All">
              All Methods
            </option>

            <option value="UPI">
              UPI
            </option>

            <option value="Card">
              Card
            </option>

            <option value="Wallet">
              Wallet
            </option>

            <option value="Cash">
              Cash
            </option>
          </select>
        </div>
      </section>

      {/* PAYMENT HISTORY */}

      <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)]">
        <div className="border-b border-[var(--border-primary)] p-5">
          <h2 className="font-semibold text-[var(--text-primary)]">
            Payment History
          </h2>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {filteredPayments.length}{" "}
            payment
            {filteredPayments.length ===
            1
              ? ""
              : "s"}{" "}
            found
          </p>
        </div>

        {filteredPayments.length ===
        0 ? (
          <div className="p-10 text-center">
            <CreditCard className="mx-auto h-10 w-10 text-[var(--text-muted)]" />

            <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
              No payments found
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Your charging payment
              history will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP */}

            <div className="hidden md:block">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[15%]" />
                  <col className="w-[19%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[10%]" />
                  <col className="w-[12%]" />
                  <col className="w-[8%]" />
                  <col className="w-[5%]" />
                </colgroup>

                <thead>
                  <tr className="border-b border-[var(--border-primary)]">
                    {[
                      "Payment",
                      "Station",
                      "Date",
                      "Method",
                      "Amount",
                      "Status",
                      "Reference",
                      "",
                    ].map(
                      (
                        heading,
                        index
                      ) => (
                        <th
                          key={`${heading}-${index}`}
                          className="px-3 py-4 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]"
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {filteredPayments.map(
                    (payment) => {
                      const station =
                        resolveStation(
                          payment
                        );

                      const status =
                        getPaymentStatus(
                          payment
                        );

                      return (
                        <tr
                          key={payment.id}
                          className="transition hover:bg-[var(--bg-tertiary)]"
                        >
                          <td className="px-3 py-5">
                            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                              {payment.paymentId ||
                                payment.id}
                            </p>

                            <p className="mt-1 truncate text-[10px] text-[var(--text-muted)]">
                              {payment.bookingId ||
                                payment.sessionId ||
                                "—"}
                            </p>
                          </td>

                          <td className="px-3 py-5">
                            <p className="truncate text-sm text-[var(--text-primary)]">
                              {station?.stationName ||
                                "—"}
                            </p>
                          </td>

                          <td className="px-3 py-5 text-sm text-[var(--text-secondary)]">
                            {formatDate(
                              getPaymentDate(
                                payment
                              )
                            )}
                          </td>

                          <td className="px-3 py-5 text-sm text-[var(--text-secondary)]">
                            {getPaymentMethod(
                              payment
                            )}
                          </td>

                          <td className="px-3 py-5 text-sm font-semibold text-[var(--text-primary)]">
                            {formatAmount(
                              payment.amount
                            )}
                          </td>

                          <td className="px-3 py-5">
                            <span
                              className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-medium ${getStatusClasses(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                          </td>

                          <td className="px-3 py-5">
                            <p className="truncate text-xs text-[var(--text-secondary)]">
                              {getReference(
                                payment
                              )}
                            </p>
                          </td>

                          <td className="px-3 py-5">
                            <button
                              type="button"
                              title="View Payment"
                              onClick={() =>
                                setViewPayment(
                                  payment
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition hover:bg-white hover:text-black"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
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
              {filteredPayments.map(
                (payment) => {
                  const station =
                    resolveStation(
                      payment
                    );

                  const status =
                    getPaymentStatus(
                      payment
                    );

                  return (
                    <div
                      key={payment.id}
                      className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                            {payment.paymentId ||
                              payment.id}
                          </p>

                          <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                            {station?.stationName ||
                              "—"}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-2 py-1 text-[10px] ${getStatusClasses(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <DetailItem
                          label="Amount"
                          value={formatAmount(
                            payment.amount
                          )}
                        />

                        <DetailItem
                          label="Method"
                          value={getPaymentMethod(
                            payment
                          )}
                        />

                        <DetailItem
                          label="Date"
                          value={formatDate(
                            getPaymentDate(
                              payment
                            )
                          )}
                        />

                        <DetailItem
                          label="Reference"
                          value={getReference(
                            payment
                          )}
                        />
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setViewPayment(
                              payment
                            )
                          }
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 text-xs font-medium text-[var(--text-primary)] transition hover:bg-white hover:text-black"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}
      </section>

      {/* ========================================
          VIEW PAYMENT MODAL
      ======================================== */}

      {viewPayment && (
        <div className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center overflow-hidden bg-black/75 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-2rem)]">
            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--border-primary)] px-4 py-4 sm:px-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">
                  Payment Details
                </p>

                <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                  {viewPayment.paymentId ||
                    viewPayment.id}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewPayment(null)
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition hover:bg-white hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* BODY */}

            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              {(() => {
                const booking =
                  resolveBooking(
                    viewPayment
                  );

                const session =
                  resolveSession(
                    viewPayment
                  );

                const station =
                  resolveStation(
                    viewPayment
                  );

                const charger =
                  resolveCharger(
                    viewPayment
                  );

                const vehicle =
                  resolveVehicle(
                    viewPayment
                  );

                const status =
                  getPaymentStatus(
                    viewPayment
                  );

                return (
                  <div className="space-y-5">
                    {/* PAYMENT STATUS */}

                    <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">
                          Payment Status
                        </p>

                        <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
                          {formatAmount(
                            viewPayment.amount
                          )}
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusClasses(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </div>

                    {/* PAYMENT INFORMATION */}

                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                        Payment Information
                      </h3>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <DetailItem
                          label="Payment ID"
                          value={
                            viewPayment.paymentId ||
                            viewPayment.id
                          }
                        />

                        <DetailItem
                          label="Amount"
                          value={formatAmount(
                            viewPayment.amount
                          )}
                        />

                        <DetailItem
                          label="Status"
                          value={status}
                        />

                        <DetailItem
                          label="Payment Method"
                          value={getPaymentMethod(
                            viewPayment
                          )}
                        />

                        <DetailItem
                          label="Payment Date"
                          value={formatDateTime(
                            getPaymentDate(
                              viewPayment
                            )
                          )}
                        />

                        <DetailItem
                          label="Transaction Reference"
                          value={getReference(
                            viewPayment
                          )}
                        />
                      </div>
                    </div>

                    {/* BOOKING / SESSION */}

                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                        Booking & Session
                      </h3>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <DetailItem
                          label="Booking ID"
                          value={
                            booking?.bookingId ||
                            booking?.id ||
                            viewPayment.bookingId ||
                            "—"
                          }
                        />

                        <DetailItem
                          label="Session ID"
                          value={
                            session?.sessionId ||
                            session?.id ||
                            viewPayment.sessionId ||
                            "—"
                          }
                        />

                        <DetailItem
                          label="Session Status"
                          value={
                            session?.status ||
                            "—"
                          }
                        />

                        <DetailItem
                          label="Energy Consumed"
                          value={
                            session?.energyConsumed !==
                            undefined
                              ? `${Number(
                                  session.energyConsumed
                                ).toFixed(
                                  2
                                )} kWh`
                              : "—"
                          }
                        />

                        <DetailItem
                          label="Booking Date"
                          value={formatDate(
                            booking?.bookingDate ||
                              booking?.date
                          )}
                        />

                        <DetailItem
                          label="Booking Status"
                          value={
                            booking?.status ||
                            "—"
                          }
                        />
                      </div>
                    </div>

                    {/* LOCATION */}

                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                        Charging Location
                      </h3>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <DetailItem
                          label="Station"
                          value={
                            station?.stationName ||
                            "—"
                          }
                        />

                        <DetailItem
                          label="Station Code"
                          value={
                            station?.stationCode ||
                            "—"
                          }
                        />

                        <DetailItem
                          label="City"
                          value={
                            station?.city ||
                            "—"
                          }
                        />

                        <DetailItem
                          label="Charger"
                          value={
                            charger?.chargerNumber ||
                            charger?.chargerId ||
                            charger?.id ||
                            "—"
                          }
                        />

                        <DetailItem
                          label="Charger Type"
                          value={
                            charger?.chargerType ||
                            "—"
                          }
                        />

                        <DetailItem
                          label="Connector"
                          value={
                            charger?.connectorType ||
                            "—"
                          }
                        />
                      </div>
                    </div>

                    {/* VEHICLE */}

                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                        Vehicle
                      </h3>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <DetailItem
                          label="Vehicle Number"
                          value={
                            vehicle?.vehicleNumber ||
                            "—"
                          }
                        />

                        <DetailItem
                          label="Brand"
                          value={
                            vehicle?.brand ||
                            "—"
                          }
                        />

                        <DetailItem
                          label="Model"
                          value={
                            vehicle?.model ||
                            "—"
                          }
                        />
                      </div>
                    </div>

                    {/* FAILED MESSAGE */}

                    {status ===
                      "Failed" && (
                      <div className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />

                        <div>
                          <p className="text-sm font-medium text-red-200">
                            Payment Failed
                          </p>

                          <p className="mt-1 text-xs leading-5 text-red-200/70">
                            This payment
                            was not
                            completed
                            successfully.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* FOOTER */}

            <div className="flex shrink-0 justify-end border-t border-[var(--border-primary)] px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={() =>
                  setViewPayment(null)
                }
                className="h-10 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white hover:text-black"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .customer-payments-banner {
          background: #ffffff;
        }

        html.dark .customer-payments-banner {
          background: linear-gradient(
            135deg,
            #0D1B2A 0%,
            #0B1726 50%,
            #111A35 100%
          );
        }

        .customer-payments-input {
          color: var(--input-text);
          background: var(--input-bg);
        }

        .customer-payments-input::placeholder {
          color: var(--text-muted);
        }

        .customer-payments-select {
          color-scheme: light;
        }

        .customer-payments-select option {
          background: #ffffff;
          color: #000000;
        }

        html.dark .customer-payments-select {
          color-scheme: dark;
        }

        html.dark .customer-payments-select option {
          background: #0D1B2A;
          color: #ffffff;
        }
      `}</style>

    </div>
  );
}