// src/types/index.ts

// Base types for the application
export interface Attachment {
  id: string;
  costEntryId?: string;
  filename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  fileData: string;
}

export interface CostEntry {
  id: string;
  tripId: string;
  amount: number;
  category: string;
  subcategory?: string;
  description?: string;
  date: string;
  referenceNumber?: string;
  isFlagged?: boolean;
  isSystemGenerated?: boolean;
  investigationStatus?: 'pending' | 'in_progress' | 'resolved';
  flaggedAt?: string;
  resolvedAt?: string;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
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

export interface AdditionalCost {
  id: string;
  tripId: string;
  type: string;
  amount: number;
  currency: 'USD' | 'ZAR';
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface DelayReason {
  id: string;
  tripId: string;
  delayDuration: number;
  reason: string;
  delayType?: string;
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
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
  costs: CostEntry[];
  additionalCosts: AdditionalCost[];
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

// Missed Load Types
export interface MissedLoad {
  id: string;
  clientName: string;
  route: string;
  loadDate: string;
  reason: string;
  reasonDescription?: string;
  potentialRevenue: number;
  currency: 'USD' | 'ZAR';
  followUpRequired: boolean;
  followUpDate?: string;
  followUpNotes?: string;
  compensationOffered: boolean;
  compensationAmount?: number;
  compensationNotes?: string;
  status: 'open' | 'resolved' | 'cancelled';
  resolutionDate?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Diesel Consumption Types
export interface DieselConsumptionRecord {
  id: string;
  driverName: string;
  fleetNumber: string;
  date: string;
  startOdometer: number;
  endOdometer: number;
  distanceTraveled: number;
  dieselPurchased: number;
  fuelEfficiency: number;
  route?: string;
  tripId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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

// Driver Behavior Event Type
export interface DriverBehaviorEvent {
  id: string;
  driverName: string;
  fleetNumber: string;
  eventType: string; // e.g., 'Fuel Discrepancy', 'Speeding', etc.
  description: string;
  date: string;
  eventDate?: string;
  eventTime?: string;
  location?: string;
  reportedBy?: string;
  reportedAt?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
  status?: 'open' | 'in_progress' | 'resolved';
  actionTaken?: string;
  attachments?: Attachment[];
  carReportId?: string;
  severity?: 'low' | 'medium' | 'high';
}

// Driver Performance Types
export interface DriverPerformance {
  driverName: string;
  fleetNumber: string;
  totalEvents: number;
  resolvedEvents: number;
  pendingEvents: number;
  averageResolutionTime: number; // in days
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  performanceScore: number; // calculated score out of 100
  lastEventDate?: string;
  improvementTrend: 'improving' | 'stable' | 'declining';
}

// Action Item Types
export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo: string;
  dueDate: string;
  category: string;
  relatedTripId?: string;
  relatedDriverName?: string;
  relatedFleetNumber?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

// CAR Report Types
export interface CARReport {
  id: string;
  driverName: string;
  fleetNumber: string;
  incidentDate: string;
  incidentTime: string;
  location: string;
  incidentType: 'accident' | 'traffic_violation';
  description: string;
  severity: 'minor' | 'moderate' | 'severe';
  injuriesReported: boolean;
  policeInvolved: boolean;
  policeReportNumber?: string;
  witnessDetails?: string;
  actionsTaken: string;
  followUpRequired: boolean;
  followUpDate?: string;
  status: 'open' | 'under_investigation' | 'resolved';
  investigationNotes?: string;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  resolvedAt?: string;
  resolvedBy?: string;
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

export const COST_CATEGORIES: Record<string, string[]> = {
  "Fuel": [
    "Diesel",
    "Petrol",
    "AdBlue",
    "Fuel Card Charges",
    "Fuel Discrepancy",
    "Emergency Fuel"
  ],
  "Tolls": [
    "Highway Tolls",
    "Bridge Tolls",
    "Border Tolls",
    "City Tolls",
    "Electronic Toll Collection"
  ],
  "Maintenance": [
    "Scheduled Service",
    "Oil Change",
    "Filter Replacement",
    "Brake Service",
    "Transmission Service",
    "Preventive Maintenance"
  ],
  "Repairs": [
    "Engine Repair",
    "Transmission Repair",
    "Brake Repair",
    "Electrical Repair",
    "Body Repair",
    "Emergency Repair",
    "Tyre Replacement",
    "Battery Replacement"
  ],
  "Insurance": [
    "Vehicle Insurance",
    "Cargo Insurance",
    "Third Party Insurance",
    "Comprehensive Insurance",
    "Insurance Excess"
  ],
  "Other": [
    "Parking Fees",
    "Fines",
    "Permits",
    "Documentation",
    "Accommodation",
    "Meals",
    "Communication",
    "Miscellaneous"
  ]
};

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

export const DEFAULT_SYSTEM_COST_REMINDER: SystemCostReminder = {
  id: 'default',
  nextReminderDate: new Date().toISOString(),
  lastReminderDate: '',
  reminderFrequencyDays: 30,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};