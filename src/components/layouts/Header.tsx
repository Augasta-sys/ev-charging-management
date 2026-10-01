import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  Zap,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

interface HeaderProps {
  onMenuClick: () => void;
}

function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

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
      message: "A new charging slot has been booked.",
      time: "5 min ago",
      type: "booking",
    },
    {
      id: 2,
      title: "Charging session completed",
      message: "Session CS004 has been completed.",
      time: "20 min ago",
      type: "charging",
    },
    {
      id: 3,
      title: "Charger maintenance",
      message: "Charger CH003 requires attention.",
      time: "1 hour ago",
      type: "maintenance",
    },
  ];

  /* =========================================
     PROFILE NAVIGATION
  ========================================= */

  const handleProfileClick = () => {
    setNotificationOpen(false);
    setProfileOpen((previous) => !previous);
  };

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate("/login");
  };

  const handleViewProfile = () => {
    setProfileOpen(false);
    navigate("/customer/profile");
  };

  return (
    <header
      className="
        relative h-20
        border-b border-[var(--border-primary)]
        bg-[var(--header-bg)]
        shadow-[0_8px_30px_rgba(0,0,0,0.08)]
        backdrop-blur-xl
        transition-colors duration-200
      "
    >
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* =====================================
            LEFT SECTION
        ===================================== */}

        <div className="flex min-w-0 items-center gap-4">

          {/* Mobile Menu */}

          <button
            type="button"
            onClick={onMenuClick}
            className="
              flex h-10 w-10 shrink-0 items-center justify-center
              rounded-xl
              border border-[var(--border-primary)]
              bg-[var(--bg-tertiary)]
              text-[var(--text-secondary)]
              transition
              hover:border-[var(--accent-primary)]
              hover:text-[var(--accent-primary)]
              lg:hidden
            "
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          {/* Logo */}

          <div className="flex items-center gap-3">

            <div
              className="
                relative flex h-10 w-10 items-center justify-center
                rounded-xl
                bg-gradient-to-br from-[#22D3EE] to-[#8B5CF6]
                shadow-[0_0_20px_rgba(34,211,238,0.25)]
              "
            >
              <Zap
                size={21}
                strokeWidth={2.5}
                className="text-white"
                fill="currentColor"
              />

              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_8px_white]" />
            </div>

            <div className="hidden sm:block">
              <h1 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                EV Charge
                <span className="text-[var(--accent-primary)]">
                  Hub
                </span>
              </h1>

              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
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
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />

            <input
              type="text"
              placeholder="Search stations, bookings..."
              className="
                h-11 w-full rounded-xl
                border border-[var(--border-primary)]
                bg-[var(--input-bg)]
                pl-11 pr-4
                text-sm text-[var(--input-text)]
                outline-none transition
                placeholder:text-[var(--text-muted)]
                focus:border-[var(--accent-primary)]/60
                focus:ring-2 focus:ring-[var(--accent-primary)]/10
              "
            />

            <div
              className="
                absolute right-3 top-1/2 hidden
                -translate-y-1/2 items-center gap-1
                rounded-md
                border border-[var(--border-primary)]
                bg-[var(--bg-secondary)]
                px-2 py-1 lg:flex
              "
            >
              <span className="text-[10px] text-[var(--text-muted)]">
                Ctrl
              </span>

              <span className="text-[10px] text-[var(--text-muted)]">
                K
              </span>
            </div>
          </div>
        </div>

        {/* =====================================
            RIGHT SECTION
        ===================================== */}

        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">

          {/* Online */}

          <div className="hidden items-center gap-2 rounded-full border border-emerald-500/10 bg-emerald-500/5 px-3 py-2 lg:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />

            <span className="text-xs font-medium text-emerald-500">
              Online
            </span>
          </div>

          {/* =====================================
              THEME TOGGLE
          ===================================== */}

          <button
            type="button"
            onClick={toggleTheme}
            className="
              flex h-10 w-10 items-center justify-center
              rounded-xl
              border border-[var(--border-primary)]
              bg-[var(--bg-tertiary)]
              text-[var(--text-secondary)]
              transition-all duration-200
              hover:border-[var(--accent-primary)]
              hover:text-[var(--accent-primary)]
              hover:shadow-[0_0_15px_rgba(34,211,238,0.12)]
            "
            aria-label={
              theme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            title={
              theme === "dark"
                ? "Light mode"
                : "Dark mode"
            }
          >
            {theme === "dark" ? (
              <Sun size={19} />
            ) : (
              <Moon size={19} />
            )}
          </button>

          {/* =====================================
              NOTIFICATIONS
          ===================================== */}

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setNotificationOpen(
                  (previous) => !previous,
                )
              }
              className={`
                relative flex h-10 w-10 items-center justify-center
                rounded-xl border
                bg-[var(--bg-tertiary)]
                transition-all duration-200
                ${
                  notificationOpen
                    ? "border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-[0_0_15px_rgba(34,211,238,0.12)]"
                    : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/50 hover:text-[var(--accent-primary)]"
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

              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[var(--header-bg)] bg-[#22D3EE] px-1 text-[9px] font-bold text-[#07111F] shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                {notifications.length}
              </span>
            </button>

            {/* Notification Dropdown */}

            {notificationOpen && (
              <div className="absolute right-0 top-14 z-[100] w-[350px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-[0_20px_60px_rgba(0,0,0,0.25)]">

                {/* Dropdown Header */}

                <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-5 py-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      Notifications
                    </h3>

                    <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                      You have{" "}
                      {notifications.length} new
                      notifications
                    </p>
                  </div>

                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--accent-primary)] transition hover:text-[var(--text-primary)]"
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
                        className="group flex w-full gap-3 border-b border-[var(--border-primary)]/70 px-5 py-4 text-left transition hover:bg-[var(--bg-tertiary)]"
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
                                  ? "bg-[#8B5CF6]/10 text-[#8B5CF6]"
                                  : "bg-orange-400/10 text-orange-500"
                            }
                          `}
                        >
                          <Bell size={16} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)]">
                              {notification.title}
                            </p>

                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#22D3EE]" />
                          </div>

                          <p className="mt-1 text-[11px] leading-5 text-[var(--text-secondary)]">
                            {notification.message}
                          </p>

                          <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">
                            {notification.time}
                          </p>
                        </div>
                      </button>
                    ),
                  )}
                </div>

                {/* Dropdown Footer */}

                <button
                  type="button"
                  className="w-full border-t border-[var(--border-primary)] px-5 py-3 text-center text-xs font-medium text-[var(--accent-primary)] transition hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>

          {/* =====================================
              PROFILE
          ===================================== */}

          <div className="relative">
            <button
              type="button"
              onClick={handleProfileClick}
              title="Account menu"
              aria-label="Account menu"
              aria-expanded={profileOpen}
              className={`
                flex items-center gap-2 rounded-xl
                border border-transparent px-2 py-1.5
                transition
                ${
                  profileOpen
                    ? "border-[var(--border-primary)] bg-[var(--bg-tertiary)]"
                    : "hover:border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]"
                }
              `}
            >
              {/* Avatar */}

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#22D3EE] to-[#8B5CF6] text-sm font-bold text-white shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                {userInitial}
              </div>

              {/* User Details */}

              <div className="hidden text-left sm:block">
                <p className="max-w-[120px] truncate text-xs font-semibold text-[var(--text-primary)]">
                  {user?.name ?? "User"}
                </p>

                <p className="text-[10px] capitalize text-[var(--text-muted)]">
                  {roleName}
                </p>
              </div>

              <ChevronDown
                size={15}
                className={`hidden text-[var(--text-muted)] transition-transform sm:block ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Profile / Logout Dropdown */}

            {profileOpen && (
              <div className="absolute right-0 top-14 z-[100] w-52 overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
                <div className="border-b border-[var(--border-primary)] px-4 py-3">
                  <p className="truncate text-xs font-semibold text-[var(--text-primary)]">
                    {user?.name ?? "User"}
                  </p>
                  <p className="mt-0.5 text-[10px] capitalize text-[var(--text-muted)]">
                    {roleName}
                  </p>
                </div>

                {user?.role === "customer" && (
                  <button
                    type="button"
                    onClick={handleViewProfile}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-tertiary)]"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-[var(--accent-primary)]">
                      <span className="text-xs font-bold">
                        {userInitial}
                      </span>
                    </span>
                    Profile
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 border-t border-[var(--border-primary)] px-4 py-3 text-sm font-medium text-red-500 transition hover:bg-red-500/10"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                    <LogOut className="h-4 w-4" />
                  </span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;