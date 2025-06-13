export interface Trip {
  id: string;
  currency: 'USD' | 'ZAR';
  startDate: string;
  endDate: string;
  distanceKm?: number;
  costs: CostEntry[]; // <-- Add this line
  // ...other fields as needed
}

export interface CostEntry {
  tripId: string;
  category: string;
  subCategory: string;
  amount: number;
  currency: string;
  referenceNumber: string;
  date: string;
  notes: string;
  isFlagged: boolean;
  isSystemGenerated: boolean;
  systemCostType: string;
  calculationDetails: string;
  // id?: string;
  // attachments?: any[];
}

export interface SystemCostRates {
  currency: 'USD' | 'ZAR';
  effectiveDate: string;
  lastUpdated: string;
  updatedBy: string;
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
}

// Example default rates (adjust as needed)
export const DEFAULT_SYSTEM_COST_RATES: Record<'USD' | 'ZAR', SystemCostRates> = {
  USD: {
    currency: 'USD',
    effectiveDate: '2024-01-01',
    lastUpdated: '2024-01-01',
    updatedBy: 'admin',
    perKmCosts: {
      repairMaintenance: 0.1,
      tyreCost: 0.05,
    },
    perDayCosts: {
      gitInsurance: 5,
      shortTermInsurance: 3,
      trackingCost: 2,
      fleetManagementSystem: 4,
      licensing: 1,
      vidRoadworthy: 1,
      wages: 10,
      depreciation: 8,
    },
  },
  ZAR: {
    currency: 'ZAR',
    effectiveDate: '2024-01-01',
    lastUpdated: '2024-01-01',
    updatedBy: 'admin',
    perKmCosts: {
      repairMaintenance: 1.5,
      tyreCost: 0.8,
    },
    perDayCosts: {
      gitInsurance: 80,
      shortTermInsurance: 50,
      trackingCost: 30,
      fleetManagementSystem: 60,
      licensing: 15,
      vidRoadworthy: 15,
      wages: 120,
      depreciation: 100,
    },
  },
};

export interface Attachment {
  id: string;
  fileName: string;
  url: string;
  uploadedAt: string;
  // Add more fields as needed
}

// export type Attachment = Record<string, unknown>;

export interface AdditionalCost {
  description: string;
  amount: number;
  date: string;
  // Add more fields as needed
}

export interface DelayReason {
  reason: string;
  code?: string;
  // Add more fields as needed
}

export interface MissedLoad {
  id: string;
  tripId: string;
  reason: string;
  date: string;
  // Add more fields as needed
}

export interface ActionItem {
  id: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  completed: boolean;
  // Add more fields as needed
}

export interface CARReport {
  id: string;
  tripId: string;
  reportDetails: string;
  createdAt: string;
  // Add more fields as needed
}
export interface DieselConsumptionRecord {
  id: string;
  tripId: string;
  fuelStation: string;
  fleetNumber: string;
  totalCost: number;
  date: string;
  litresFilled: number;
  kmReading: number;
  notes?: string;
  currency?: string;
}
export interface DriverBehaviorEvent {
  id: string;
  driverName: string;
  eventDate: string;
  points?: number;
  carReportId?: string;
}