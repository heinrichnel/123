export interface CostData {
  fuel: number;
  tolls: number;
  other: number;
}

export type TripStatus = "active" | "flagged" | "completed";

export interface Trip {
  id: string;
  destination: string;
  date: string;
  cost: CostData;
  status: TripStatus;
  flagReason?: string;
  resolved?: boolean;
}