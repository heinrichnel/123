// ─── React ───────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';

// ─── Types & Constants ───────────────────────────────────────────
import { Trip, CLIENTS, DRIVERS } from '../../types';

// ─── UI Components ───────────────────────────────────────────────
import { Input, Select, Textarea } from '../ui/FormElements';
import Button from '../ui/Button';


interface ActiveTripsProps {
  trips: Trip[];
  onView: (trip: Trip) => void;
  onEdit: (trip: Trip) => void;
  onDelete: (id: string) => void;
  onCompleteTrip: (tripId: string) => void;
}

const ActiveTrips: React.FC<ActiveTripsProps> = ({
  trips,
  onView,
  onEdit,
  onDelete,
  onCompleteTrip,
}) => {
  return (
    <div>
      {trips.map((trip) => {
        const unresolvedFlags = trip.costs?.some(
          (cost) => cost.isFlagged && cost.investigationStatus !== "resolved"
        );
        const canComplete = !unresolvedFlags;

        return (
          <div key={trip.id} className="trip-card p-4 border rounded mb-4">
            <h3 className="font-semibold">{trip.fleetNumber}</h3>
            <p>{trip.route}</p>

            <button onClick={() => onView(trip)}>View</button>
            <button onClick={() => onEdit(trip)}>Edit</button>
            <button onClick={() => onDelete(trip.id)}>Delete</button>

            <button
              disabled={!canComplete}
              onClick={() => {
                if (canComplete) {
                  onCompleteTrip(trip.id);
                } else {
                  alert("Cannot complete trip: Resolve all flagged costs first.");
                }
              }}
              className={`ml-2 px-3 py-1 rounded ${
                canComplete
                  ? "bg-green-500 text-white"
                  : "bg-gray-400 text-gray-700 cursor-not-allowed"
              }`}
            >
              Complete Trip
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ActiveTrips;
