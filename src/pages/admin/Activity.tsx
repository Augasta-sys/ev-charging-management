import { useEffect, useMemo, useState } from "react";
import {
  Activity as ActivityIcon,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Info,
  LogIn,
  LogOut,
  RefreshCw,
  Search,
  Trash2,
  User,
  X,
  Zap,
} from "lucide-react";

import api from "../../services/api";

/* =========================================================
   TYPES
========================================================= */

type ActivityType =
  | "Login"
  | "Logout"
  | "Booking"
  | "Charging"
  | "Payment"
  | "User"
  | "Station"
  | "Charger"
  | "Maintenance"
  | "System";

type ActivityStatus =
  | "Success"
  | "Info"
  | "Warning"
  | "Failed";

interface ActivityRecord {
  id: string;
  activityId: string;
  userId?: string;
  userName?: string;
  action: string;
  description: string;
  type?: ActivityType;
  status?: ActivityStatus;
  entityType?: string;
  entityId?: string;
  timestamp?: string;
  createdDate?: string;
  ipAddress?: string;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function Activity() {
  const [activities, setActivities] = useState<
    ActivityRecord[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] =
    useState("");
  const [statusFilter, setStatusFilter] =
    useState("");

  const [viewActivity, setViewActivity] =
    useState<ActivityRecord | null>(null);

  const [deleteId, setDeleteId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get<ActivityRecord[]>(
          "/activities",
        );

      setActivities(response.data);
    } catch (error) {
      console.error(
        "Failed to load activities:",
        error,
      );

      setError(
        "Unable to load activity data. Please make sure JSON Server is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadActivities();
  }, []);

  /* =======================================================
     BODY SCROLL LOCK
  ======================================================= */

  useEffect(() => {
    const modalOpen =
      Boolean(viewActivity) ||
      Boolean(deleteId);

    if (modalOpen) {
      document.body.style.overflow =
        "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [viewActivity, deleteId]);

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadActivities();
    } finally {
      setRefreshing(false);
    }
  };

  /* =======================================================
     FILTERED ACTIVITIES
  ======================================================= */

  const filteredActivities = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return activities.filter((activity) => {
      const matchesSearch =
        !query ||
        activity.activityId
          .toLowerCase()
          .includes(query) ||
        activity.action
          .toLowerCase()
          .includes(query) ||
        activity.description
          .toLowerCase()
          .includes(query) ||
        activity.userName
          ?.toLowerCase()
          .includes(query) ||
        activity.userId
          ?.toLowerCase()
          .includes(query) ||
        activity.entityId
          ?.toLowerCase()
          .includes(query);

      const matchesType =
        !typeFilter ||
        activity.type === typeFilter;

      const matchesStatus =
        !statusFilter ||
        activity.status === statusFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      );
    });
  }, [
    activities,
    search,
    typeFilter,
    statusFilter,
  ]);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const stats = useMemo(() => {
    const successful =
      activities.filter(
        (activity) =>
          activity.status === "Success",
      ).length;

    const info =
      activities.filter(
        (activity) =>
          activity.status === "Info",
      ).length;

    const warnings =
      activities.filter(
        (activity) =>
          activity.status === "Warning",
      ).length;

    const failed =
      activities.filter(
        (activity) =>
          activity.status === "Failed",
      ).length;

    return {
      total: activities.length,
      successful,
      info,
      warnings,
      failed,
    };
  }, [activities]);

  /* =======================================================
     DELETE ACTIVITY
  ======================================================= */

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setError("");

      await api.delete(
        `/activities/${deleteId}`,
      );

      setActivities((previous) =>
        previous.filter(
          (activity) =>
            activity.id !== deleteId,
        ),
      );

      setDeleteId(null);

      setSuccess(
        "Activity deleted successfully.",
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to delete activity.",
      );
    }
  };

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setStatusFilter("");
  };

  /* =======================================================
     FORMAT DATE
  ======================================================= */

  const formatDateTime = (
    value?: string,
  ) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(date);
  };

  /* =======================================================
     STATUS CLASS
  ======================================================= */

  const getStatusClass = (
    status?: ActivityStatus,
  ) => {
    switch (status) {
      case "Success":
        return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

      case "Info":
        return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";

      case "Warning":
        return "border-amber-400/20 bg-amber-400/10 text-amber-300";

      case "Failed":
        return "border-red-400/20 bg-red-400/10 text-red-300";

      default:
        return "border-white/10 bg-white/5 text-slate-300";
    }
  };

  /* =======================================================
     TYPE CLASS
  ======================================================= */

  const getTypeClass = (
    type?: ActivityType,
  ) => {
    switch (type) {
      case "Login":
        return "border-blue-400/20 bg-blue-400/10 text-blue-300";

      case "Logout":
        return "border-violet-400/20 bg-violet-400/10 text-violet-300";

      case "Booking":
        return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";

      case "Charging":
        return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

      case "Payment":
        return "border-amber-400/20 bg-amber-400/10 text-amber-300";

      case "Maintenance":
        return "border-red-400/20 bg-red-400/10 text-red-300";

      default:
        return "border-white/10 bg-white/5 text-slate-300";
    }
  };

  /* =======================================================
     TYPE ICON
  ======================================================= */

  const getTypeIcon = (
    type?: ActivityType,
  ) => {
    switch (type) {
      case "Login":
        return (
          <LogIn className="h-4 w-4" />
        );

      case "Logout":
        return (
          <LogOut className="h-4 w-4" />
        );

      case "Booking":
        return (
          <CalendarDays className="h-4 w-4" />
        );

      case "Charging":
        return (
          <Zap className="h-4 w-4" />
        );

      case "Payment":
        return (
          <CheckCircle2 className="h-4 w-4" />
        );

      case "User":
        return (
          <User className="h-4 w-4" />
        );

      case "Station":
        return (
          <ActivityIcon className="h-4 w-4" />
        );

      case "Charger":
        return (
          <Zap className="h-4 w-4" />
        );

      case "Maintenance":
        return (
          <Clock3 className="h-4 w-4" />
        );

      default:
        return (
          <Info className="h-4 w-4" />
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
            <ActivityIcon className="h-6 w-6 animate-pulse text-cyan-400" />
          </div>

          <p className="text-sm text-slate-400">
            Loading activity...
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
            <ActivityIcon className="h-4 w-4" />

            Activity Management
          </div>

          <h1 className="truncate text-2xl font-bold text-white sm:text-3xl">
            Activity Log
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor system activity and user actions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing
                ? "animate-spin"
                : ""
            }`}
          />

          Refresh
        </button>
      </div>

      {/* ===================================================
          ALERTS
      =================================================== */}

      {error && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0 text-red-300 transition hover:text-white"
            aria-label="Close error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {/* ===================================================
          STATS
      =================================================== */}

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Activities"
          value={stats.total}
          description="All recorded activities"
          icon={ActivityIcon}
          iconClass="text-cyan-400"
          iconBg="bg-cyan-400/10"
        />

        <StatCard
          title="Successful"
          value={stats.successful}
          description="Completed successfully"
          icon={CheckCircle2}
          iconClass="text-emerald-400"
          iconBg="bg-emerald-400/10"
        />

        <StatCard
          title="Information"
          value={stats.info}
          description="Informational events"
          icon={Info}
          iconClass="text-blue-400"
          iconBg="bg-blue-400/10"
        />

        <StatCard
          title="Warnings"
          value={stats.warnings}
          description="Events requiring attention"
          icon={Clock3}
          iconClass="text-amber-400"
          iconBg="bg-amber-400/10"
        />

        <StatCard
          title="Failed"
          value={stats.failed}
          description="Failed activities"
          icon={X}
          iconClass="text-red-400"
          iconBg="bg-red-400/10"
        />
      </div>

      {/* ===================================================
    SEARCH & FILTERS
=================================================== */}

<section className="mt-6 rounded-2xl border border-white/10 bg-[#0D1B2A] p-4 sm:p-5">
  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-sm font-semibold text-white">
        Search & Filters
      </h2>

      <p className="mt-1 text-xs text-slate-500">
        Find activities by user, action, activity ID or status.
      </p>
    </div>

    {(search || typeFilter || statusFilter) && (
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

  <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">

    {/* Search */}

    <div className="relative min-w-0">
      <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 !text-white" />

      <input
        type="text"
        value={search}
        onChange={(event) =>
          setSearch(event.target.value)
        }
        placeholder="Search activities..."
        className="h-11 w-full rounded-xl border border-white/10 bg-[#0D1B2A] px-4 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
      />
    </div>

    {/* Activity Type */}

    <div className="relative min-w-0">
      <select
        value={typeFilter}
        onChange={(event) =>
          setTypeFilter(event.target.value)
        }
        className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#0D1B2A] px-4 pr-11 text-sm text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
        style={{ colorScheme: "dark" }}
      >
        <option
          value=""
          className="bg-[#0D1B2A] text-white"
        >
          All Activity Types
        </option>

        <option
          value="Login"
          className="bg-[#0D1B2A] text-white"
        >
          Login
        </option>

        <option
          value="Logout"
          className="bg-[#0D1B2A] text-white"
        >
          Logout
        </option>

        <option
          value="Booking"
          className="bg-[#0D1B2A] text-white"
        >
          Booking
        </option>

        <option
          value="Charging"
          className="bg-[#0D1B2A] text-white"
        >
          Charging
        </option>

        <option
          value="Payment"
          className="bg-[#0D1B2A] text-white"
        >
          Payment
        </option>

        <option
          value="User"
          className="bg-[#0D1B2A] text-white"
        >
          User
        </option>

        <option
          value="Station"
          className="bg-[#0D1B2A] text-white"
        >
          Station
        </option>

        <option
          value="Charger"
          className="bg-[#0D1B2A] text-white"
        >
          Charger
        </option>

        <option
          value="Maintenance"
          className="bg-[#0D1B2A] text-white"
        >
          Maintenance
        </option>

        <option
          value="System"
          className="bg-[#0D1B2A] text-white"
        >
          System
        </option>
      </select>

      <svg
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </div>

    {/* Status */}

    <div className="relative min-w-0">
      <select
        value={statusFilter}
        onChange={(event) =>
          setStatusFilter(event.target.value)
        }
        className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#0D1B2A] px-4 pr-11 text-sm text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
        style={{ colorScheme: "dark" }}
      >
        <option
          value=""
          className="bg-[#0D1B2A] text-white"
        >
          All Statuses
        </option>

        <option
          value="Success"
          className="bg-[#0D1B2A] text-white"
        >
          Success
        </option>

        <option
          value="Info"
          className="bg-[#0D1B2A] text-white"
        >
          Info
        </option>

        <option
          value="Warning"
          className="bg-[#0D1B2A] text-white"
        >
          Warning
        </option>

        <option
          value="Failed"
          className="bg-[#0D1B2A] text-white"
        >
          Failed
        </option>
      </select>

      <svg
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01-1.06-.02z"
          clipRule="evenodd"
        />
      </svg>
    </div>

  </div>
</section>

      {/* ===================================================
          RESULTS
      =================================================== */}

      <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0D1B2A]">
        <div className="flex flex-col gap-2 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Recent Activity
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Showing {filteredActivities.length} of{" "}
              {activities.length} activities.
            </p>
          </div>
        </div>

        {/* =================================================
            DESKTOP TABLE
        ================================================= */}

        <div className="hidden lg:block">
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[13%]" />
              <col className="w-[25%]" />
              <col className="w-[14%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
            </colgroup>

            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 xl:px-5">
                  Activity ID
                </th>

                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 xl:px-5">
                  User
                </th>

                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 xl:px-5">
                  Type
                </th>

                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 xl:px-5">
                  Activity
                </th>

                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 xl:px-5">
                  Date & Time
                </th>

                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 xl:px-5">
                  Status
                </th>

                <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 xl:px-5">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredActivities.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                      <ActivityIcon className="h-6 w-6 text-white" />
                    </div>

                    <p className="mt-4 text-sm font-medium text-slate-400">
                      No activities found
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      Try changing your search or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredActivities.map(
                  (activity) => (
                    <tr
                      key={activity.id}
                      className="border-b border-white/5 transition hover:bg-white/[0.025]"
                    >
                      {/* Activity ID */}

                      <td className="min-w-0 px-4 py-5 align-middle xl:px-5">
                        <p className="truncate text-sm font-bold text-white">
                          {activity.activityId}
                        </p>

                        {activity.entityId && (
                          <p className="mt-1 truncate text-[11px] text-slate-500">
                            {activity.entityId}
                          </p>
                        )}
                      </td>

                      {/* User */}

                      <td className="min-w-0 px-4 py-5 align-middle xl:px-5">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10">
                            <User className="h-4 w-4 !text-white" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {activity.userName ||
                                activity.userId ||
                                "System"}
                            </p>

                            {activity.userId && (
                              <p className="mt-0.5 truncate text-[10px] text-slate-500">
                                {activity.userId}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type */}

                      <td className="px-4 py-5 align-middle xl:px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${getTypeClass(
                            activity.type,
                          )}`}
                        >
                          {getTypeIcon(
                            activity.type,
                          )}

                          {activity.type ||
                            "System"}
                        </span>
                      </td>

                      {/* Activity */}

                      <td className="min-w-0 px-4 py-5 align-middle xl:px-5">
                        <p
                          className="truncate text-sm font-semibold text-white"
                          title={
                            activity.action
                          }
                        >
                          {activity.action}
                        </p>

                        <p
                          className="mt-1 truncate text-[11px] text-slate-500"
                          title={
                            activity.description
                          }
                        >
                          {activity.description}
                        </p>
                      </td>

                      {/* Date */}

                      <td className="px-4 py-5 align-middle xl:px-5">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 shrink-0 !text-white" />

                          <span className="text-xs text-slate-300">
                            {formatDateTime(
                              activity.timestamp ||
                                activity.createdDate,
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Status */}

                      <td className="px-4 py-5 align-middle xl:px-5">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${getStatusClass(
                            activity.status,
                          )}`}
                        >
                          {activity.status ||
                            "Info"}
                        </span>
                      </td>

                      {/* Actions */}

                      <td className="px-4 py-5 align-middle xl:px-5">
                        <div className="flex items-center justify-end gap-2.5">
                          <ActionButton
                            label="View activity"
                            onClick={() =>
                              setViewActivity(
                                activity,
                              )
                            }
                          >
                            <Eye className="h-4 w-4 !text-white" />
                          </ActionButton>

                          <ActionButton
                            label="Delete activity"
                            onClick={() =>
                              setDeleteId(
                                activity.id,
                              )
                            }
                            className="hover:border-red-400/30 hover:bg-red-400/10"
                          >
                            <Trash2 className="h-4 w-4 !text-white" />
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>

        {/* =================================================
            MOBILE CARDS
        ================================================= */}

        <div className="grid gap-3 p-3 lg:hidden sm:p-4">
          {filteredActivities.length ===
          0 ? (
            <div className="px-4 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                <ActivityIcon className="h-6 w-6 text-white" />
              </div>

              <p className="mt-4 text-sm font-medium text-slate-400">
                No activities found
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            filteredActivities.map(
              (activity) => (
                <div
                  key={activity.id}
                  className="rounded-xl border border-white/10 bg-white/[0.025] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10">
                          {getTypeIcon(
                            activity.type,
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">
                            {activity.activityId}
                          </p>

                          <p className="mt-0.5 truncate text-[10px] text-slate-500">
                            {activity.userName ||
                              activity.userId ||
                              "System"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium ${getStatusClass(
                        activity.status,
                      )}`}
                    >
                      {activity.status ||
                        "Info"}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-semibold text-white">
                      {activity.action}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {activity.description}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <CalendarDays className="h-3.5 w-3.5 !text-white" />

                      {formatDateTime(
                        activity.timestamp ||
                          activity.createdDate,
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <ActionButton
                        label="View activity"
                        onClick={() =>
                          setViewActivity(
                            activity,
                          )
                        }
                      >
                        <Eye className="h-4 w-4 !text-white" />
                      </ActionButton>

                      <ActionButton
                        label="Delete activity"
                        onClick={() =>
                          setDeleteId(
                            activity.id,
                          )
                        }
                        className="hover:border-red-400/30 hover:bg-red-400/10"
                      >
                        <Trash2 className="h-4 w-4 !text-white" />
                      </ActionButton>
                    </div>
                  </div>
                </div>
              ),
            )
          )}
        </div>
      </section>

      {/* ===================================================
          VIEW ACTIVITY MODAL
      =================================================== */}

      {viewActivity && (
        <div className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center overflow-hidden bg-black/70 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex h-full max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0D1A2A] shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-2rem)]">
            {/* Header */}

            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                  <ActivityIcon className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-white">
                    Activity Details
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {viewActivity.activityId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewActivity(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Details */}

            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5">
                <DetailItem
                  label="Activity ID"
                  value={
                    viewActivity.activityId
                  }
                />

                <DetailItem
                  label="User"
                  value={
                    viewActivity.userName ||
                    viewActivity.userId ||
                    "System"
                  }
                />

                <DetailItem
                  label="Activity Type"
                  value={
                    viewActivity.type ||
                    "System"
                  }
                />

                <DetailItem
                  label="Status"
                  value={
                    viewActivity.status ||
                    "Info"
                  }
                />

                <DetailItem
                  label="Action"
                  value={
                    viewActivity.action
                  }
                />

                <DetailItem
                  label="Entity Type"
                  value={
                    viewActivity.entityType ||
                    "—"
                  }
                />

                <DetailItem
                  label="Entity ID"
                  value={
                    viewActivity.entityId ||
                    "—"
                  }
                />

                <DetailItem
                  label="Date & Time"
                  value={formatDateTime(
                    viewActivity.timestamp ||
                      viewActivity.createdDate,
                  )}
                />

                <DetailItem
                  label="IP Address"
                  value={
                    viewActivity.ipAddress ||
                    "—"
                  }
                />

                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Description
                  </p>

                  <p className="mt-2 text-sm leading-6 text-white">
                    {viewActivity.description ||
                      "No description available."}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}

            <div className="flex shrink-0 justify-end border-t border-white/10 px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={() =>
                  setViewActivity(null)
                }
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          DELETE MODAL
      =================================================== */}

      {deleteId && (
        <div className="fixed inset-0 z-[110] flex min-h-0 items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0D1A2A] p-5 shadow-2xl shadow-black/60 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-red-400">
                <Trash2 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-semibold text-white">
                  Delete Activity
                </h2>

                <p className="mt-1.5 text-sm leading-6 text-slate-400">
                  Are you sure you want to delete this activity record? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setDeleteId(null)
                }
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400"
              >
                Delete Activity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          STYLES
      =================================================== */}

      <style>{`
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

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
  iconBg,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof ActivityIcon;
  iconClass: string;
  iconBg: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-[#0D1B2A] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-1 truncate text-[11px] text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
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
   ACTION BUTTON
========================================================= */

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
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:bg-white/10 ${className}`}
    >
      {children}
    </button>
  );
}

/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-medium text-white">
        {value}
      </p>
    </div>
  );
}