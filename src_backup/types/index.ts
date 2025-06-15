// src/types/index.ts

// --- Attachments, CostData, and DelayReason ---

export interface Attachment {
  id: string;
  // Add other fields if needed (e.g. fileName, url)
}

// "Simple" legacy cost entry: ONLY use if you have old code relying on {fuel, tolls, other}
export interface SimpleCostData {
  fuel: number;
  tolls: number;
  other: number;
}

// Full, rich cost entry structure (use this for all new code)
export interface CostData {
  id: string;
  amount: number;
  category: string;
  referenceNumber?: string;
  isFlagged?: boolean;
  isSystemGenerated?: boolean;
  investigationStatus?: string;
  flaggedAt?: string;
  resolvedAt?: string;
  attachments?: Attachment[];
  // ...add any other fields used in your code
}

export interface DelayReason {
  delayDuration: number;
  reason: string;
  delayType?: string;
  description?: string;
  id?: string;
}

export type TripStatus = "active" | "flagged" | "completed";

// --- Main Trip type (use this everywhere) ---
export interface Trip {
  id: string;
  driverName: string;
  fleetNumber: string;
  clientName: string;
  route: string;
  startDate: string;
  endDate: string;
  baseRevenue: number;
  revenueCurrency: "USD" | "ZAR";
  distanceKm: number;
  clientType: "internal" | "external";
  costs: CostData[]; // Detailed cost entries
  additionalCosts: CostData[];
  delayReasons: DelayReason[];
  investigationNotes?: string;
  plannedArrivalDateTime?: string;
  actualArrivalDateTime?: string;
  followUpHistory?: any[];
  status?: TripStatus;
  description?: string;
  invoiceNumber?: string;
  invoiceSubmittedAt?: string;
  invoiceSubmittedBy?: string;
  invoiceDueDate?: string;
  paymentStatus?: "unpaid" | "partial" | "paid";
  timelineValidated?: boolean;
  timelineValidatedAt?: string;
  autoCompletedAt?: string;
  autoCompletedReason?: string;
  completedAt?: string;
  completedBy?: string;
  invoiceDate?: string;
  editHistory?: any[];
  actualOffloadDateTime?: string;
  plannedOffloadDateTime?: string;
  actualDepartureDateTime?: string;
  plannedDepartureDateTime?: string;
  flaggedAt?: string;
  resolvedAt?: string;
  flaggedReason?: string;
  comments?: string[];
  attachments?: Attachment[];
  // ...add any other fields referenced in your code
}

// --- System Cost Configuration Types ---
export interface SystemCostRates {
  currency: "USD" | "ZAR";
  perKmCosts: {
    repairMaintenance: number;
    tyreCost: number;
  };
  perDayCosts: {
    gitInsurance: number;
    shortTermInsurance: number;
    trackingCost: number;
    fleetManagementSystem: number;
    licensing: number;
    vidRoadworthy: number;
    wages: number;
    depreciation: number;
  };
  lastUpdated: string;
  updatedBy: string;
  effectiveDate: string;
}

export interface SystemCostReminder {
  id: string;
  nextReminderDate: string;
  lastReminderDate?: string;
  reminderFrequencyDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- Audit Trail Types ---
export interface TripEditRecord {
  id: string;
  tripId: string;
  editedBy: string;
  editedAt: string;
  reason: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  changeType: "update" | "status_change" | "completion" | "auto_completion";
}

export interface CostEditRecord {
  id: string;
  costId: string;
  editedBy: string;
  editedAt: string;
  reason: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  changeType: "update" | "flag_status" | "investigation";
}

export interface TripDeletionRecord {
  id: string;
  tripId: string;
  deletedBy: string;
  deletedAt: string;
  reason: string;
  tripData: string;
  totalRevenue: number;
  totalCosts: number;
  costEntriesCount: number;
  flaggedItemsCount: number;
}

// --- User Permission Types ---
export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "operator";
  permissions: UserPermission[];
}

export interface UserPermission {
  action:
    | "create_trip"
    | "edit_trip"
    | "delete_trip"
    | "complete_trip"
    | "edit_completed_trip"
    | "delete_completed_trip"
    | "manage_investigations"
    | "view_reports"
    | "manage_system_costs";
  granted: boolean;
}

// --- Constants for form options ---

export const CLIENTS = [
  // ... [your full CLIENTS array here]
];

export const DRIVERS = [
  // ... [your full DRIVERS array here]
];

export const FLEET_NUMBERS = [
  // ... [your full FLEET_NUMBERS array here]
];

export const RESPONSIBLE_PERSONS = [
  // ... [your full RESPONSIBLE_PERSONS array here]
];

export const TRUCKS_WITH_PROBES = [...FLEET_NUMBERS];

export const CLIENT_TYPES = [
  { value: "internal", label: "Internal Client" },
  { value: "external", label: "External Client" }
];

export const ADDITIONAL_COST_TYPES = [
  { value: "demurrage", label: "Demurrage" },
  { value: "clearing_fees", label: "Clearing Fees" },
  { value: "toll_charges", label: "Toll Charges" },
  { value: "detention", label: "Detention" },
  { value: "escort_fees", label: "Escort Fees" },
  { value: "storage", label: "Storage" },
  { value: "other", label: "Other" }
];

export const DELAY_REASON_TYPES = [
  { value: "border_delays", label: "Border Delays" },
  { value: "breakdown", label: "Breakdown" },
  { value: "customer_not_ready", label: "Customer Not Ready" },
  { value: "paperwork_issues", label: "Paperwork Issues" },
  { value: "weather_conditions", label: "Weather Conditions" },
  { value: "traffic", label: "Traffic" },
  { value: "other", label: "Other" }
];

export const CONTACT_METHODS = [
  { value: "call", label: "Phone Call" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "in_person", label: "In Person" },
  { value: "sms", label: "SMS" }
];

export const MISSED_LOAD_REASONS = [
  { value: "no_vehicle", label: "No Vehicle Available" },
  { value: "late_response", label: "Late Response" },
  { value: "mechanical_issue", label: "Mechanical Issue" },
  { value: "driver_unavailable", label: "Driver Unavailable" },
  { value: "customer_cancelled", label: "Customer Cancelled" },
  { value: "rate_disagreement", label: "Rate Disagreement" },
  { value: "other", label: "Other" }
];

export const DRIVER_BEHAVIOR_EVENT_TYPES = [
  { value: "speeding", label: "Speeding", severity: "medium", points: 5 },
  { value: "harsh_braking", label: "Harsh Braking", severity: "medium", points: 3 },
  { value: "harsh_acceleration", label: "Harsh Acceleration", severity: "medium", points: 3 },
  { value: "idling", label: "Excessive Idling", severity: "low", points: 1 },
  { value: "route_deviation", label: "Route Deviation", severity: "medium", points: 4 },
  { value: "unauthorized_stop", label: "Unauthorized Stop", severity: "medium", points: 4 },
  { value: "fatigue_alert", label: "Fatigue Alert", severity: "high", points: 8 },
  { value: "phone_usage", label: "Phone Usage While Driving", severity: "high", points: 10 },
  { value: "seatbelt_violation", label: "Seatbelt Violation", severity: "high", points: 7 },
  { value: "other", label: "Other", severity: "medium", points: 2 }
];

export const CAR_INCIDENT_TYPES = [
  { value: "accident", label: "Accident" },
  { value: "traffic_violation", label: "Traffic Violation" }
];

// --- Placeholders for missing types referenced in the codebase ---
export interface ActionItem {
  id: string;
  title: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  attachments?: Attachment[];
}

export interface CostEntry extends CostData {}

export interface AdditionalCost extends CostData {}

export interface FlaggedCost extends CostData {
  flaggedReason?: string;
}

export interface MissedLoad {
  id: string;
  reason: string;
  date: string;
  fleetNumber?: string;
  driverName?: string;
}

export interface InvoiceAging {
  id: string;
  tripId: string;
  current: number;
  warning: number;
  critical: number;
  overdue: number;
  total: number;
  currency: string;
  lastFollowUpDate?: string;
}

export interface DriverBehaviorEvent {
  id: string;
  driverName: string;
  eventType: string;
  date: string;
  points?: number;
  severity?: string;
  notes?: string;
}

export type DriverBehaviorEventType = string;

export interface CARReport {
  id: string;
  driverName: string;
  incidentType: string;
  date: string;
  description?: string;
  attachments?: Attachment[];
}

export interface CustomerPerformance {
  id: string;
  clientName: string;
  retentionRate: number;
  lostClients: number;
  gainedClients: number;
  paymentReceivedDate?: string;
}

export const AGING_THRESHOLDS = [7, 14, 30, 60];
export const TRIP_DELETION_REASONS = [
  "Duplicate",
  "Test",
  "Cancelled",
  "Incorrect Data",
  "Other",
];
export interface DieselConsumptionRecord {
  id: string;
  tripId: string;
  liters: number;
  date: string;
  recordedBy: string;
}
export interface TripSummary {
  totalTrips: number;
  completedTrips: number;
  activeTrips: number;
  flaggedTrips: number;
  totalRevenue: number;
  totalCosts: number;
  averageDistance: number;
  averageDuration: number;
}
export interface TripDashboardData {
  activeTrips: Trip[];
  flaggedTrips: Trip[];
  completedTrips: Trip[];
  totalRevenue: number;
  totalCosts: number;
  averageDistance: number;
  averageDuration: number;
}
export interface TripDeletionRecord {
  id: string;
  tripId: string;
  deletedBy: string;
  deletedAt: string;
  reason: string;
  tripData: string;
  totalRevenue: number;
  totalCosts: number;
  costEntriesCount: number;
  flaggedItemsCount: number;
  deletionComments?: string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}
export const DEFAULT_SYSTEM_COST_RATES: Record<"USD" | "ZAR", SystemCostRates> = {
  USD: {
    currency: "USD",
    perKmCosts: { repairMaintenance: 0, tyreCost: 0 },
    perDayCosts: {
      gitInsurance: 0,
      shortTermInsurance: 0,
      trackingCost: 0,
      fleetManagementSystem: 0,
      licensing: 0,
      vidRoadworthy: 0,
      wages: 0,
      depreciation: 0,
    },
    lastUpdated: "",
    updatedBy: "",
    effectiveDate: "",
  },
  ZAR: {
    currency: "ZAR",
    perKmCosts: { repairMaintenance: 0, tyreCost: 0 },
    perDayCosts: {
      gitInsurance: 0,
      shortTermInsurance: 0,
      trackingCost: 0,
      fleetManagementSystem: 0,
      licensing: 0,
      vidRoadworthy: 0,
      wages: 0,
      depreciation: 0,
    },
    lastUpdated: "",
    updatedBy: "",
    effectiveDate: "",
  },
};
