import React, { useState } from "react";
import { Trip } from "../types/Trip";

const TripDashboard: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);

  const addTrip = (trip: Trip) => setTrips(prev => [...prev, trip]);
  const editTrip = (id: string, updated: Partial<Trip>) =>
    setTrips(prev =>
      prev.map(trip => (trip.id === id ? { ...trip, ...updated } : trip))
    );
  const flagTrip = (id: string, reason: string) =>
    editTrip(id, { status: "flagged", flagReason: reason });
  const resolveFlag = (id: string) =>
    editTrip(id, { resolved: true });
  const completeTrip = (id: string) =>
    setTrips(prev =>
      prev.map(trip =>
        trip.id === id && trip.resolved
          ? { ...trip, status: "completed" }
          : trip
      )
    );

  const activeTrips = trips.filter(t => t.status === "active");
  const flaggedTrips = trips.filter(t => t.status === "flagged");
  const completedTrips = trips.filter(t => t.status === "completed");

  return (
    <div>
      <h2>Active Trips</h2>
      <ul>
        {activeTrips.map(trip => (
          <li key={trip.id}>
            {trip.destination} - {trip.date} - Cost: {trip.cost.fuel + trip.cost.tolls + trip.cost.other}
            <button onClick={() => flagTrip(trip.id, "Example reason")}>Flag</button>
            <button onClick={() => editTrip(trip.id, { cost: { ...trip.cost, fuel: trip.cost.fuel + 10 } })}>Edit Cost</button>
          </li>
        ))}
      </ul>
      <h2>Flagged Trips</h2>
      <ul>
        {flaggedTrips.map(trip => (
          <li key={trip.id}>
            {trip.destination} - Reason: {trip.flagReason}
            <button onClick={() => resolveFlag(trip.id)}>Resolve</button>
            <button onClick={() => completeTrip(trip.id)} disabled={!trip.resolved}>Complete</button>
          </li>
        ))}
      </ul>
      <h2>Completed Trips</h2>
      <ul>
        {completedTrips.map(trip => (
          <li key={trip.id}>{trip.destination} - {trip.date}</li>
        ))}
      </ul>
    </div>
  );
};

export default TripDashboard;