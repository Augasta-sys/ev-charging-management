import type { ElementType, ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  IndianRupee,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

/* =========================================================
   TYPES
========================================================= */

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
  paymentId: string;
  bookingId?: string;
  userId?: string;
  customerId?: string;
  stationId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  paymentDate?: string;
  transactionId?: string;
  createdDate?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Station {
  id: string;
  stationId: string;
  stationName: string;
  city: string;
}

/* =========================================================
   CONSTANTS
========================================================= */

const paymentStatuses: PaymentStatus[] = [
  "Pending",
  "Paid",
  "Failed",
  "Refunded",
];

const paymentMethods: PaymentMethod[] = [
  "Cash",
  "UPI",
  "Card",
  "Wallet",
];

/* =========================================================
   COMPONENT
========================================================= */

function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stations, setStations] = useState<Station[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [viewPayment, setViewPayment] =
    useState<Payment | null>(null);

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
    const modalOpen = Boolean(viewPayment || deleteId);

    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [viewPayment, deleteId]);

  /* =======================================================
     FETCH DATA
  ======================================================= */

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        paymentsResponse,
        usersResponse,
        stationsResponse,
      ] = await Promise.all([
        api.get("/payments"),
        api.get("/users"),
        api.get("/stations"),
      ]);

      setPayments(paymentsResponse.data);
      setUsers(usersResponse.data);
      setStations(stationsResponse.data);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load payment data. Please make sure JSON Server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     HELPERS
  ======================================================= */

  const getUser = (payment: Payment) => {
    const userId =
      payment.userId ?? payment.customerId;

    if (!userId) {
      return undefined;
    }

    return users.find(
      (user) =>
        user.id === userId ||
        user.id === String(userId)
    );
  };

  const getCustomerName = (
    payment: Payment
  ) => {
    return (
      getUser(payment)?.name ??
      "Unknown Customer"
    );
  };

  const getCustomerEmail = (
    payment: Payment
  ) => {
    return getUser(payment)?.email ?? "";
  };

  const getStation = (
    stationId?: string
  ) => {
    if (!stationId) {
      return undefined;
    }

    return stations.find(
      (station) =>
        station.stationId === stationId ||
        station.id === stationId
    );
  };

  const getStationName = (
    stationId?: string
  ) => {
    return (
      getStation(stationId)?.stationName ??
      stationId ??
      "Unknown Station"
    );
  };

  const getStationCity = (
    stationId?: string
  ) => {
    return getStation(stationId)?.city ?? "";
  };

  const formatDate = (
    date?: string
  ) => {
    if (!date) {
      return "—";
    }

    const parsed = new Date(
      `${date}T00:00:00`
    );

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* =======================================================
     STATISTICS
  ======================================================= */

  const stats = useMemo(() => {
    const paidPayments = payments.filter(
      (payment) =>
        payment.status === "Paid"
    );

    const pendingPayments = payments.filter(
      (payment) =>
        payment.status === "Pending"
    );

    const failedPayments = payments.filter(
      (payment) =>
        payment.status === "Failed"
    );

    const refundedPayments = payments.filter(
      (payment) =>
        payment.status === "Refunded"
    );

    const totalRevenue =
      paidPayments.reduce(
        (sum, payment) =>
          sum + Number(payment.amount || 0),
        0
      );

    const refundedAmount =
      refundedPayments.reduce(
        (sum, payment) =>
          sum + Number(payment.amount || 0),
        0
      );

    const today = new Date()
      .toISOString()
      .split("T")[0];

    const todayRevenue =
      paidPayments
        .filter(
          (payment) =>
            payment.paymentDate === today
        )
        .reduce(
          (sum, payment) =>
            sum + Number(payment.amount || 0),
          0
        );

    return {
      total: payments.length,
      paid: paidPayments.length,
      pending: pendingPayments.length,
      failed: failedPayments.length,
      refunded: refundedPayments.length,
      revenue: totalRevenue,
      todayRevenue,
      refundedAmount,
    };
  }, [payments]);

  /* =======================================================
     FILTERED PAYMENTS
  ======================================================= */

  const filteredPayments = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return payments
      .filter((payment) => {
        const customer =
          getCustomerName(payment)
            .toLowerCase();

        const email =
          getCustomerEmail(payment)
            .toLowerCase();

        const station =
          getStationName(
            payment.stationId
          ).toLowerCase();

        const paymentId =
          payment.paymentId.toLowerCase();

        const bookingId =
          payment.bookingId
            ?.toLowerCase() ?? "";

        const transactionId =
          payment.transactionId
            ?.toLowerCase() ?? "";

        const matchesSearch =
          !query ||
          paymentId.includes(query) ||
          bookingId.includes(query) ||
          customer.includes(query) ||
          email.includes(query) ||
          station.includes(query) ||
          transactionId.includes(query);

        const matchesStation =
          !stationFilter ||
          payment.stationId ===
            stationFilter;

        const matchesStatus =
          !statusFilter ||
          payment.status ===
            statusFilter;

        const matchesMethod =
          !methodFilter ||
          payment.paymentMethod ===
            methodFilter;

        const matchesDate =
          !dateFilter ||
          payment.paymentDate ===
            dateFilter;

        return (
          matchesSearch &&
          matchesStation &&
          matchesStatus &&
          matchesMethod &&
          matchesDate
        );
      })
      .sort((a, b) =>
        `${b.paymentDate ?? ""}`.localeCompare(
          `${a.paymentDate ?? ""}`
        )
      );
  }, [
    payments,
    users,
    stations,
    search,
    stationFilter,
    statusFilter,
    methodFilter,
    dateFilter,
  ]);

  /* =======================================================
     UPDATE PAYMENT STATUS
  ======================================================= */

  const handleStatusChange = async (
    payment: Payment,
    status: PaymentStatus
  ) => {
    try {
      setError("");

      const response =
        await api.patch<Payment>(
          `/payments/${payment.id}`,
          {
            status,
          }
        );

      setPayments((previous) =>
        previous.map((item) =>
          item.id === payment.id
            ? response.data
            : item
        )
      );

      setSuccess(
        `${payment.paymentId} is now ${status}.`
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to update payment status."
      );
    }
  };

  /* =======================================================
     DELETE PAYMENT
  ======================================================= */

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/payments/${deleteId}`
      );

      setPayments((previous) =>
        previous.filter(
          (item) =>
            item.id !== deleteId
        )
      );

      setDeleteId(null);

      setSuccess(
        "Payment deleted successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to delete payment."
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
    setMethodFilter("");
    setDateFilter("");
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
            <CreditCard className="h-6 w-6 animate-pulse text-cyan-400" />
          </div>

          <p className="text-sm text-slate-400">
            Loading payments...
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

      {/* HEADER */}

      <div className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
            <CreditCard className="h-4 w-4 !text-white" />
            Payment Management
          </div>

          <h1 className="truncate text-2xl font-bold text-white sm:text-3xl">
            Payments
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage customer payments and transaction records.
          </p>
        </div>
      </div>

      {/* ALERTS */}

      {error && (
        <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {/* STATS */}

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total Payments"
          value={stats.total}
          description="All payment records"
          icon={CreditCard}
          iconClass="text-cyan-400"
          iconBg="bg-cyan-400/10"
        />

        <StatCard
          title="Paid Payments"
          value={stats.paid}
          description="Successfully completed"
          icon={CheckCircle2}
          iconClass="text-emerald-400"
          iconBg="bg-emerald-400/10"
        />

        <StatCard
          title="Pending Payments"
          value={stats.pending}
          description="Awaiting payment"
          icon={Clock3}
          iconClass="text-amber-400"
          iconBg="bg-amber-400/10"
        />

        <StatCard
          title="Total Revenue"
          value={`₹${stats.revenue.toFixed(2)}`}
          description="Paid transaction value"
          icon={IndianRupee}
          iconClass="text-violet-400"
          iconBg="bg-violet-400/10"
        />

      </div>

      {/* SECONDARY STATS */}

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

        <StatCard
          title="Today's Revenue"
          value={`₹${stats.todayRevenue.toFixed(2)}`}
          description="Paid today"
          icon={CalendarDays}
          iconClass="text-cyan-400"
          iconBg="bg-cyan-400/10"
        />

        <StatCard
          title="Failed Payments"
          value={stats.failed}
          description="Payment attempts failed"
          icon={X}
          iconClass="text-red-400"
          iconBg="bg-red-400/10"
        />

        <StatCard
          title="Refunded Amount"
          value={`₹${stats.refundedAmount.toFixed(2)}`}
          description={`${stats.refunded} refunded payments`}
          icon={IndianRupee}
          iconClass="text-orange-400"
          iconBg="bg-orange-400/10"
        />

      </div>

      {/* SEARCH & FILTERS */}

      <section className="mt-6 rounded-2xl border border-white/10 bg-[#0D1B2A] p-4 sm:p-5">

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-sm font-semibold text-white">
              Search & Filters
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Find payments by customer, booking, station or transaction.
            </p>
          </div>

          {(search ||
            stationFilter ||
            statusFilter ||
            methodFilter ||
            dateFilter) && (
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

        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-5">

          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 !text-white" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search payments..."
              className="input-field !pl-11"
            />
          </div>

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

          <select
            value={methodFilter}
            onChange={(event) =>
              setMethodFilter(
                event.target.value
              )
            }
            className="input-field"
          >
            <option value="">
              All Methods
            </option>

            {paymentMethods.map(
              (method) => (
                <option
                  key={method}
                  value={method}
                >
                  {method}
                </option>
              )
            )}
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(
                event.target.value
              )
            }
            className="input-field"
          />

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

            {paymentStatuses.map(
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

        </div>
      </section>

      {/* RESULT COUNT */}

      <div className="mt-4">
        <p className="text-xs text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-300">
            {filteredPayments.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-300">
            {payments.length}
          </span>{" "}
          payments
        </p>
      </div>

      {/* DESKTOP TABLE */}

      <div className="mt-4 hidden w-full min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0D1B2A] lg:block">

        <table className="w-full table-fixed border-collapse">

          <colgroup>
            <col className="w-[12%]" />
            <col className="w-[15%]" />
            <col className="w-[18%]" />
            <col className="w-[14%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[19%]" />
          </colgroup>

          <thead>
            <tr className="border-b border-white/10 text-left">

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500 xl:px-4">
                Payment ID
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500 xl:px-4">
                Booking
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500 xl:px-4">
                Customer
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500 xl:px-4">
                Station
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500 xl:px-4">
                Amount
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500 xl:px-4">
                Status
              </th>

              <th className="px-3 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500 xl:px-4">
                Actions
              </th>

            </tr>
          </thead>

          <tbody>

            {filteredPayments.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-16 text-center"
                >
                  <CreditCard className="mx-auto h-8 w-8 text-slate-600" />

                  <p className="mt-3 text-sm font-medium text-slate-400">
                    No payments found
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Try changing your search or filters.
                  </p>
                </td>
              </tr>
            ) : (
              filteredPayments.map(
                (payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-white/5 last:border-b-0 transition-colors hover:bg-white/[0.025]"
                  >

                    <td className="px-3 py-5 align-middle xl:px-4">
                      <div className="flex min-w-0 items-center gap-2">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
                          <CreditCard className="h-4 w-4 !text-white" />
                        </div>

                        <span
                          className="truncate text-sm font-semibold text-white"
                          title={payment.paymentId}
                        >
                          {payment.paymentId}
                        </span>

                      </div>
                    </td>

                    <td className="px-3 py-5 align-middle xl:px-4">
                      <span className="truncate text-sm font-medium text-white">
                        {payment.bookingId ?? "—"}
                      </span>
                    </td>

                    <td className="px-3 py-5 align-middle xl:px-4">
                      <div className="min-w-0">

                        <div className="flex min-w-0 items-center gap-2">
                          <UserRound className="h-4 w-4 shrink-0 !text-white" />

                          <p
                            className="truncate text-sm font-semibold text-white"
                            title={getCustomerName(payment)}
                          >
                            {getCustomerName(payment)}
                          </p>
                        </div>

                        <p className="mt-1 truncate pl-6 text-[11px] text-slate-500">
                          {getCustomerEmail(payment)}
                        </p>

                      </div>
                    </td>

                    <td className="px-3 py-5 align-middle xl:px-4">
                      <div className="min-w-0">

                        <p
                          className="truncate text-sm font-semibold text-white"
                          title={getStationName(payment.stationId)}
                        >
                          {getStationName(payment.stationId)}
                        </p>

                        <p className="mt-1 truncate text-[11px] text-slate-500">
                          {getStationCity(payment.stationId)}
                        </p>

                      </div>
                    </td>

                    <td className="px-3 py-5 align-middle xl:px-4">
                      <div className="flex items-center gap-1.5">
                        <IndianRupee className="h-4 w-4 shrink-0 !text-white" />

                        <span className="truncate text-sm font-semibold text-white">
                          ₹
                          {Number(
                            payment.amount || 0
                          ).toFixed(2)}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-[11px] text-slate-500">
                        {payment.paymentMethod}
                      </p>
                    </td>

                    <td className="px-3 py-5 pl-5 align-middle xl:px-4 xl:pl-6">
                      <PaymentStatusBadge
                        status={payment.status}
                      />
                    </td>

                    <td className="px-3 py-5 align-middle xl:px-4">
                      <div className="flex items-center gap-2">

                        <ActionButton
                          label="View payment"
                          onClick={() =>
                            setViewPayment(payment)
                          }
                        >
                          <Eye className="h-4 w-4 !text-white" />
                        </ActionButton>

                        {payment.status ===
                          "Pending" && (
                          <ActionButton
                            label="Mark as paid"
                            onClick={() =>
                              void handleStatusChange(
                                payment,
                                "Paid"
                              )
                            }
                            className="hover:border-emerald-400/30 hover:bg-emerald-400/10"
                          >
                            <CheckCircle2 className="h-4 w-4 !text-white" />
                          </ActionButton>
                        )}

                        {payment.status ===
                          "Paid" && (
                          <ActionButton
                            label="Refund payment"
                            onClick={() =>
                              void handleStatusChange(
                                payment,
                                "Refunded"
                              )
                            }
                            className="hover:border-orange-400/30 hover:bg-orange-400/10"
                          >
                            <IndianRupee className="h-4 w-4 !text-white" />
                          </ActionButton>
                        )}

                        <ActionButton
                          label="Delete payment"
                          onClick={() =>
                            setDeleteId(
                              payment.id
                            )
                          }
                          className="hover:border-red-400/30 hover:bg-red-400/10"
                        >
                          <Trash2 className="h-4 w-4 !text-white" />
                        </ActionButton>

                      </div>
                    </td>

                  </tr>
                )
              )
            )}

          </tbody>

        </table>
      </div>

      {/* MOBILE CARDS */}

      <section className="mt-4 grid gap-4 lg:hidden">

        {filteredPayments.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0D1B2A] px-5 py-14 text-center">

            <CreditCard className="mx-auto h-8 w-8 text-slate-600" />

            <p className="mt-3 text-sm font-medium text-slate-400">
              No payments found
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Try changing your search or filters.
            </p>

          </div>
        ) : (
          filteredPayments.map(
            (payment) => (
              <div
                key={payment.id}
                className="min-w-0 rounded-2xl border border-white/10 bg-[#0D1B2A] p-4 transition hover:border-cyan-400/20"
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                      <CreditCard className="h-5 w-5 !text-white" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">
                        {payment.paymentId}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {getCustomerName(payment)}
                      </p>
                    </div>

                  </div>

                  <PaymentStatusBadge
                    status={payment.status}
                  />

                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">

                  <InfoItem
                    label="Booking"
                    value={
                      payment.bookingId ??
                      "Not linked"
                    }
                  />

                  <InfoItem
                    label="Station"
                    value={getStationName(
                      payment.stationId
                    )}
                  />

                  <InfoItem
                    label="Amount"
                    value={`₹${Number(
                      payment.amount || 0
                    ).toFixed(2)}`}
                    icon={
                      <IndianRupee className="h-3.5 w-3.5 !text-white" />
                    }
                  />

                  <InfoItem
                    label="Method"
                    value={payment.paymentMethod}
                  />

                  <InfoItem
                    label="Date"
                    value={formatDate(
                      payment.paymentDate
                    )}
                    icon={
                      <CalendarDays className="h-3.5 w-3.5 !text-white" />
                    }
                  />

                  <InfoItem
                    label="Transaction"
                    value={
                      payment.transactionId ??
                      "—"
                    }
                  />

                </div>

                <div className="mt-5 flex items-center justify-end gap-2 border-t border-white/5 pt-4">

                  <ActionButton
                    label="View payment"
                    onClick={() =>
                      setViewPayment(payment)
                    }
                  >
                    <Eye className="h-4 w-4 !text-white" />
                  </ActionButton>

                  {payment.status ===
                    "Pending" && (
                    <ActionButton
                      label="Mark as paid"
                      onClick={() =>
                        void handleStatusChange(
                          payment,
                          "Paid"
                        )
                      }
                      className="hover:border-emerald-400/30 hover:bg-emerald-400/10"
                    >
                      <CheckCircle2 className="h-4 w-4 !text-white" />
                    </ActionButton>
                  )}

                  {payment.status ===
                    "Paid" && (
                    <ActionButton
                      label="Refund payment"
                      onClick={() =>
                        void handleStatusChange(
                          payment,
                          "Refunded"
                        )
                      }
                      className="hover:border-orange-400/30 hover:bg-orange-400/10"
                    >
                      <IndianRupee className="h-4 w-4 !text-white" />
                    </ActionButton>
                  )}

                  <ActionButton
                    label="Delete payment"
                    onClick={() =>
                      setDeleteId(payment.id)
                    }
                    className="hover:border-red-400/30 hover:bg-red-400/10"
                  >
                    <Trash2 className="h-4 w-4 !text-white" />
                  </ActionButton>

                </div>

              </div>
            )
          )
        )}

      </section>

      {/* =====================================================
          VIEW PAYMENT MODAL
      ===================================================== */}

      {viewPayment && (
        <div className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center overflow-hidden bg-black/70 p-3 backdrop-blur-sm sm:p-4">

          {/* POPUP */}
          <div className="flex h-full max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0D1A2A] shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-2rem)]">

            {/* HEADER - DOES NOT SCROLL */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5">

              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-white">
                  Payment Details
                </h2>

                <p className="mt-1 truncate text-xs text-slate-400">
                  {viewPayment.paymentId}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewPayment(null)
                }
                className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white transition hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* =================================================
                ONLY POPUP CONTENT SCROLLS
            ================================================= */}

            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">

              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5">

                <DetailItem
                  label="Payment ID"
                  value={viewPayment.paymentId}
                />

                <DetailItem
                  label="Booking ID"
                  value={
                    viewPayment.bookingId ??
                    "—"
                  }
                />

                <DetailItem
                  label="Customer"
                  value={getCustomerName(
                    viewPayment
                  )}
                />

                <DetailItem
                  label="Email"
                  value={
                    getCustomerEmail(
                      viewPayment
                    ) || "—"
                  }
                />

                <DetailItem
                  label="Station"
                  value={getStationName(
                    viewPayment.stationId
                  )}
                />

                <DetailItem
                  label="City"
                  value={
                    getStationCity(
                      viewPayment.stationId
                    ) || "—"
                  }
                />

                <DetailItem
                  label="Amount"
                  value={`₹${Number(
                    viewPayment.amount || 0
                  ).toFixed(2)}`}
                />

                <DetailItem
                  label="Payment Method"
                  value={
                    viewPayment.paymentMethod
                  }
                />

                <DetailItem
                  label="Payment Date"
                  value={formatDate(
                    viewPayment.paymentDate
                  )}
                />

                <DetailItem
                  label="Transaction ID"
                  value={
                    viewPayment.transactionId ??
                    "—"
                  }
                />

                <DetailItem
                  label="Status"
                  value={viewPayment.status}
                />

              </div>

            </div>

            {/* FOOTER - DOES NOT SCROLL */}
            <div className="flex shrink-0 justify-end border-t border-white/10 px-4 py-3 sm:px-5">

              <button
                type="button"
                onClick={() =>
                  setViewPayment(null)
                }
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#07111F] transition hover:bg-cyan-400"
              >
                Close
              </button>

            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          DELETE MODAL
      ===================================================== */}

      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0D1A2A] p-6 shadow-2xl shadow-black/60">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-400/10">
              <Trash2 className="h-5 w-5 text-red-400" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-white">
              Delete Payment?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              This payment record will be permanently removed from the system. This action cannot be undone.
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
                Delete Payment
              </button>

            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          STYLES
      ===================================================== */}

      <style>{`
        .input-field {
          width: 100%;
          height: 44px;
          min-width: 0;
          max-width: 100%;
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

        input[type="date"].input-field {
          color-scheme: dark;
        }

        input[type="date"].input-field::-webkit-calendar-picker-indicator {
          filter: brightness(0) invert(1) !important;
          opacity: 1 !important;
          cursor: pointer;
        }

        select.input-field {
          color-scheme: dark;
        }

        input[type="date"],
        select {
          color-scheme: dark;
        }

        /* ================================================
           HIDDEN POPUP SCROLLBAR
        ================================================= */

        .hide-scrollbar {
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
   PAYMENT STATUS BADGE
========================================================= */

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

function PaymentStatusBadge({
  status,
}: PaymentStatusBadgeProps) {
  const statusStyles: Record<
    PaymentStatus,
    string
  > = {
    Pending:
      "border-amber-400/20 bg-amber-400/10 text-amber-300",

    Paid:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",

    Failed:
      "border-red-400/20 bg-red-400/10 text-red-300",

    Refunded:
      "border-orange-400/20 bg-orange-400/10 text-orange-300",
  };

  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusStyles[status]}`}
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
        border-white/10
        bg-white/5
        text-white
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
    <div className="min-w-0 rounded-xl border border-white/5 bg-white/[0.025] p-3">

      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <div className="mt-1 flex min-w-0 items-center gap-1.5">

        {icon}

        <p
          className="truncate text-xs font-medium text-slate-300"
          title={value}
        >
          {value}
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   DETAIL ITEM
========================================================= */

interface DetailItemProps {
  label: string;
  value: string;
}

function DetailItem({
  label,
  value,
}: DetailItemProps) {
  return (
    <div className="min-w-0 rounded-xl border border-white/5 bg-white/[0.025] p-4">

      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p
        className="mt-2 truncate text-sm font-medium text-white"
        title={value}
      >
        {value}
      </p>

    </div>
  );
}

export default Payments;