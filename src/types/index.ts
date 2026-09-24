export type UserRole = "admin" | "manager" | "staff" | "customer";

export type UserStatus = "Active" | "Inactive";

export type StationStatus =
  | "Active"
  | "Inactive"
  | "Under Maintenance"
  | "Temporarily Closed";

export type ChargerType =
  | "AC Charger"
  | "DC Fast Charger"
  | "DC Ultra Fast Charger";

export type ConnectorType =
  | "Type 1"
  | "Type 2"
  | "CCS"
  | "CHAdeMO";

export type ChargerStatus =
  | "Available"
  | "Booked"
  | "Charging"
  | "Occupied"
  | "Maintenance"
  | "Offline";

export type SlotStatus =
  | "Available"
  | "Booked"
  | "Blocked"
  | "Completed"
  | "Cancelled";

export type VehicleType =
  | "Car"
  | "Bike"
  | "Scooter"
  | "Commercial Vehicle";

export type BookingStatus =
  | "Pending"
  | "Confirmed"
  | "Checked In"
  | "Charging"
  | "Completed"
  | "Cancelled"
  | "No Show";

export type SessionStatus =
  | "Not Started"
  | "Charging"
  | "Paused"
  | "Completed"
  | "Cancelled";

export type PaymentStatus =
  | "Pending"
  | "Paid"
  | "Failed"
  | "Refunded";

export type PaymentMethod =
  | "Cash"
  | "UPI"
  | "Card"
  | "Wallet";

export type PricingStatus = "Active" | "Inactive";

export type MaintenanceStatus =
  | "Reported"
  | "Scheduled"
  | "In Progress"
  | "Completed"
  | "Cancelled";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  status: UserStatus;
  assignedStationId?: string;
  avatar?: string;
  createdDate: string;
}

export interface Station {
  id: string;
  stationId: string;
  stationName: string;
  stationCode: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  managerId?: string;
  contactNumber: string;
  openingTime: string;
  closingTime: string;
  numberOfChargers: number;
  status: StationStatus;
  createdDate: string;
}

export interface Charger {
  id: string;
  chargerId: string;
  stationId: string;
  chargerNumber: string;
  chargerType: ChargerType;
  connectorType: ConnectorType;
  powerOutput: number;
  pricePerKwh: number;
  status: ChargerStatus;
}

export interface ChargingSlot {
  id: string;
  slotId: string;
  chargerId: string;
  stationId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
}

export interface Vehicle {
  id: string;
  vehicleId: string;
  customerId: string;
  vehicleNumber: string;
  brand: string;
  model: string;
  batteryCapacity: number;
  vehicleType: VehicleType;
  connectorType: ConnectorType;
  isDefault: boolean;
}

export interface Booking {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  stationId: string;
  chargerId: string;
  slotId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  estimatedDuration: number;
  estimatedCost: number;
  status: BookingStatus;
  createdDate: string;
}

export interface ChargingSession {
  id: string;
  sessionId: string;
  bookingId: string;
  customerId: string;
  vehicleId: string;
  stationId: string;
  chargerId: string;
  startTime?: string;
  endTime?: string;
  startBatteryPercentage?: number;
  endBatteryPercentage?: number;
  energyConsumed: number;
  chargingDuration: number;
  cost: number;
  status: SessionStatus;
}

export interface Payment {
  id: string;
  paymentId: string;
  bookingId: string;
  customerId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionReference: string;
  status: PaymentStatus;
}

export interface Pricing {
  id: string;
  pricingId: string;
  chargerType: ChargerType;
  powerRange: string;
  pricePerKwh: number;
  effectiveDate: string;
  status: PricingStatus;
}

export interface Maintenance {
  id: string;
  maintenanceId: string;
  chargerId: string;
  stationId: string;
  issue: string;
  reportedBy: string;
  reportedDate: string;
  technician: string;
  startDate?: string;
  completionDate?: string;
  status: MaintenanceStatus;
  remarks: string;
}

export interface Activity {
  id: string;
  activityId: string;
  userId: string;
  userName: string;
  action: string;
  description: string;
  relatedRecordId?: string;
  timestamp: string;
}