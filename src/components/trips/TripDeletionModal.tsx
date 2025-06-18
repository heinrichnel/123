// ─── React & State ───────────────────────────────────────────────
import React, { useState } from 'react';

// ─── Types & Constants ───────────────────────────────────────────
import { Trip, TripDeletionRecord, TRIP_DELETION_REASONS } from '../../types';
import { formatCurrency, calculateTotalCosts } from '../../utils/helpers';

// ─── UI Components ───────────────────────────────────────────────
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select, TextArea } from '../ui/FormElements';

// ─── Icons ───────────────────────────────────────────────────────
import { Trash2, X, AlertTriangle, Shield } from 'lucide-react';


interface TripDeletionModalProps {
  isOpen: boolean;
  trip: Trip;
  onClose: () => void;
  onDelete: (trip: Trip, deletionRecord: Omit<TripDeletionRecord, 'id'>) => void;
  userRole: 'admin' | 'manager' | 'operator';
}

const TripDeletionModal: React.FC<TripDeletionModalProps> = ({
  isOpen,
  trip,
  onClose,
  onDelete,
  userRole
}) => {
  const [deletionReason, setDeletionReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalCosts = calculateTotalCosts(trip.costs);
  const flaggedItems = trip.costs.filter(c => c.isFlagged).length;
  const confirmationText = `DELETE ${trip.fleetNumber}`;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!deletionReason) {
      newErrors.deletionReason = 'Deletion reason is required';
    }
    
    if (deletionReason === 'Other (specify in comments)' && !customReason.trim()) {
      newErrors.customReason = 'Please specify the reason for deletion';
    }

    if (confirmText !== confirmationText) {
      newErrors.confirmText = `Please type "${confirmationText}" to confirm deletion`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDelete = () => {
    if (!validateForm()) return;

    const finalReason = deletionReason === 'Other (specify in comments)' ? customReason : deletionReason;

    const deletionRecord: Omit<TripDeletionRecord, 'id'> = {
      tripId: trip.id,
      deletedBy: 'Current User', // In real app, use actual user
      deletedAt: new Date().toISOString(),
      reason: finalReason,
      tripData: JSON.stringify(trip),
      totalRevenue: trip.baseRevenue,
      totalCosts: totalCosts,
      costEntriesCount: trip.costs.length,
      flaggedItemsCount: flaggedItems
    };

    onDelete(trip, deletionRecord);
    onClose();
  };

  // Check if user has permission to delete
  if (userRole !== 'admin') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Access Denied" maxWidth="md">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-red-500 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900">Insufficient Permissions</h3>
          <p className="text-gray-600">
            Only administrators can delete completed trips. This restriction ensures data integrity and audit compliance.
          </p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Completed Trip"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Critical Warning */}
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">CRITICAL: Permanent Deletion</h4>
              <p className="text-sm text-red-700 mt-1">
                This action will permanently delete the completed trip and all associated data. 
                This operation cannot be undone. All deletion details will be logged for governance and audit purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Trip Summary */}
        <div className="bg-gray-50 rounded-md p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Trip to be Deleted</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Fleet:</strong> {trip.fleetNumber}</p>
              <p><strong>Driver:</strong> {trip.driverName}</p>
              <p><strong>Route:</strong> {trip.route}</p>
              <p><strong>Client:</strong> {trip.clientName}</p>
            </div>
            <div>
              <p><strong>Period:</strong> {trip.startDate} to {trip.endDate}</p>
              <p><strong>Revenue:</strong> {formatCurrency(trip.baseRevenue, trip.revenueCurrency)}</p>
              <p><strong>Total Costs:</strong> {formatCurrency(totalCosts, trip.revenueCurrency)}</p>
              <p><strong>Status:</strong> {trip.status.toUpperCase()}</p>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span>Cost Entries: <strong>{trip.costs.length}</strong></span>
              <span>Flagged Items: <strong className="text-red-600">{flaggedItems}</strong></span>
              <span>Attachments: <strong>{trip.costs.reduce((sum, cost) => sum + cost.attachments.length, 0)}</strong></span>
            </div>
          </div>
        </div>

        {/* Deletion Reason */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Deletion Justification (Required)</h3>
          
          <Select
            label="Reason for Deletion *"
            value={deletionReason}
            onChange={(e) => setDeletionReason(e.target.value)}
            options={[
              { label: 'Select reason for deletion...', value: '' },
              ...TRIP_DELETION_REASONS.map(reason => ({ label: reason, value: reason }))
            ]}
            error={errors.deletionReason}
          />

          {deletionReason === 'Other (specify in comments)' && (
            <TextArea
              label="Specify Reason *"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Please provide a detailed reason for deleting this completed trip..."
              rows={3}
              error={errors.customReason}
            />
          )}
        </div>

        {/* Confirmation */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900">Confirmation Required</h3>
          <p className="text-sm text-gray-600">
            To confirm deletion, please type <strong>{confirmationText}</strong> in the field below:
          </p>
          
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={confirmationText}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
          />
          {errors.confirmText && (
            <p className="text-sm text-red-600">{errors.confirmText}</p>
          )}
        </div>

        {/* Data Retention Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-800">Data Retention & Audit Trail</h4>
          <p className="text-sm text-blue-700 mt-1">
            Upon deletion, the following information will be permanently archived in the deletion log:
          </p>
          <ul className="text-sm text-blue-700 mt-2 list-disc list-inside">
            <li>Complete trip data snapshot</li>
            <li>All cost entries and attachments metadata</li>
            <li>Deletion timestamp and administrator details</li>
            <li>Justification reason and comments</li>
            <li>Financial summary (revenue, costs, profit/loss)</li>
          </ul>
        </div>

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
            variant="danger"
            onClick={handleDelete}
            disabled={confirmText !== confirmationText}
            icon={<Trash2 className="w-4 h-4" />}
          >
            Permanently Delete Trip
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TripDeletionModal;
