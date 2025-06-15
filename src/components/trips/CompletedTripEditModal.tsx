import React, { useState } from 'react';
import { Trip, TripEditRecord, TRIP_EDIT_REASONS } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select, Textarea } from '../ui/FormElements';
import { Save, X } from 'lucide-react';

interface CompletedTripEditModalProps {
  isOpen: boolean;
  trip: Trip;
  onClose: () => void;
  onSave: (updatedTrip: Trip, editRecord: Omit<TripEditRecord, 'id'>) => void;
}

const CompletedTripEditModal: React.FC<CompletedTripEditModalProps> = ({
  isOpen,
  trip,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    fleetNumber: trip.fleetNumber,
    driverName: trip.driverName,
    clientName: trip.clientName,
    startDate: trip.startDate,
    endDate: trip.endDate,
    route: trip.route,
    description: trip.description || '',
    baseRevenue: trip.baseRevenue.toString(),
    revenueCurrency: trip.revenueCurrency,
    distanceKm: trip.distanceKm?.toString() || '',
  });

  const [editReason, setEditReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!editReason && !customReason) {
      newErrors['editReason'] = 'Please select or enter a reason for editing.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const updatedTrip: Trip = {
      ...trip,
      ...formData,
      baseRevenue: parseFloat(formData.baseRevenue),
      distanceKm: parseFloat(formData.distanceKm),
    };

    const editRecord: Omit<TripEditRecord, 'id'> = {
      tripId: trip.id,
      editedBy: 'Current User', // Replace with actual user
      editedAt: new Date().toISOString(),
      reason: customReason || editReason,
      fieldChanged: 'manual update',
      oldValue: '',
      newValue: '',
      changeType: 'edit_completed_trip',
    };

    onSave(updatedTrip, editRecord);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4 space-y-4">
        <h2 className="text-xl font-semibold">Edit Completed Trip</h2>

        <Input label="Fleet Number" value={formData.fleetNumber} onChange={val => handleChange('fleetNumber', val)} />
        <Input label="Driver Name" value={formData.driverName} onChange={val => handleChange('driverName', val)} />
        <Input label="Client Name" value={formData.clientName} onChange={val => handleChange('clientName', val)} />
        <Input label="Start Date" value={formData.startDate} onChange={val => handleChange('startDate', val)} />
        <Input label="End Date" value={formData.endDate} onChange={val => handleChange('endDate', val)} />
        <Input label="Route" value={formData.route} onChange={val => handleChange('route', val)} />
        <TextArea label="Description" value={formData.description} onChange={val => handleChange('description', val)} />
        <Input label="Base Revenue" value={formData.baseRevenue} onChange={val => handleChange('baseRevenue', val)} />
        <Input label="Revenue Currency" value={formData.revenueCurrency} onChange={val => handleChange('revenueCurrency', val)} />
        <Input label="Distance (km)" value={formData.distanceKm} onChange={val => handleChange('distanceKm', val)} />

        <Select
          label="Edit Reason"
          value={editReason}
          onChange={val => setEditReason(val)}
          options={TRIP_EDIT_REASONS.map(reason => ({ value: reason, label: reason }))}
        />
        <Input label="Custom Reason" value={customReason} onChange={val => setCustomReason(val)} />
        {errors.editReason && <div className="text-red-500">{errors.editReason}</div>}

        <div className="flex justify-end space-x-2">
          <Button icon={<X />} variant="secondary" onClick={onClose}>Cancel</Button>
          <Button icon={<Save />} onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Modal>
  );
};

export default CompletedTripEditModal;
