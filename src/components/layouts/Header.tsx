import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  ChevronDown,
  Menu,
  Search,
  Zap,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

interface HeaderProps {
  onMenuClick: () => void;
}

function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notificationOpen, setNotificationOpen] =
    useState(false);

  const userInitial =
    user?.name?.charAt(0).toUpperCase() ?? "U";

  const roleName = user?.role
    ? user.role.charAt(0).toUpperCase() +
      user.role.slice(1)
    : "User";

  const notifications = [
    {
      id: 1,
      title: "New booking received",
      message:
        "A new charging slot has been booked.",
      time: "5 min ago",
      type: "booking",
    },
    {
      id: 2,
      title: "Charging session completed",
      message:
        "Session CS004 has been completed.",
      time: "20 min ago",
      type: "charging",
    },
    {
      id: 3,
      title: "Charger maintenance",
      message:
        "Charger CH003 requires attention.",
      time: "1 hour ago",
      type: "maintenance",
    },
  ];

  /* =========================================
     PROFILE NAVIGATION
  ========================================= */

  const handleProfileClick = () => {
    setNotificationOpen(false);

    if (user?.role === "customer") {
      navigate("/customer/profile");
    }
  };

  return (
    <header className="relative h-20 border-b border-[#1E334D] bg-[#0B1628]/95 shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* =====================================
            LEFT SECTION
        ===================================== */}

        <div className="flex min-w-0 items-center gap-4">
          {/* Mobile Menu */}

          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#1E334D] bg-[#101D31] text-slate-300 transition hover:border-[#22D3EE] hover:text-[#22D3EE] lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          {/* Logo */}

          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#22D3EE] to-[#8B5CF6] shadow-[0_0_20px_rgba(34,211,238,0.25)]">
              <Zap
                size={21}
                strokeWidth={2.5}
                className="text-white"
                fill="currentColor"
              />

              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_8px_white]" />
            </div>

            <div className="hidden sm:block">
              <h1 className="text-base font-bold tracking-tight text-white">
                EV Charge
                <span className="text-[#22D3EE]">
                  Hub
                </span>
              </h1>

              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                Smart Charging
              </p>
            </div>
          </div>
        </div>

        {/* =====================================
            SEARCH
        ===================================== */}

        <div className="mx-4 hidden max-w-md flex-1 md:block">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="text"
              placeholder="Search stations, bookings..."
              className="h-11 w-full rounded-xl border border-[#1E334D] bg-[#101D31] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#22D3EE]/60 focus:bg-[#122238] focus:ring-2 focus:ring-[#22D3EE]/10"
            />

            <div className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-[#1E334D] bg-[#0B1628] px-2 py-1 lg:flex">
              <span className="text-[10px] text-slate-600">
                Ctrl
              </span>

              <span className="text-[10px] text-slate-600">
                K
              </span>
            </div>
          </div>
        </div>

        {/* =====================================
            RIGHT SECTION
        ===================================== */}

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Online */}

          <div className="hidden items-center gap-2 rounded-full border border-emerald-500/10 bg-emerald-500/5 px-3 py-2 lg:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />

            <span className="text-xs font-medium text-emerald-400">
              Online
            </span>
          </div>

          {/* =====================================
              NOTIFICATIONS
          ===================================== */}

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setNotificationOpen(
                  (previous) => !previous
                )
              }
              className={`
                relative flex h-10 w-10 items-center justify-center
                rounded-xl border bg-[#101D31]
                transition-all duration-200
                ${
                  notificationOpen
                    ? "border-[#22D3EE] text-[#22D3EE] shadow-[0_0_15px_rgba(34,211,238,0.12)]"
                    : "border-[#1E334D] text-slate-400 hover:border-[#22D3EE]/50 hover:text-[#22D3EE]"
                }
              `}
              aria-label="Notifications"
            >
              <Bell
                size={19}
                className={
                  notificationOpen
                    ? "animate-pulse"
                    : ""
                }
              />

              {/* Notification Count */}

              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#0B1628] bg-[#22D3EE] px-1 text-[9px] font-bold text-[#07111F] shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                {notifications.length}
              </span>
            </button>

            {/* Notification Dropdown */}

            {notificationOpen && (
              <div className="absolute right-0 top-14 z-[100] w-[350px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#1E334D] bg-[#0B1628] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                {/* Dropdown Header */}

                <div className="flex items-center justify-between border-b border-[#1E334D] px-5 py-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Notifications
                    </h3>

                    <p className="mt-0.5 text-[11px] text-slate-500">
                      You have{" "}
                      {notifications.length} new
                      notifications
                    </p>
                  </div>

                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-[11px] font-medium text-[#22D3EE] transition hover:text-white"
                  >
                    <CheckCheck size={14} />
                    Mark all read
                  </button>
                </div>

                {/* Notification List */}

                <div className="max-h-[360px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {notifications.map(
                    (notification) => (
                      <button
                        type="button"
                        key={notification.id}
                        className="group flex w-full gap-3 border-b border-[#1E334D]/70 px-5 py-4 text-left transition hover:bg-[#101D31]"
                      >
                        <div
                          className={`
                            mt-0.5 flex h-9 w-9 shrink-0
                            items-center justify-center rounded-xl
                            ${
                              notification.type ===
                              "booking"
                                ? "bg-[#22D3EE]/10 text-[#22D3EE]"
                                : notification.type ===
                                    "charging"
                                  ? "bg-[#8B5CF6]/10 text-[#A78BFA]"
                                  : "bg-orange-400/10 text-orange-400"
                            }
                          `}
                        >
                          <Bell size={16} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-white group-hover:text-[#22D3EE]">
                              {
                                notification.title
                              }
                            </p>

                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#22D3EE]" />
                          </div>

                          <p className="mt-1 text-[11px] leading-5 text-slate-500">
                            {
                              notification.message
                            }
                          </p>

                          <p className="mt-1.5 text-[10px] text-slate-600">
                            {notification.time}
                          </p>
                        </div>
                      </button>
                    )
                  )}
                </div>

                {/* Dropdown Footer */}

                <button
                  type="button"
                  className="w-full border-t border-[#1E334D] px-5 py-3 text-center text-xs font-medium text-[#22D3EE] transition hover:bg-[#101D31] hover:text-white"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>

          {/* =====================================
              PROFILE
          ===================================== */}

          <button
            type="button"
            onClick={handleProfileClick}
            title={
              user?.role === "customer"
                ? "View Profile"
                : `${roleName} Account`
            }
            className={`
              flex items-center gap-2 rounded-xl
              border border-transparent px-2 py-1.5
              transition
              ${
                user?.role === "customer"
                  ? "cursor-pointer hover:border-[#1E334D] hover:bg-[#101D31]"
                  : "cursor-default"
              }
            `}
          >
            {/* Avatar */}

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#22D3EE] to-[#8B5CF6] text-sm font-bold text-white shadow-[0_0_15px_rgba(34,211,238,0.15)]">
              {userInitial}
            </div>

            {/* User Details */}

            <div className="hidden text-left sm:block">
              <p className="max-w-[120px] truncate text-xs font-semibold text-white">
                {user?.name ?? "User"}
              </p>

              <p className="text-[10px] capitalize text-slate-500">
                {roleName}
              </p>
            </div>

            {user?.role === "customer" && (
              <ChevronDown
                size={15}
                className="hidden text-slate-500 sm:block"
              />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;