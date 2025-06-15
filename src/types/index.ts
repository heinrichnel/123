// -------------------- Interfaces --------------------

export interface Attachment {
  id: string;
}

export interface SimpleCostData {
  fuel: number;
  tolls: number;
  other: number;
}

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
}

export interface DelayReason {
  delayDuration: number;
  reason: string;
  delayType?: string;
  description?: string;
  id?: string;
}

export type TripStatus = "active" | "flagged" | "completed";

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
  costs: CostData[];
  additionalCosts: CostData[];
  delayReasons: DelayReason[];
  investigationNotes?: string;
  status?: TripStatus;
  attachments?: Attachment[];
  [key: string]: any;
}

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
  deletionComments?: string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

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

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "operator";
  permissions: UserPermission[];
}

export interface UserPermission {
  action: string;
  granted: boolean;
}

export interface InvoiceAging {
  tripId: string;
  daysOutstanding: number;
}

export interface MissedLoad {
  id: string;
  fleetNumber: string;
  client: string;
  reason: string;
  createdAt: string;
}

export interface ActionItem {
  id: string;
  description: string;
  status: string;
  responsible: string;
  dueDate: string;
}

// -------------------- Constants --------------------

export const TRIP_EDIT_REASONS = [
  "Incorrect Date",
  "Client Request",
  "Driver Change",
  "Revenue Adjustment",
  "Other",
];

export const TRIP_DELETION_REASONS = [
  "Duplicate Entry",
  "Error in Data",
  "Client Cancelled",
  "Other",
];

export const CLIENT_TYPES = [
  { value: "internal", label: "Internal Client" },
  { value: "external", label: "External Client" },
];

export const ADDITIONAL_COST_TYPES = [
  { value: "demurrage", label: "Demurrage" },
  { value: "clearing_fees", label: "Clearing Fees" },
  { value: "toll_charges", label: "Toll Charges" },
  { value: "detention", label: "Detention" },
  { value: "escort_fees", label: "Escort Fees" },
  { value: "storage", label: "Storage" },
  { value: "other", label: "Other" },
];

export const DELAY_REASON_TYPES = [
  { value: "border_delays", label: "Border Delays" },
  { value: "breakdown", label: "Breakdown" },
  { value: "customer_not_ready", label: "Customer Not Ready" },
  { value: "paperwork_issues", label: "Paperwork Issues" },
  { value: "weather_conditions", label: "Weather Conditions" },
  { value: "traffic", label: "Traffic" },
  { value: "other", label: "Other" },
];

export const MISSED_LOAD_REASONS = [
  "Breakdown",
  "Delays",
  "Client Cancellation",
  "Driver Absent",
  "Other",
];

export const AGING_THRESHOLDS = {
  overdue: 30,
  warning: 15,
};

export const FOLLOW_UP_THRESHOLDS = {
  red: 10,
  orange: 5,
};

export const SYSTEM_COST_RATES = {
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

export const FLEET_NUMBERS = [
  "TRUCK-001", "TRUCK-002", "TRUCK-003", "TRUCK-004", "TRUCK-005"
];

export const CLIENTS = [
  "Client A", "Client B", "Client C", "Client D"
];

export const TRUCKS_WITH_PROBES = [
  "TRUCK-001",
  "TRUCK-002",
  "TRUCK-007",
  "TRUCK-010"
];

export const DRIVERS = [
  "John Doe",
  "Jane Smith",
  "Mike Brown",
  "Susan Lee"
];

export const COST_CATEGORIES = [
  "Fuel",
  "Tolls",
  "Maintenance",
  "Repairs",
  "Tyres",
  "Licensing",
  "Insurance",
  "Tracking",
  "Fines",
  "Other"
];

export const RESPONSIBLE_PERSONS = [
  "Fleet Manager",
  "Driver",
  "Operations",
  "Finance",
  "Maintenance",
  "Security",
  "Other"
];

export const DEFAULT_SYSTEM_COST_RATES: Record<"USD" | "ZAR", SystemCostRates> = SYSTEM_COST_RATES;
export const DEFAULT_SYSTEM_COST_RATES_ZAR: SystemCostRates = {
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
};
