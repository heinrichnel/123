// src/types/index.ts

// Base types for the application
export interface Attachment {
  id: string;
  // add other fields if needed
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
  // ...add any other fields referenced in your code
}

// System Cost Configuration Types
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

// Audit Trail Types
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

// User Permission Types
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

// Constants for form options
export const CLIENTS = [
  "Teralco",
  "SPF",
  "Deep Catch",
  "DS Healthcare",
  "HFR",
  "Aspen",
  "DP World",
  "FX Logistics",
  "Feedmix",
  "ETG",
  "National Foods",
  "Mega Market",
  "Crystal Candy",
  "Trade Clear Logistics",
  "Steainweg",
  "Agrouth",
  "Emmands",
  "Falcon Gate",
  "FreightCo",
  "Tarondale",
  "Makandi",
  "FWZCargo",
  "Kroots",
  "Crake Valley",
  "Cains",
  "Big Dutcheman",
  "Jacobs",
  "Jacksons",
  "Pacibrite",
  "Vector",
  "Du-roi",
  "Sunside Seedlings",
  "Massmart",
  "Dacher (Pty) Ltd.",
  "Shoprite",
  "Lesaffre",
  "Westfalia",
  "Everfresh",
  "Rezende Retail",
  "Rezende Retail Vendor",
  "Rezende Vendor",
  "Bulawayo Retail",
  "Bulawayo Retail Vendor",
  "Bulawayo Vendor"
];

export const DRIVERS = [
  "Enock Mukonyerwa",
  "Jonathan Bepete",
  "Lovemore Qochiwe",
  "Peter Farai",
  "Phillimon Kwarire",
  "Taurayi Vherenaisi",
  "Adrian Moyo",
  "Canaan Chipfurutse",
  "Doctor Kondwani",
  "Biggie Mugwa",
  "Luckson Tanyanyiwa",
  "Wellington Musumbu",
  "Decide Murahwa"
];

export const FLEET_NUMBERS = [
  "4H",
  "6H",
  "UD",
  "29H",
  "30H",
  "21H",
  "22H",
  "23H",
  "24H",
  "26H",
  "28H",
  "31H",
  "32H",
  "33H"
];

export const RESPONSIBLE_PERSONS = [
  "Fleet Manager",
  "Operations Manager",
  "Safety Officer",
  "Maintenance Supervisor",
  "Driver Supervisor",
  "Quality Assurance Manager",
  "Compliance Officer",
  "HR Manager",
  "Finance Manager",
  "General Manager",
  "Enock Mukonyerwa",
  "Jonathan Bepete",
  "Lovemore Qochiwe",
  "Peter Farai",
  "Phillimon Kwarire",
  "Taurayi Vherenaisi",
  "Adrian Moyo",
  "Canaan Chipfurutse",
  "Doctor Kondwani",
  "Biggie Mugwa",
  "Luckson Tanyanyiwa",
  "Wellington Musumbu",
  "Decide Murahwa"
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

export const TRIP_EDIT_REASONS = [
  "Correction",
  "Update",
  "Admin Edit",
  "Other"
];

export const TRIP_DELETION_REASONS = [
  "Duplicate",
  "Error",
  "Cancelled",
  "Other"
];

export const AGING_THRESHOLDS = [7, 14, 30, 60, 90];
export const FOLLOW_UP_THRESHOLDS = [3, 7, 14];

export const COST_CATEGORIES = [
  "Fuel",
  "Tolls",
  "Maintenance",
  "Repairs",
  "Insurance",
  "Other"
];

export const DEFAULT_SYSTEM_COST_RATES: Record<'USD' | 'ZAR', SystemCostRates> = {
  USD: {
    currency: 'USD',
    perKmCosts: {
      repairMaintenance: 0.15,
      tyreCost: 0.10,
    },
    perDayCosts: {
      gitInsurance: 5,
      shortTermInsurance: 3,
      trackingCost: 2,
      fleetManagementSystem: 1,
      licensing: 1,
      vidRoadworthy: 0.5,
      wages: 20,
      depreciation: 10,
    },
    lastUpdated: '',
    updatedBy: '',
    effectiveDate: '',
  },
  ZAR: {
    currency: 'ZAR',
    perKmCosts: {
      repairMaintenance: 2.5,
      tyreCost: 1.8,
    },
    perDayCosts: {
      gitInsurance: 80,
      shortTermInsurance: 60,
      trackingCost: 40,
      fleetManagementSystem: 20,
      licensing: 15,
      vidRoadworthy: 10,
      wages: 300,
      depreciation: 150,
    },
    lastUpdated: '',
    updatedBy: '',
    effectiveDate: '',
  },
};
