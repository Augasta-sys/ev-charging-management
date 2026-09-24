import { Navigate, Route, Routes } from "react-router-dom";

import Login from "../pages/Login";
import SignUp from "../pages/SignUp";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";

import AdminDashboard from "../pages/admin/AdminDashboard";
import Users from "../pages/admin/Users";
import Stations from "../pages/admin/Stations";
import Chargers from "../pages/admin/Chargers";
import Slots from "../pages/admin/Slots";
import Pricing from "../pages/admin/Pricing";
import Bookings from "../pages/admin/Bookings";
import ChargingSessions from "../pages/admin/ChargingSessions";
import Payments from "../pages/admin/Payments";
import Maintenance from "../pages/admin/Maintenance";
import Reports from "../pages/admin/Reports";
import Activity from "../pages/admin/Activity";

import ManagerDashboard from "../pages/manager/ManagerDashboard";
import ManagerStation from "../pages/manager/ManagerStation";
import ManagerChargers from "../pages/manager/ManagerChargers";
import ManagerBookings from "../pages/manager/ManagerBookings";
import ManagerSessions from "../pages/manager/ManagerSessions";
import ManagerMaintenance from "../pages/manager/ManagerMaintenance";
import ManagerReports from "../pages/manager/ManagerReports";

import StaffDashboard from "../pages/staff/StaffDashboard";
import StaffBookings from "../pages/staff/StaffBookings";
import StaffSessions from "../pages/staff/StaffSessions";
import StaffCheckIn from "../pages/staff/StaffCheckIn";

import CustomerDashboard from "../pages/customer/CustomerDashboard";
import CustomerStations from "../pages/customer/CustomerStations";
import CustomerBookings from "../pages/customer/CustomerBookings";
import CustomerVehicles from "../pages/customer/CustomerVehicles";
import CustomerSessions from "../pages/customer/CustomerSessions";
import CustomerPayments from "../pages/customer/CustomerPayments";
import CustomerProfile from "../pages/customer/CustomerProfile";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import DashboardLayout from "../components/layouts/DashboardLayout";

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route path="/signup" element={<SignUp />} />

      <Route
  path="/forgot-password"
  element={<ForgotPassword />}
/>

<Route
  path="/reset-password"
  element={<ResetPassword />}
/>

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Admin */}
          <Route
            element={
              <RoleRoute allowedRoles={["admin"]} />
            }
          >
           <Route
  path="/admin/dashboard"
  element={<AdminDashboard />}
/>

<Route
  path="/admin/users"
  element={<Users />}
/>

<Route
  path="/admin/stations"
  element={<Stations />}
/>

<Route
  path="/admin/chargers"
  element={<Chargers />}
/>

<Route
  path="/admin/slots"
  element={<Slots />}
/>

<Route
  path="/admin/pricing"
  element={<Pricing /> }
/>

<Route
  path="/admin/bookings"
  element={<Bookings /> }
/>

<Route
  path="/admin/sessions"
  element={<ChargingSessions />}
/>

<Route
  path="/admin/payments"
  element={<Payments />}
/>

<Route
  path="/admin/maintenance"
  element={<Maintenance />}
/>

<Route
  path="/admin/reports"
  element={<Reports />}
/>

<Route
  path="/admin/activity"
  element={<Activity />}
/>

          </Route>

          {/* Manager */}
          <Route
            element={
              <RoleRoute allowedRoles={["manager"]} />
            }
          >

          <Route
  path="/manager/dashboard"
  element={ <ManagerDashboard />}
/>

<Route path="/manager/station" element={<ManagerStation />} />
<Route path="/manager/chargers" element={<ManagerChargers />} />

<Route
  path="/manager/bookings"
  element={<ManagerBookings />}
/>

<Route
  path="/manager/sessions"
  element={<ManagerSessions />}
/>

<Route
  path="/manager/maintenance"
  element={<ManagerMaintenance />}
/>

<Route
  path="/manager/reports"
  element={<ManagerReports />}
/>

          </Route>

          {/* Staff */}
          <Route
            element={
              <RoleRoute allowedRoles={["staff"]} />
            }
          >
            <Route
  path="/staff/dashboard"
  element={<StaffDashboard />}
/>

<Route
  path="/staff/bookings"
  element={<StaffBookings />}
/>

<Route
  path="/staff/sessions"
  element={<StaffSessions />}
/>

<Route
  path="/staff/check-in"
  element={<StaffCheckIn />}
/>
          </Route>

          {/* Customer */}
          <Route
            element={
              <RoleRoute allowedRoles={["customer"]} />
            }
          >
           <Route
  path="/customer/dashboard"
  element={<CustomerDashboard />}
/>

<Route
  path="/customer/stations"
  element={<CustomerStations />}
/>

<Route
  path="/customer/bookings"
  element={<CustomerBookings />}
/>

<Route
  path="/customer/vehicles"
  element={<CustomerVehicles />}
/>

<Route
  path="/customer/sessions"
  element={<CustomerSessions />}
/>

<Route
  path="/customer/payments"
  element={<CustomerPayments />}
/>

<Route
  path="/customer/profile"
  element={<CustomerProfile />}
/>

          </Route>
        </Route>
      </Route>

      {/* Unknown */}
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default AppRoutes;