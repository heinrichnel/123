
import React, { useState } from 'react';
import { Trip } from '../../types';
import Button from '../ui/Button';
import { Input, Select } from '../ui/FormElements';
import { CLIENTS, DRIVERS, FLEET_NUMBERS } from '../../types';

interface AddTripFormProps {
  onAddTrip: (trip: Trip) => void;
}

const AddTripForm: React.FC<AddTripFormProps> = ({ onAddTrip }) => {
  const [formData, setFormData] = useState({
    fleetNumber: '',
    driverName: '',
    clientName: '',
    route: '',
    baseRevenue: '',
    revenueCurrency: 'ZAR',
    startDate: '',
    endDate: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newTrip: Trip = {
        id: `trip-${Date.now()}`,
        fleetNumber: formData.fleetNumber,
        driverName: formData.driverName,
        clientName: formData.clientName,
        route: formData.route,
        baseRevenue: parseFloat(formData.baseRevenue) || 0,
        revenueCurrency: formData.revenueCurrency as 'ZAR' | 'USD',
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: 'active',
        costs: [],
        additionalCosts: [],
        delayReasons: [],
        followUpHistory: []
      };

      onAddTrip(newTrip);
      
      // Reset form
      setFormData({
        fleetNumber: '',
        driverName: '',
        clientName: '',
        route: '',
        baseRevenue: '',
        revenueCurrency: 'ZAR',
        startDate: '',
        endDate: ''
      });
    } catch (error) {
      console.error('Error adding trip:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Fleet Number"
          value={formData.fleetNumber}
          onChange={e => handleChange('fleetNumber', e.target.value)}
          options={[
            { label: 'Select Fleet', value: '' },
            ...FLEET_NUMBERS.map(fleet => ({ label: fleet, value: fleet }))
          ]}
          required
        />

        <Select
          label="Driver"
          value={formData.driverName}
          onChange={e => handleChange('driverName', e.target.value)}
          options={[
            { label: 'Select Driver', value: '' },
            ...DRIVERS.map(driver => ({ label: driver, value: driver }))
          ]}
          required
        />

        <Select
          label="Client"
          value={formData.clientName}
          onChange={e => handleChange('clientName', e.target.value)}
          options={[
            { label: 'Select Client', value: '' },
            ...CLIENTS.map(client => ({ label: client, value: client }))
          ]}
          required
        />

        <Input
          label="Route"
          value={formData.route}
          onChange={e => handleChange('route', e.target.value)}
          placeholder="e.g., JHB - CPT"
          required
        />

        <Input
          label="Base Revenue"
          type="number"
          value={formData.baseRevenue}
          onChange={e => handleChange('baseRevenue', e.target.value)}
          placeholder="0.00"
          step="0.01"
          required
        />

        <Select
          label="Currency"
          value={formData.revenueCurrency}
          onChange={e => handleChange('revenueCurrency', e.target.value)}
          options={[
            { label: 'ZAR (R)', value: 'ZAR' },
            { label: 'USD ($)', value: 'USD' }
          ]}
          required
        />

        <Input
          label="Start Date"
          type="date"
          value={formData.startDate}
          onChange={e => handleChange('startDate', e.target.value)}
          required
        />

        <Input
          label="End Date"
          type="date"
          value={formData.endDate}
          onChange={e => handleChange('endDate', e.target.value)}
          required
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          {isSubmitting ? 'Creating Trip...' : 'Create Trip'}
        </Button>
      </div>
    </form>
  );
};

export default AddTripForm;
