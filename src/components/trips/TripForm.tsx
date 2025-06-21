// ─── React ───────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
<<<<<<< HEAD

// ─── Types & Constants ───────────────────────────────────────────
import { Trip, CLIENTS, DRIVERS, CLIENT_TYPES, FLEET_NUMBERS } from '../../types';

// ─── UI Components ───────────────────────────────────────────────
import { Input, Select, TextArea } from '../ui/FormElements';
import Button from '../ui/Button';
=======
import { Trip, CLIENTS, DRIVERS } from '../../types/index.ts';
import { Input, Select, TextArea } from '../ui/FormElements.tsx';
import Button from '../ui/Button.tsx';
>>>>>>> 26992b5f0a3b081be38f1bd0501c447ccf1bbf89


interface TripFormProps {
  trip?: Trip;
  onSubmit: (tripData: Omit<Trip, 'id' | 'costs' | 'status'>) => void;
  onCancel: () => void;
}

const TripForm: React.FC<TripFormProps> = ({ trip, onSubmit, onCancel }) => {
<<<<<<< HEAD
  const [formData, setFormData] = useState({
    fleetNumber: '',
    clientName: '',
    driverName: '',
    route: '',
    startDate: '',
    endDate: '',
    distanceKm: '',
    baseRevenue: '',
    revenueCurrency: 'ZAR' as 'USD' | 'ZAR',
    clientType: 'external' as 'internal' | 'external',
    tripDescription: '',
    tripNotes: ''
  });
  
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (trip) {
      setFormData({
        fleetNumber: trip.fleetNumber || '',
        clientName: trip.clientName || '',
        driverName: trip.driverName || '',
        route: trip.route || '',
        startDate: trip.startDate || '',
        endDate: trip.endDate || '',
        distanceKm: trip.distanceKm ? String(trip.distanceKm) : '',
        baseRevenue: trip.baseRevenue ? String(trip.baseRevenue) : '',
        revenueCurrency: trip.revenueCurrency || 'ZAR',
        clientType: trip.clientType || 'external',
        tripDescription: trip.tripDescription || '',
        tripNotes: trip.tripNotes || ''
      });
=======
  const [fleetNumber, setFleetNumber] = useState('');
  const [clientName, setClientName] = useState('');
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
      setClientName(trip.clientName || '');
      setDriver(trip.driver || '');
      setOrigin(trip.origin || '');
      setDestination(trip.destination || '');
      setDistanceKm(trip.distanceKm || 0);
      setBaseRevenue(trip.baseRevenue || 0);
      setRevenueCurrency(trip.revenueCurrency || 'ZAR');
      setTripNotes(trip.tripNotes || '');
>>>>>>> 26992b5f0a3b081be38f1bd0501c447ccf1bbf89
    }
  }, [trip]);

  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.clientType) newErrors.clientType = 'Client Type is required';
    if (!formData.fleetNumber) newErrors.fleetNumber = 'Fleet Number is required';
    if (!formData.clientName) newErrors.clientName = 'Client is required';
    if (!formData.driverName) newErrors.driverName = 'Driver is required';
    if (!formData.route) newErrors.route = 'Route is required';
    if (!formData.startDate) newErrors.startDate = 'Start Date is required';
    
    if (!formData.endDate) {
      newErrors.endDate = 'End Date is required';
    } else if (formData.startDate && formData.endDate < formData.startDate) {
      newErrors.endDate = 'End Date cannot be earlier than Start Date';
    }
    
    if (!formData.distanceKm || parseFloat(formData.distanceKm) <= 0) {
      newErrors.distanceKm = 'Distance must be greater than 0';
    }
    
    if (!formData.baseRevenue || parseFloat(formData.baseRevenue) <= 0) {
      newErrors.baseRevenue = 'Base Revenue must be greater than 0';
    }
    
    if (!formData.revenueCurrency) newErrors.revenueCurrency = 'Currency is required';
    if (!formData.tripDescription) newErrors.tripDescription = 'Trip Description is required';
    
    return newErrors;
  };

  useEffect(() => {
    setErrors(validate());
  }, [formData]);

  const isFormValid = Object.keys(errors).length === 0;

  const handleBlur = (field: string) => {
    setTouched(t => ({ ...t, [field]: true }));
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    setTouched({
      clientType: true,
      fleetNumber: true,
      clientName: true,
      driverName: true,
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
<<<<<<< HEAD
      clientType: formData.clientType,
      fleetNumber: formData.fleetNumber,
      clientName: formData.clientName,
      driverName: formData.driverName,
      route: formData.route,
      startDate: formData.startDate,
      endDate: formData.endDate,
      distanceKm: parseFloat(formData.distanceKm),
      baseRevenue: parseFloat(formData.baseRevenue),
      revenueCurrency: formData.revenueCurrency,
      tripDescription: formData.tripDescription,
      tripNotes: formData.tripNotes
=======
      fleetNumber,
      clientName,
      driver,
      origin,
      destination,
      distanceKm,
      baseRevenue,
      revenueCurrency,
      tripNotes,
>>>>>>> 26992b5f0a3b081be38f1bd0501c447ccf1bbf89
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Client Type"
          value={formData.clientType}
          onChange={(value) => handleChange('clientType', value)}
          onBlur={() => handleBlur('clientType')}
          options={CLIENT_TYPES}
          required
          error={touched.clientType && errors.clientType}
        />
        
        <Select
          label="Fleet Number"
          value={formData.fleetNumber}
          onChange={(value) => handleChange('fleetNumber', value)}
          onBlur={() => handleBlur('fleetNumber')}
          options={[
            { label: 'Select fleet number...', value: '' }, 
            ...FLEET_NUMBERS.map(f => ({ label: f, value: f }))
          ]}
          required
          error={touched.fleetNumber && errors.fleetNumber}
        />
        
        <Select
          label="Client"
<<<<<<< HEAD
          value={formData.clientName}
          onChange={(value) => handleChange('clientName', value)}
          onBlur={() => handleBlur('clientName')}
          options={[
            { label: 'Select client...', value: '' }, 
            ...CLIENTS.map(c => ({ label: c, value: c }))
          ]}
=======
          value={clientName}
          onChange={e => setClientName(e.target.value)}
          options={CLIENTS.map(c => ({ label: c, value: c }))}
>>>>>>> 26992b5f0a3b081be38f1bd0501c447ccf1bbf89
          required
          error={touched.clientName && errors.clientName}
        />
        
        <Select
          label="Driver"
          value={formData.driverName}
          onChange={(value) => handleChange('driverName', value)}
          onBlur={() => handleBlur('driverName')}
          options={[
            { label: 'Select driver...', value: '' }, 
            ...DRIVERS.map(d => ({ label: d, value: d }))
          ]}
          required
          error={touched.driverName && errors.driverName}
        />
        
        <Input 
          label="Route (semicolon separated)" 
          value={formData.route} 
          onChange={(value) => handleChange('route', value)} 
          onBlur={() => handleBlur('route')} 
          required 
          error={touched.route && errors.route} 
          placeholder="e.g. Harare;Bulawayo;Gweru" 
        />
        
        <Input 
          label="Start Date" 
          type="date" 
          value={formData.startDate} 
          onChange={(value) => handleChange('startDate', value)} 
          onBlur={() => handleBlur('startDate')} 
          required 
          error={touched.startDate && errors.startDate} 
        />
        
        <Input 
          label="End Date" 
          type="date" 
          value={formData.endDate} 
          onChange={(value) => handleChange('endDate', value)} 
          onBlur={() => handleBlur('endDate')} 
          required 
          error={touched.endDate && errors.endDate} 
        />
        
        <Input
          label="Distance (KM)"
          type="number"
          value={formData.distanceKm}
          onChange={(value) => handleChange('distanceKm', value)}
          onBlur={() => handleBlur('distanceKm')}
          required
          error={touched.distanceKm && errors.distanceKm}
        />
        
        <Input
          label="Base Revenue"
          type="number"
          value={formData.baseRevenue}
          onChange={(value) => handleChange('baseRevenue', value)}
          onBlur={() => handleBlur('baseRevenue')}
          required
          error={touched.baseRevenue && errors.baseRevenue}
        />
        
        <Select
          label="Revenue Currency"
          value={formData.revenueCurrency}
          onChange={(value) => handleChange('revenueCurrency', value)}
          onBlur={() => handleBlur('revenueCurrency')}
          options={[
            { label: 'USD', value: 'USD' },
            { label: 'ZAR', value: 'ZAR' },
          ]}
          required
          error={touched.revenueCurrency && errors.revenueCurrency}
        />
      </div>
<<<<<<< HEAD
      
=======

>>>>>>> 26992b5f0a3b081be38f1bd0501c447ccf1bbf89
      <TextArea
        label="Trip Notes"
        value={formData.tripNotes}
        onChange={(value) => handleChange('tripNotes', value)}
        placeholder="Notes about this trip..."
        rows={3}
      />
      
      <TextArea
        label="Trip Description"
        value={formData.tripDescription}
        onChange={(value) => handleChange('tripDescription', value)}
        placeholder="Description of the trip..."
        rows={3}
        required
        error={touched.tripDescription && errors.tripDescription}
      />
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isFormValid}>
          {trip ? 'Update Trip' : 'Create Trip'}
        </Button>
      </div>
    </form>
  );
};

export default TripForm;