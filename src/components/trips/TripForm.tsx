// ─── React ───────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';

// ─── Types & Constants ───────────────────────────────────────────
import { Trip, CLIENTS, DRIVERS, CLIENT_TYPES,FLEET_NUMBERS } from '../../types';

// ─── UI Components ───────────────────────────────────────────────
import { Input, Select, TextArea } from '../ui/FormElements';
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
  const [clientType, setClientType] = useState<'internal' | 'external'>('external');
  const [route, setRoute] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tripDescription, setTripDescription] = useState('');
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (trip) {
      setFleetNumber(trip.fleetNumber || '');
      setClient(trip.clientName || '');
      setDriver(trip.driverName || '');
      setRoute(trip.route || '');
      setStartDate(trip.startDate || '');
      setEndDate(trip.endDate || '');
      setClientType(trip.clientType || 'external');
      setDistanceKm(trip.distanceKm || 0);
      setBaseRevenue(trip.baseRevenue || 0);
      setRevenueCurrency(trip.revenueCurrency || 'ZAR');
      setTripDescription(trip.tripDescription || '');
      setTripNotes(trip.tripNotes || '');
    }
  }, [trip]);

  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    if (!clientType) newErrors.clientType = 'Client Type is required';
    if (!fleetNumber.trim()) newErrors.fleetNumber = 'Fleet Number is required';
    if (!client.trim()) newErrors.client = 'Client is required';
    if (!driver.trim()) newErrors.driver = 'Driver is required';
    if (!route.trim()) newErrors.route = 'Route is required';
    if (!startDate) newErrors.startDate = 'Start Date is required';
    if (!endDate) {
      newErrors.endDate = 'End Date is required';
    } else if (startDate && endDate < startDate) {
      newErrors.endDate = 'End Date cannot be earlier than Start Date';
    }
    if (!distanceKm || distanceKm <= 0) newErrors.distanceKm = 'Distance must be greater than 0';
    if (!baseRevenue || baseRevenue <= 0) newErrors.baseRevenue = 'Base Revenue must be greater than 0';
    if (!revenueCurrency) newErrors.revenueCurrency = 'Currency is required';
    if (!tripDescription.trim()) newErrors.tripDescription = 'Trip Description is required';
    return newErrors;
  };

  useEffect(() => {
    setErrors(validate());
  }, [clientType, fleetNumber, client, driver, route, startDate, endDate, distanceKm, baseRevenue, revenueCurrency, tripDescription]);

  const isFormValid = Object.keys(errors).length === 0;

  const handleBlur = (field: string) => {
    setTouched(t => ({ ...t, [field]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    setTouched({
      clientType: true,
      fleetNumber: true,
      client: true,
      driver: true,
      route: true,
      startDate: true,
      endDate: true,
      distanceKm: true,
      baseRevenue: true,
      revenueCurrency: true,
      tripDescription: true,
    });
    if (Object.keys(validationErrors).length > 0) return;
    onSubmit({
      clientType,
      fleetNumber,
      clientName: client,
      driverName: driver,
      route,
      startDate,
      endDate,
      distanceKm,
      baseRevenue,
      revenueCurrency,
      tripDescription,
      tripNotes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Client Type"
          value={clientType}
          onChange={val => setClientType(val as 'internal' | 'external')}
          onBlur={() => handleBlur('clientType')}
          options={CLIENT_TYPES}
          required
          error={touched.clientType && errors.clientType}
        />
        <Select
          label="Fleet Number"
          value={fleetNumber}
          onChange={val => setFleetNumber(val)}
          onBlur={() => handleBlur('fleetNumber')}
          options={[{ label: 'Select fleet number...', value: '' }, ...FLEET_NUMBERS.map(f => ({ label: f, value: f }))]}
          required
          error={touched.fleetNumber && errors.fleetNumber}
        />
        <Select
          label="Client"
          value={client}
          onChange={val => setClient(val)}
          onBlur={() => handleBlur('client')}
          options={[{ label: 'Select client...', value: '' }, ...CLIENTS.map(c => ({ label: c, value: c }))]}
          required
          error={touched.client && errors.client}
        />
        <Select
          label="Driver"
          value={driver}
          onChange={val => setDriver(val)}
          onBlur={() => handleBlur('driver')}
          options={[{ label: 'Select driver...', value: '' }, ...DRIVERS.map(d => ({ label: d, value: d }))]}
          required
          error={touched.driver && errors.driver}
        />
        <Input label="Route (semicolon separated)" value={route} onChange={val => setRoute(val)} onBlur={() => handleBlur('route')} required error={touched.route && errors.route} placeholder="e.g. Harare;Bulawayo;Gweru" />
        <Input label="Start Date" type="date" value={startDate} onChange={val => setStartDate(val)} onBlur={() => handleBlur('startDate')} required error={touched.startDate && errors.startDate} />
        <Input label="End Date" type="date" value={endDate} onChange={val => setEndDate(val)} onBlur={() => handleBlur('endDate')} required error={touched.endDate && errors.endDate} />
        <Input
          label="Distance (KM)"
          type="number"
          value={distanceKm === 0 ? '' : distanceKm}
          onChange={val => setDistanceKm(val === '' ? 0 : Number(val))}
          onBlur={() => handleBlur('distanceKm')}
          required
          error={touched.distanceKm && errors.distanceKm}
        />
        <Input
          label="Base Revenue"
          type="number"
          value={baseRevenue === 0 ? '' : baseRevenue}
          onChange={val => setBaseRevenue(val === '' ? 0 : Number(val))}
          onBlur={() => handleBlur('baseRevenue')}
          required
          error={touched.baseRevenue && errors.baseRevenue}
        />
        <Select
          label="Revenue Currency"
          value={revenueCurrency}
          onChange={val => setRevenueCurrency(val as 'USD' | 'ZAR')}
          onBlur={() => handleBlur('revenueCurrency')}
          options={[
            { label: 'USD', value: 'USD' },
            { label: 'ZAR', value: 'ZAR' },
          ]}
          required
          error={touched.revenueCurrency && errors.revenueCurrency}
        />
      </div>
      <TextArea
        label="Trip Description"
        value={tripDescription}
        onChange={val => setTripDescription(val)}
        onBlur={() => handleBlur('tripDescription')}
        rows={3}
        required
      />
      <TextArea
        label="Trip Notes"
        value={tripNotes}
        onChange={val => setTripNotes(val)}
        rows={3}
      />
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isFormValid}>{trip ? 'Update Trip' : 'Create Trip'}</Button>
      </div>
    </form>
  );
};

export default TripForm;
