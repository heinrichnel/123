// ------------------ Interfaces ------------------

export interface Attachment {
  id: string;
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
  status?: "active" | "flagged" | "completed";
  description?: string;
  attachments?: Attachment[];
  invoiceNumber?: string;
  invoiceSubmittedAt?: string;
  invoiceDueDate?: string;
  paymentStatus?: "unpaid" | "partial" | "paid";
  completedAt?: string;
  actualOffloadDateTime?: string;
  plannedOffloadDateTime?: string;
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

export interface MissedLoad {
  id: string;
  reason: string;
  client: string;
  createdAt: string;
}

export interface InvoiceAging {
  tripId: string;
  agingDays: number;
}

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

// ------------------ Constants ------------------

export const TRIP_EDIT_REASONS = [
  "Incorrect Date",
  "Client Request",
  "Driver Change",
  "Revenue Adjustment",
  "Other",
];

export const TRIP_DELETION_REASONS = [
  "Duplicate",
  "Test Trip",
  "Invalid Data",
  "Client Canceled",
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

export const AGING_THRESHOLDS = [15, 30, 45, 60];

export const FOLLOW_UP_THRESHOLDS = {
  pending: 7,
  flagged: 14,
  resolved: 30,
};

export const MISSED_LOAD_REASONS = [
  "Vehicle Breakdown",
  "Driver Unavailable",
  "Customer Canceled",
  "Route Issue",
  "Other",
];

export const CLIENTS = ["Client A", "Client B", "Client C"];
