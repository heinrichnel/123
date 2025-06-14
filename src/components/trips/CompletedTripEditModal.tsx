import React, { useState } from 'react';
import { Trip, TripEditRecord, TRIP_EDIT_REASONS } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select, TextArea } from '../ui/FormElements';
import { Save, X, AlertTriangle } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';

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
    
    if (!editReason) {
      newErrors.editReason = 'Edit reason is required for completed trips';
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

    const finalReason = editReason === 'Other (specify in comments)' ? customReason : editReason;

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

      // Update trip with new data and edit history
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Completed Trip"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Warning Alert */}
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">Editing Completed Trip</h4>
              <p className="text-sm text-amber-700 mt-1">
                This trip has been completed. All changes will be logged with timestamps and reasons for audit purposes. 
                The edit history will be included in all future reports and exports.
              </p>
            </div>
          </div>
        </div>

        {/* Edit Reason - Required */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900">Edit Justification (Required)</h3>
          
          <Select
            label="Reason for Edit *"
            value={editReason}
            onChange={(e) => setEditReason(e.target.value)}
            options={[
              { label: 'Select reason for editing...', value: '' },
              ...TRIP_EDIT_REASONS.map(reason => ({ label: reason, value: reason }))
            ]}
            error={errors.editReason}
          />

          {editReason === 'Other (specify in comments)' && (
            <TextArea
              label="Specify Reason *"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Please provide a detailed reason for editing this completed trip..."
              rows={3}
              error={errors.customReason}
            />
          )}
        </div>

        {/* Trip Data Form */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900">Trip Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fleet Number"
              value={formData.fleetNumber}
              onChange={(e) => handleChange('fleetNumber', e.target.value)}
            />

            <Input
              label="Driver Name"
              value={formData.driverName}
              onChange={(e) => handleChange('driverName', e.target.value)}
            />

            <Input
              label="Client Name"
              value={formData.clientName}
              onChange={(e) => handleChange('clientName', e.target.value)}
            />

            <Input
              label="Route"
              value={formData.route}
              onChange={(e) => handleChange('route', e.target.value)}
            />

            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
            />

            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
            />

            <Select
              label="Currency"
              value={formData.revenueCurrency}
              onChange={(e) => handleChange('revenueCurrency', e.target.value)}
              options={[
                { label: 'ZAR (R)', value: 'ZAR' },
                { label: 'USD ($)', value: 'USD' }
              ]}
            />

            <Input
              label="Base Revenue"
              type="number"
              step="0.01"
              value={formData.baseRevenue}
              onChange={(e) => handleChange('baseRevenue', e.target.value)}
            />

            <Input
              label="Distance (km)"
              type="number"
              step="0.1"
              value={formData.distanceKm}
              onChange={(e) => handleChange('distanceKm', e.target.value)}
            />
          </div>

          <TextArea
            label="Description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
          />
        </div>

        {/* Existing Edit History */}
        {trip.editHistory && trip.editHistory.length > 0 && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900">Previous Edit History</h3>
            <div className="bg-gray-50 rounded-md p-4 max-h-40 overflow-y-auto">
              {trip.editHistory.map((edit, index) => (
                <div key={index} className="text-sm border-b border-gray-200 pb-2 mb-2 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{edit.fieldChanged}: {edit.oldValue} → {edit.newValue}</p>
                      <p className="text-gray-600">Reason: {edit.reason}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>{edit.editedBy}</p>
                      <p>{formatDateTime(edit.editedAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {errors.general && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {errors.general}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            icon={<X className="w-4 h-4" />}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            icon={<Save className="w-4 h-4" />}
          >
            Save Changes & Log Edit
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CompletedTripEditModal;