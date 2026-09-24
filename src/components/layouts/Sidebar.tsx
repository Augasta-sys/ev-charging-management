import type { ElementType } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  BarChart3,
  BatteryCharging,
  CalendarCheck,
  CalendarDays,
  Car,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MapPin,
  ShieldCheck,
  UserRound,
  Users,
  Wrench,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  label: string;
  path: string;
  icon: ElementType;
}

const navigationByRole: Record<string, NavigationItem[]> = {
  /* =========================================================
     ADMIN
  ========================================================= */
  admin: [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Users",
      path: "/admin/users",
      icon: Users,
    },
    {
      label: "Stations",
      path: "/admin/stations",
      icon: MapPin,
    },
    {
      label: "Chargers",
      path: "/admin/chargers",
      icon: BatteryCharging,
    },
    {
      label: "Slots",
      path: "/admin/slots",
      icon: CalendarDays,
    },
    {
      label: "Pricing",
      path: "/admin/pricing",
      icon: CircleDollarSign,
    },
    {
      label: "Bookings",
      path: "/admin/bookings",
      icon: CalendarCheck,
    },
    {
      label: "Charging Sessions",
      path: "/admin/sessions",
      icon: Activity,
    },
    {
      label: "Payments",
      path: "/admin/payments",
      icon: CreditCard,
    },
    {
      label: "Maintenance",
      path: "/admin/maintenance",
      icon: Wrench,
    },
    {
      label: "Reports",
      path: "/admin/reports",
      icon: BarChart3,
    },
    {
      label: "Activity",
      path: "/admin/activity",
      icon: Activity,
    },
  ],

  /* =========================================================
     STATION MANAGER
  ========================================================= */
  manager: [
    {
      label: "Dashboard",
      path: "/manager/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My Station",
      path: "/manager/station",
      icon: MapPin,
    },
    {
      label: "Chargers",
      path: "/manager/chargers",
      icon: BatteryCharging,
    },
    {
      label: "Bookings",
      path: "/manager/bookings",
      icon: CalendarCheck,
    },
    {
      label: "Charging Sessions",
      path: "/manager/sessions",
      icon: Activity,
    },
    {
      label: "Maintenance",
      path: "/manager/maintenance",
      icon: Wrench,
    },
    {
      label: "Reports",
      path: "/manager/reports",
      icon: BarChart3,
    },
  ],

  /* =========================================================
     STAFF
  ========================================================= */
  staff: [
    {
      label: "Dashboard",
      path: "/staff/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Bookings",
      path: "/staff/bookings",
      icon: CalendarCheck,
    },
    {
      label: "Check-In",
      path: "/staff/check-in",
      icon: ClipboardCheck,
    },
    {
      label: "Charging Sessions",
      path: "/staff/sessions",
      icon: Activity,
    },
  ],

  /* =========================================================
     CUSTOMER
  ========================================================= */
  customer: [
    {
      label: "Dashboard",
      path: "/customer/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Find Stations",
      path: "/customer/stations",
      icon: MapPin,
    },
    {
      label: "My Bookings",
      path: "/customer/bookings",
      icon: CalendarCheck,
    },
    {
      label: "My Vehicles",
      path: "/customer/vehicles",
      icon: Car,
    },
    {
      label: "Charging Sessions",
      path: "/customer/sessions",
      icon: Activity,
    },
    {
      label: "Payments",
      path: "/customer/payments",
      icon: CreditCard,
    },
    {
      label: "Profile",
      path: "/customer/profile",
      icon: UserRound,
    },
  ],
};

function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const { user, logout } = useAuth();

  const navigation =
    navigationByRole[user?.role ?? "customer"] ?? [];

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}
      <aside
        className={`
          fixed bottom-0 left-0 top-20 z-40
          flex w-72 flex-col
          border-r border-[#1E334D]
          bg-[#0B1628]
          shadow-[10px_0_40px_rgba(0,0,0,0.25)]
          transition-transform duration-300 ease-in-out

          overflow-y-auto
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden

          ${
            isOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* =================================================
            MOBILE CLOSE BUTTON
        ================================================= */}
        <div className="flex items-center justify-end px-4 pt-4 lg:hidden">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-xl border border-[#1E334D] bg-[#101D31] p-2 text-slate-400 transition hover:border-[#22D3EE] hover:text-[#22D3EE]"
          >
            <X size={20} />
          </button>
        </div>

        {/* =================================================
            NAVIGATION
        ================================================= */}
        <nav className="flex-1 px-4 py-5">
          <p className="mb-4 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Main Menu
          </p>

          <div className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `
                    group relative flex items-center gap-3
                    rounded-xl px-4 py-3
                    text-sm font-medium
                    transition-all duration-200

                    ${
                      isActive
                        ? "bg-gradient-to-r from-[#22D3EE]/15 to-[#8B5CF6]/15 text-[#22D3EE] shadow-[inset_3px_0_0_#22D3EE]"
                        : "text-slate-400 hover:bg-[#101D31] hover:text-white"
                    }
                    `
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Icon */}
                      <span
                        className={`
                          flex h-9 w-9 shrink-0 items-center justify-center
                          rounded-lg transition-all duration-200
                          ${
                            isActive
                              ? "bg-[#22D3EE]/10 text-[#22D3EE]"
                              : "bg-[#101D31] text-slate-500 group-hover:text-[#22D3EE]"
                          }
                        `}
                      >
                        <Icon
                          size={18}
                          strokeWidth={1.8}
                        />
                      </span>

                      {/* Label */}
                      <span className="truncate">
                        {item.label}
                      </span>

                      {/* Active indicator */}
                      {isActive && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-[#22D3EE] shadow-[0_0_10px_#22D3EE]" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* =================================================
            SYSTEM STATUS
        ================================================= */}
        <div className="mx-4 mb-4 rounded-2xl border border-[#1E334D] bg-[#101D31] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#22D3EE]/10">
              <ShieldCheck
                size={18}
                className="text-[#22D3EE]"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-white">
                System Online
              </p>

              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />

                <span className="text-[11px] text-slate-500">
                  All services operational
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            LOGOUT
        ================================================= */}
        <div className="border-t border-[#1E334D] p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#101D31] transition group-hover:bg-red-500/10">
              <LogOut size={18} />
            </span>

            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;