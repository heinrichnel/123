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
  subCategory: string;
  currency: 'USD' | 'ZAR';
  referenceNumber: string;
  date: string;
  notes?: string;
  isFlagged: boolean;
  flagReason?: string;
  noDocumentReason?: string;
  investigationStatus?: 'pending' | 'in_progress' | 'resolved';
  flaggedAt?: string;
  flaggedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  investigationNotes?: string;
  isSystemGenerated: boolean;
  systemCostType?: string;
  calculationDetails?: string;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface FlaggedCost extends CostEntry {
  tripFleetNumber: string;
  tripRoute: string;
  tripDriverName: string;
}

export interface AdditionalCost {
  id: string;
  tripId: string;
  costType: string;
  amount: number;
  currency: 'USD' | 'ZAR';
  supportingDocuments: Attachment[];
  notes?: string;
  addedAt: string;
  addedBy: string;
}

export interface DelayReason {
  id: string;
  tripId: string;
  delayType: string;
  description: string;
  delayDuration: number;
  reportedAt: string;
  reportedBy: string;
  severity?: 'minor' | 'moderate' | 'major';
  date?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TripStatus = "active" | "flagged" | "completed" | "invoiced" | "paid";

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
  description?: string;
  tripDescription?: string;
  tripNotes?: string;
  costs: CostEntry[];
  additionalCosts: AdditionalCost[];
  delayReasons: DelayReason[];
  investigationNotes?: string;
  plannedArrivalDateTime?: string;
  plannedOffloadDateTime?: string;
  plannedDepartureDateTime?: string;
  actualArrivalDateTime?: string;
  actualOffloadDateTime?: string;
  actualDepartureDateTime?: string;
  finalArrivalDateTime?: string;
  finalOffloadDateTime?: string;
  finalDepartureDateTime?: string;
  followUpHistory?: any[];
  status: TripStatus;
  invoiceNumber?: string;
  invoiceSubmittedAt?: string;
  invoiceSubmittedBy?: string;
  invoiceDueDate?: string;
  invoiceDate?: string;
  paymentStatus?: "unpaid" | "partial" | "paid";
  paymentAmount?: number;
  paymentReceivedDate?: string;
  paymentMethod?: string;
  bankReference?: string;
  paymentNotes?: string;
  paymentUpdatedAt?: string;
  paymentUpdatedBy?: string;
  timelineValidated?: boolean;
  timelineValidatedAt?: string;
  timelineValidatedBy?: string;
  invoiceValidationNotes?: string;
  proofOfDelivery?: Attachment[];
  signedInvoice?: Attachment[];
  autoCompletedAt?: string;
  autoCompletedReason?: string;
  completedAt?: string;
  completedBy?: string;
  hasInvestigation?: boolean;
  investigationDate?: string;
  editHistory?: any[];
  lastFollowUpDate?: string;
}

// Missed Load Types
export interface MissedLoad {
  id: string;
  customerName: string;
  loadRequestDate: string;
  requestedPickupDate: string;
  requestedDeliveryDate: string;
  route: string;
  estimatedRevenue: number;
  currency: 'USD' | 'ZAR';
  reason: string;
  reasonDescription?: string;
  resolutionStatus: 'pending' | 'resolved' | 'lost_opportunity' | 'rescheduled';
  followUpRequired: boolean;
  competitorWon?: boolean;
  recordedBy: string;
  recordedAt: string;
  impact: 'low' | 'medium' | 'high';
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  compensationOffered?: number;
  compensationNotes?: string;
}

// Diesel Consumption Types
export interface DieselConsumptionRecord {
  id: string;
  fleetNumber: string;
  date: string;
  kmReading: number;
  previousKmReading?: number;
  distanceTravelled?: number;
  litresFilled: number;
  costPerLitre?: number;
  totalCost: number;
  fuelStation: string;
  driverName: string;
  notes?: string;
  tripId?: string;
  kmPerLitre?: number;
  currency?: 'USD' | 'ZAR';
  probeReading?: number;
  probeDiscrepancy?: number;
  probeVerified?: boolean;
  updatedAt?: string;
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
  changeType: "edit_completed_trip" | "update" | "status_change" | "completion" | "auto_completion";
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
  eventType: DriverBehaviorEventType;
  description: string;
  date?: string;
  eventDate: string;
  eventTime: string;
  location?: string;
  reportedBy: string;
  reportedAt: string;
  resolved?: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
  status: 'pending' | 'acknowledged' | 'resolved' | 'disputed';
  actionTaken?: string;
  attachments?: Attachment[];
  carReportId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  points: number;
}

export type DriverBehaviorEventType = 
  | 'speeding'
  | 'harsh_braking'
  | 'harsh_acceleration'
  | 'idling'
  | 'route_deviation'
  | 'unauthorized_stop'
  | 'fatigue_alert'
  | 'phone_usage'
  | 'seatbelt_violation'
  | 'other';

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
  behaviorScore: number; // Add this for compatibility
}

// Action Item Types
export interface ActionItem {
  id: string;
  title: string;
  description: string;
  responsiblePerson: string;
  startDate: string;
  dueDate: string;
  status: 'initiated' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  completedAt?: string;
  completedBy?: string;
  overdueReason?: string;
  attachments?: Attachment[];
  comments?: {
    id: string;
    comment: string;
    createdAt: string;
    createdBy: string;
  }[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// CAR Report Types
export interface CARReport {
  id: string;
  reportNumber: string;
  responsibleReporter: string;
  responsiblePerson: string;
  referenceEventId?: string;
  dateOfIncident: string;
  dateDue: string;
  clientReport: string;
  severity: 'low' | 'medium' | 'high';
  problemIdentification: string;
  causeAnalysisPeople?: string;
  causeAnalysisMaterials?: string;
  causeAnalysisEquipment?: string;
  causeAnalysisMethods?: string;
  causeAnalysisMetrics?: string;
  causeAnalysisEnvironment?: string;
  rootCauseAnalysis?: string;
  correctiveActions?: string;
  preventativeActionsImmediate?: string;
  preventativeActionsLongTerm?: string;
  financialImpact?: string;
  generalComments?: string;
  status: 'draft' | 'submitted' | 'in_progress' | 'completed';
  completedAt?: string;
  completedBy?: string;
  attachments?: Attachment[];
  createdAt?: string;
  updatedAt?: string;
  
  // Additional fields for compatibility
  driverName: string;
  fleetNumber: string;
  incidentDate: string;
  incidentTime: string;
  location: string;
  incidentType: 'accident' | 'traffic_violation';
  description: string;
  injuriesReported: boolean;
  policeInvolved: boolean;
  policeReportNumber?: string;
  witnessDetails?: string;
  actionsTaken: string;
  followUpRequired: boolean;
  followUpDate?: string;
}

// Invoice Aging Types
export interface InvoiceAging {
  tripId: string;
  invoiceNumber: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  currency: 'USD' | 'ZAR';
  agingDays: number;
  status: 'current' | 'warning' | 'critical' | 'overdue';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  lastFollowUp?: string;
}

// Customer Performance Types
export interface CustomerPerformance {
  customerName: string;
  totalTrips: number;
  totalRevenue: number;
  currency: 'USD' | 'ZAR';
  averagePaymentDays: number;
  paymentScore: number;
  lastTripDate: string;
  riskLevel: 'low' | 'medium' | 'high';
  isAtRisk: boolean;
  isProfitable: boolean;
  isTopClient: boolean;
  daysSinceLastTrip: number;
  clientType: string;
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
  "Nyamagay",
  "Marketing Export",
  "Export",
  "Marketing Export",
  "Marketing Local",
  "Burma Valey"
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
  "Other (specify in comments)"
];

export const TRIP_DELETION_REASONS = [
  "Duplicate",
  "Error",
  "Cancelled",
  "Other (specify in comments)"
];

export const AGING_THRESHOLDS = {
  ZAR: {
    current: { min: 0, max: 20 },
    warning: { min: 21, max: 29 },
    critical: { min: 30, max: 30 },
    overdue: { min: 31, max: Infinity }
  },
  USD: {
    current: { min: 0, max: 10 },
    warning: { min: 11, max: 13 },
    critical: { min: 14, max: 14 },
    overdue: { min: 15, max: Infinity }
  }
};

export const FOLLOW_UP_THRESHOLDS = {
  ZAR: 15, // days
  USD: 7   // days
};

export const COST_CATEGORIES: Record<string, string[]> = {
  "Border Costs": [
    'Beitbridge Border Fee', 'Gate Pass', 'Coupon', 'Carbon Tax Horse', 'CVG Horse', 'CVG Trailer',
    'Insurance (1 Month Horse)', 'Insurance (3 Months Trailer)', 'Insurance (2 Months Trailer)',
    'Insurance (1 Month Trailer)', 'Carbon Tax (3 Months Horse)', 'Carbon Tax (2 Months Horse)',
    'Carbon Tax (1 Month Horse)', 'Carbon Tax (3 Months Trailer)', 'Carbon Tax (2 Months Trailer)',
    'Carbon Tax (1 Month Trailer)', 'Road Access', 'Bridge Fee', 'Road Toll Fee', 'Counseling Leavy',
    'Transit Permit Horse', 'Transit Permit Trailer', 'National Road Safety Fund Horse',
    'National Road Safety Fund Trailer', 'Electronic Seal', 'EME Permit', 'Zim Clearing',
    'Zim Supervision', 'SA Clearing', 'Runner Fee Beitbridge', 'Runner Fee Zambia Kazungula',
    'Runner Fee Chirundu'
  ],
  "Parking": [
    'Bubi', 'Lunde', 'Mvuma', 'Gweru', 'Kadoma', 'Chegutu', 'Norton', 'Harare', 'Ruwa',
    'Marondera', 'Rusape', 'Mutare', 'Nyanga', 'Bindura', 'Shamva', 'Centenary', 'Guruve',
    'Karoi', 'Chinhoyi', 'Kariba', 'Hwange', 'Victoria Falls', 'Bulawayo', 'Gwanda',
    'Beitbridge', 'Masvingo', 'Zvishavane', 'Shurugwi', 'Kwekwe'
  ],
  "Diesel": [
    'ACM Petroleum Chirundu - Reefer', 'ACM Petroleum Chirundu - Horse', 'RAM Petroleum Harare - Reefer',
    'RAM Petroleum Harare - Horse', 'Engen Beitbridge - Reefer', 'Engen Beitbridge - Horse',
    'Shell Mutare - Reefer', 'Shell Mutare - Horse', 'BP Bulawayo - Reefer', 'BP Bulawayo - Horse',
    'Total Gweru - Reefer', 'Total Gweru - Horse', 'Puma Masvingo - Reefer', 'Puma Masvingo - Horse',
    'Zuva Petroleum Kadoma - Reefer', 'Zuva Petroleum Kadoma - Horse', 'Mobil Chinhoyi - Reefer',
    'Mobil Chinhoyi - Horse', 'Caltex Kwekwe - Reefer', 'Caltex Kwekwe - Horse',
    'ACM Petroleum Chirundu (Zambia)', 'Adami\'s Fuel Cradock (Sa)', 'African Truck Stop JHB (Sa)',
    'Beitbridge Depot (Afric Oil) (Zim)', 'BF Distributors/Caltex Polokwane (Sa)', 'Bomponi',
    'Brandhill', 'Bulawayo Depot', 'Bulawayo Drum', 'Burma Estate', 'Burma Valley depot',
    'Energy Park Nyamapgay (Zimbabwe)', 'Energy ParkPetrol (Zimbabwe)', 'Engen Beaufort West (Sa)',
    'Engen Gaborone (Botswana)', 'Engen Kazangula (Botswana)', 'Fangdui', 'Fuel 1 Kraaifontein',
    'Fuel 1 Retail Belville Cape Town (Sa)', 'G FUEL', 'G Fuel Bulawayo (Zimbabwe)',
    'Harare Truck Stop (Zimbabwe)', 'HASS Petroleum Kasumbalesa (Zambia)',
    'Industry Petroleum (Pty) Ltd - Musina', 'KK Service (Zimbabwe)', 'Korridor Chingola Truck Stop (Zambia)',
    'Korridor Kapiri Mposhi Truck Stop (Zambia)', 'Korridor Livingstone Truck Stop (Zambia)',
    'Korridor Lusaka Truck Stop (Zambia)', 'Kwa Nokeng Francistown', 'Kwa Nokeng Kazungula',
    'Kwa Nokeng Martins Drift', 'Lemba Truck Stop Louise Trichardt', 'MBT Zeerust Truckstop (Sa)',
    'TOTAL ENERGIES', 'Tswana Fuel Kazungula (Botswana)', 'Wine Routes Truck Stop (Sa)',
    'Xtreme Harare (Zimbabwe)', 'Zuva Harare (Zimbabwe)', 'Others'
  ],
  "Non-Value-Added Costs": [
    'Fines', 'Penalties', 'Passport Stamping', 'Push Documents', 'Jump Queue', 'Dismiss Inspection',
    'Parcels', 'Labour'
  ],
  "Trip Allowances": ['Food', 'Airtime', 'Taxi'],
  "Tolls": [
    'Tolls BB to JHB', 'Tolls Cape Town to JHB', 'Tolls JHB to CPT', 'Tolls Mutare to BB',
    'Tolls JHB to Martinsdrift', 'Tolls BB to Harare', 'Tolls Zambia',
    'Mutare - Harare', 'Harare - Mutare', 'Harare - CBC', 'CBC - Harare',
    'Mutare - Bulawayo', 'Bulawayo - Mutare', 'Bulawayo - Chipinge',
    'Chipinge - Bulawayo', 'Mutare - Nyanga', 'Mutare - Chipinge', 'Chipinge - Mutare'
  ],
  "Fuel": [
    "Diesel",
    "Petrol",
    "AdBlue",
    "Fuel Card Charges",
    "Fuel Discrepancy",
    "Emergency Fuel"
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
  "System Costs": [
    "Repair & Maintenance per KM",
    "Tyre Cost per KM",
    "GIT Insurance",
    "Short-Term Insurance",
    "Tracking Cost",
    "Fleet Management System",
    "Licensing",
    "VID / Roadworthy",
    "Wages",
    "Depreciation"
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
    lastUpdated: new Date().toISOString(),
    updatedBy: 'System Default',
    effectiveDate: new Date().toISOString(),
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
    lastUpdated: new Date().toISOString(),
    updatedBy: 'System Default',
    effectiveDate: new Date().toISOString(),
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

// List of fuel stations for dropdown
export const FUEL_STATIONS = [
  'ACM Petroleum Chirundu (Zambia)',
  'Adami\'s Fuel Cradock (Sa)',
  'African Truck Stop JHB (Sa)',
  'Beitbridge Depot (Afric Oil) (Zim)',
  'BF Distributors/Caltex Polokwane (Sa)',
  'Bomponi',
  'Brandhill',
  'Bulawayo Depot',
  'Bulawayo Drum',
  'Burma Estate',
  'Burma Valley depot',
  'Energy Park Nyamapgay (Zimbabwe)',
  'Energy ParkPetrol (Zimbabwe)',
  'Engen Beaufort West (Sa)',
  'Engen Gaborone (Botswana)',
  'Engen Kazangula (Botswana)',
  'Fangdui',
  'Fuel 1 Kraaifontein',
  'Fuel 1 Retail Belville Cape Town (Sa)',
  'G FUEL',
  'G Fuel Bulawayo (Zimbabwe)',
  'Harare Truck Stop (Zimbabwe)',
  'HASS Petroleum Kasumbalesa (Zambia)',
  'Industry Petroleum (Pty) Ltd - Musina',
  'KK Service (Zimbabwe)',
  'Korridor Chingola Truck Stop (Zambia)',
  'Korridor Kapiri Mposhi Truck Stop (Zambia)',
  'Korridor Livingstone Truck Stop (Zambia)',
  'Korridor Lusaka Truck Stop (Zambia)',
  'Kwa Nokeng Francistown',
  'Kwa Nokeng Kazungula',
  'Kwa Nokeng Martins Drift',
  'Lemba Truck Stop Louise Trichardt',
  'MBT Zeerust Truckstop (Sa)',
  'TOTAL ENERGIES',
  'Tswana Fuel Kazungula (Botswana)',
  'Wine Routes Truck Stop (Sa)',
  'Xtreme Harare (Zimbabwe)',
  'Zuva Harare (Zimbabwe)',
  'Others'
];