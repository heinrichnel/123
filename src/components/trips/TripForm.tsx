// ─── React ───────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';

// ─── Types & Constants ───────────────────────────────────────────
import { Trip, CLIENTS, DRIVERS } from '../../types';

// ─── UI Components ───────────────────────────────────────────────
import { Input, Select, Textarea } from '../ui/FormElements';
import Button from '../ui/Button';


interface TripFormProps {
  trip?: Trip;
  onSubmit: (tripData: Omit<Trip, 'id' | 'costs' | 'status'>) => void;
  onCancel: () => void;
}

const TripForm: React.FC<TripFormProps> = ({ trip, onSubmit, onCancel }) => {
  const [fleetNumber, setFleetNumber] = useState('');
  const [client, setClient] = useState('');
  const [driver, setDriver] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [distanceKm, setDistanceKm] = useState(0);
  const [baseRevenue, setBaseRevenue] = useState(0);
  const [revenueCurrency, setRevenueCurrency] = useState<'USD' | 'ZAR'>('ZAR');
  const [tripNotes, setTripNotes] = useState('');

  useEffect(() => {
    if (trip) {
      setFleetNumber(trip.fleetNumber || '');
      setClient(trip.client || '');
      setDriver(trip.driver || '');
      setOrigin(trip.origin || '');
      setDestination(trip.destination || '');
      setDistanceKm(trip.distanceKm || 0);
      setBaseRevenue(trip.baseRevenue || 0);
      setRevenueCurrency(trip.revenueCurrency || 'ZAR');
      setTripNotes(trip.tripNotes || '');
    }
  }, [trip]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      fleetNumber,
      client,
      driver,
      origin,
      destination,
      distanceKm,
      baseRevenue,
      revenueCurrency,
      tripNotes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Fleet Number" value={fleetNumber} onChange={e => setFleetNumber(e.target.value)} required />
        <Select
          label="Client"
          value={client}
          onChange={e => setClient(e.target.value)}
          options={CLIENTS.map(c => ({ label: c, value: c }))}
          required
        />
        <Select
          label="Driver"
          value={driver}
          onChange={e => setDriver(e.target.value)}
          options={DRIVERS.map(d => ({ label: d, value: d }))}
          required
        />
        <Input label="Origin" value={origin} onChange={e => setOrigin(e.target.value)} required />
        <Input label="Destination" value={destination} onChange={e => setDestination(e.target.value)} required />
        <Input
          label="Distance (KM)"
          type="number"
          value={distanceKm}
          onChange={e => setDistanceKm(Number(e.target.value))}
          required
        />
        <Input
          label="Base Revenue"
          type="number"
          value={baseRevenue}
          onChange={e => setBaseRevenue(Number(e.target.value))}
          required
        />
        <Select
          label="Revenue Currency"
          value={revenueCurrency}
          onChange={e => setRevenueCurrency(e.target.value as 'USD' | 'ZAR')}
          options={[
            { label: 'USD', value: 'USD' },
            { label: 'ZAR', value: 'ZAR' },
          ]}
          required
        />
      </div>

      <Textarea
        label="Trip Notes"
        value={tripNotes}
        onChange={e => setTripNotes(e.target.value)}
        rows={4}
      />

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{trip ? 'Update Trip' : 'Create Trip'}</Button>
      </div>
    </form>
  );
};

export default TripForm;
