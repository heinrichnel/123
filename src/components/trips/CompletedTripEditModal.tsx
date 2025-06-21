import React, { useState } from 'react';
import { Trip, TripEditRecord, TRIP_EDIT_REASONS } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select, TextArea } from '../ui/FormElements';
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

  // Declare finalReason before use
  const finalReason = customReason || editReason;

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
    if (editReason === 'Other (specify in comments)' && !customReason.trim()) {
      newErrors.customReason = 'Please specify the reason for editing';
    }
    // Check if any changes were made
    const hasChanges = Object.keys(formData).some(key => {
      const originalValue = trip[key as keyof Trip]?.toString() || '';
      const newValue = formData[key as keyof typeof formData] || '';
      return originalValue !== newValue;
    });
    if (!hasChanges) {
      newErrors.general = 'No changes detected. Please make changes before saving.';
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
    // Identify changed fields
    const changes: Array<{field: string, oldValue: string, newValue: string}> = [];
    Object.keys(formData).forEach(key => {
      const originalValue = trip[key as keyof Trip]?.toString() || '';
      const newValue = formData[key as keyof typeof formData] || '';
      if (originalValue !== newValue) {
        changes.push({
          field: key,
          oldValue: originalValue,
          newValue: newValue
        });
      }
    });
    const editRecord: Omit<TripEditRecord, 'id'> = {
      tripId: trip.id,
      editedBy: 'Current User', // Replace with actual user
      editedAt: new Date().toISOString(),
      reason: finalReason,
      fieldChanged: 'manual update',
      oldValue: '',
      newValue: '',
      changeType: 'update',
    };
    onSave(updatedTrip, editRecord);
    // Create edit records for each change
    changes.forEach(change => {
      const editRecord: Omit<TripEditRecord, 'id'> = {
        tripId: trip.id,
        editedBy: 'Current User', // In real app, use actual user
        editedAt: new Date().toISOString(),
        reason: finalReason,
        fieldChanged: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        changeType: 'update'
      };
      const updatedTrip: Trip = {
        ...trip,
        ...formData,
        baseRevenue: Number(formData.baseRevenue),
        distanceKm: formData.distanceKm ? Number(formData.distanceKm) : undefined,
        editHistory: [...(trip.editHistory || []), editRecord]
      };
      onSave(updatedTrip, editRecord);
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Completed Trip">
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
        {/* Edit Reason - Required */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900">Edit Justification (Required)</h3>
          <Select
            label="Reason for Edit *"
            value={editReason}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditReason(e.target.value)}
            options={[
              { label: 'Select reason for editing...', value: '' },
              ...TRIP_EDIT_REASONS.map(reason => ({ label: reason, value: reason }))
            ]}
            error={errors.editReason}
          />
          <Input label="Custom Reason" value={customReason} onChange={val => setCustomReason(val)} />
          {errors.editReason && <div className="text-red-500">{errors.editReason}</div>}
        </div>
        <div className="flex justify-end space-x-2">
          <Button icon={<X />} variant="secondary" onClick={onClose}>Cancel</Button>
          <Button icon={<Save />} onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Modal>
  );
};

export default CompletedTripEditModal;
