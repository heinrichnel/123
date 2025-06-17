export interface CostData {
  id: string;
  amount: number;
  category: string;
  referenceNumber?: string;
  isFlagged?: boolean;
  attachments?: { id: string }[];
  // ...any other fields you're using
}

export interface DelayReason {
  delayDuration: number;
  reason: string;
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
  revenueCurrency: string;
  distanceKm: number;
  clientType: 'internal' | 'external';
  costs: CostData[];
  additionalCosts: CostData[];
  delayReasons: DelayReason[];
  investigationNotes?: string;
  plannedArrivalDateTime?: string;
  actualArrivalDateTime?: string;
  followUpHistory?: any[]; // Replace `any` with a proper type if possible
  // ...anything else you access on Trip
}

// Example usage inside a React component's JSX:
import React from 'react';

export const ExampleInput: React.FC = () => {
  return React.createElement('input', {
    type: 'text',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      // handle the change event here
      console.log(e.target.value);
    }
  });
};
// ─── Constants for Fleet Numbers, etc. ─────────────────────────────

export const FLEET_NUMBERS = [
  "TRK-001", "TRK-002", "TRK-003", "TRK-004", "TRK-005",
  "TRK-006", "TRK-007", "TRK-008", "TRK-009", "TRK-010"
];

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, ...props }) => (
  <div className="flex flex-col">
    {label && <label className="mb-1 font-medium">{label}</label>}
    <textarea {...props} className="border rounded p-2 focus:ring" />
  </div>
);
