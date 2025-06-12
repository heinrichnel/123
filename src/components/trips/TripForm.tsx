import React, { useState, useEffect } from 'react';
import { Trip, CLIENTS, DRIVERS, FLEET_NUMBERS, CLIENT_TYPES } from '../../types';
import { Input, Select, TextArea } from '../ui/FormElements';
import Button from '../ui/Button';
import { Save, X, Building } from 'lucide-react';

interface TripFormProps {
  trip?: Trip;
  onSubmit: (trip: Omit<Trip, 'id' | 'costs' | 'status'>) => void;
  onCancel: () => void;
}

const TripForm: React.FC<TripFormProps> = ({ trip, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    fleetNumber: '',
    driverName: '',
    clientName: '',
    clientType: 'external' as 'internal' | 'external',
    startDate: '',
    endDate: '',
    route: '',
    description: '',
    baseRevenue: '',
    revenueCurrency: 'ZAR' as 'USD' | 'ZAR',
    distanceKm: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (trip) {
      setFormData({
        fleetNumber: trip.fleetNumber,
        driverName: trip.driverName,
        clientName: trip.clientName,
        clientType: trip.clientType || 'external',
        startDate: trip.startDate,
        endDate: trip.endDate,
        route: trip.route,
        description: trip.description || '',
        baseRevenue: trip.baseRevenue.toString(),
        revenueCurrency: trip.revenueCurrency,
        distanceKm: trip.distanceKm?.toString() || '',
      });
    }
  }, [trip]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fleetNumber) newErrors.fleetNumber = 'Fleet is required';
    if (!formData.driverName) newErrors.driverName = 'Driver is required';
    if (!formData.clientName) newErrors.clientName = 'Client is required';
    if (!formData.clientType) newErrors.clientType = 'Client type is required';
    if (!formData.route) newErrors.route = 'Route is required';
    if (!formData.baseRevenue || isNaN(Number(formData.baseRevenue))) {
      newErrors.baseRevenue = 'Revenue must be a valid number';
    }
    if (Number(formData.baseRevenue) <= 0) {
      newErrors.baseRevenue = 'Revenue must be greater than 0';
    }
    if (!formData.startDate) newErrors.startDate = 'Start date required';
    if (!formData.endDate) newErrors.endDate = 'End date required';
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (formData.distanceKm && isNaN(Number(formData.distanceKm))) {
      newErrors.distanceKm = 'Distance must be a valid number';
    }
    if (formData.distanceKm && Number(formData.distanceKm) < 0) {
      newErrors.distanceKm = 'Distance cannot be negative';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const tripData = {
        fleetNumber: formData.fleetNumber,
        driverName: formData.driverName,
        clientName: formData.clientName,
        clientType: formData.clientType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        route: formData.route,
        description: formData.description,
        baseRevenue: Number(formData.baseRevenue),
        revenueCurrency: formData.revenueCurrency,
        distanceKm: formData.distanceKm ? Number(formData.distanceKm) : undefined,
        paymentStatus: 'unpaid' as const,
        additionalCosts: [],
        delayReasons: [],
        followUpHistory: []
      };
      
      onSubmit(tripData);
    }
  };

  const getCurrencySymbol = (currency: 'USD' | 'ZAR') => {
    return currency === 'USD' ? '$' : 'R';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Building className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-blue-800">Client Classification</h3>
        </div>
        <Select
          label="Client Type *"
          value={formData.clientType}
          onChange={(e) => handleChange('clientType', e.target.value)}
          options={CLIENT_TYPES}
          error={errors.clientType}
        />
        <div className="mt-2 text-sm text-blue-700">
          <p><strong>Internal:</strong> In-house deliveries, farm or depot transfers</p>
          <p><strong>External:</strong> Third-party, contracted transport services</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Fleet Number *"
          value={formData.fleetNumber}
          onChange={(e) => handleChange('fleetNumber', e.target.value)}
          options={[
            { label: 'Select fleet number...', value: '' },
            ...FLEET_NUMBERS.map(f => ({ label: f, value: f }))
          ]}
          error={errors.fleetNumber}
        />

        <Select
          label="Driver *"
          value={formData.driverName}
          onChange={(e) => handleChange('driverName', e.target.value)}
          options={[
            { label: 'Select driver...', value: '' },
            ...DRIVERS.map(d => ({ label: d, value: d }))
          ]}
          error={errors.driverName}
        />

        <Select
          label="Client *"
          value={formData.clientName}
          onChange={(e) => handleChange('clientName', e.target.value)}
          options={[
            { label: 'Select client...', value: '' },
            ...CLIENTS.map(c => ({ label: c, value: c }))
          ]}
          error={errors.clientName}
        />

        <Input
          label="Route *"
          value={formData.route}
          onChange={(e) => handleChange('route', e.target.value)}
          placeholder="e.g., Harare - JHB"
          error={errors.route}
        />

        <Input
          label="Start Date *"
          type="date"
          value={formData.startDate}
          onChange={(e) => handleChange('startDate', e.target.value)}
          error={errors.startDate}
        />

        <Input
          label="End Date *"
          type="date"
          value={formData.endDate}
          onChange={(e) => handleChange('endDate', e.target.value)}
          error={errors.endDate}
        />

        <Select
          label="Currency *"
          value={formData.revenueCurrency}
          onChange={(e) => handleChange('revenueCurrency', e.target.value)}
          options={[
            { label: 'ZAR (R)', value: 'ZAR' },
            { label: 'USD ($)', value: 'USD' }
          ]}
        />

        <Input
          label={`Base Revenue (${getCurrencySymbol(formData.revenueCurrency)}) *`}
          type="number"
          step="0.01"
          min="0.01"
          value={formData.baseRevenue}
          onChange={(e) => handleChange('baseRevenue', e.target.value)}
          placeholder="0.00"
          error={errors.baseRevenue}
        />

        <Input
          label="Distance (km)"
          type="number"
          step="0.1"
          min="0"
          value={formData.distanceKm}
          onChange={(e) => handleChange('distanceKm', e.target.value)}
          placeholder="Optional - for cost per km calculation"
          error={errors.distanceKm}
        />
      </div>

      <TextArea
        label="Trip Description"
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        placeholder="Optional trip notes"
        rows={3}
      />

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel} icon={<X className="w-4 h-4" />}>
          Cancel
        </Button>
        <Button type="submit" icon={<Save className="w-4 h-4" />}>
          {trip ? 'Update Trip' : 'Save Trip'}
        </Button>
      </div>
    </form>
  );
};

export default TripForm;