import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { TextArea } from '../ui/FormElements';
import { Trip } from '../../types';
import { formatDate } from '../../utils/helpers';
import { Truck, Calendar, MapPin, User, Send, X, Clock, CheckCircle } from 'lucide-react';

interface TripStatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  status: 'shipped' | 'delivered';
  onUpdateStatus: (tripId: string, status: 'shipped' | 'delivered', notes: string) => Promise<void>;
}

const TripStatusUpdateModal: React.FC<TripStatusUpdateModalProps> = ({
  isOpen,
  onClose,
  trip,
  status,
  onUpdateStatus
}) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      await onUpdateStatus(trip.id, status, notes);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update trip status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusTitle = status === 'shipped' ? 'Mark as Shipped' : 'Mark as Delivered';
  const statusDescription = status === 'shipped' 
    ? 'This will mark the trip as shipped and record the current time as the shipping timestamp.'
    : 'This will mark the trip as delivered and record the current time as the delivery timestamp.';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={statusTitle}
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Trip Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-blue-800 mb-3">Trip Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-blue-600 font-medium">Fleet</p>
                <p className="text-blue-800">{trip.fleetNumber}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-blue-600 font-medium">Driver</p>
                <p className="text-blue-800">{trip.driverName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-blue-600 font-medium">Route</p>
                <p className="text-blue-800">{trip.route}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-blue-600 font-medium">Dates</p>
                <p className="text-blue-800">{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Update Info */}
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-start space-x-3">
            {status === 'shipped' ? (
              <Truck className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            )}
            <div>
              <h4 className="text-sm font-medium text-green-800">Status Update: {status.toUpperCase()}</h4>
              <p className="text-sm text-green-700 mt-1">
                {statusDescription}
              </p>
              {status === 'shipped' && (
                <p className="text-sm text-green-700 mt-1">
                  After shipping, you'll be able to mark this trip as delivered when completed.
                </p>
              )}
              {status === 'delivered' && trip.shippedAt && (
                <div className="mt-2 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-medium text-green-700">
                    Shipped at: {formatDate(trip.shippedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <TextArea
          label="Status Update Notes (Optional)"
          value={notes}
          onChange={(value) => setNotes(value)}
          placeholder={`Add any notes about this ${status} status update...`}
          rows={3}
        />

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            icon={<X className="w-4 h-4" />}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            icon={<Send className="w-4 h-4" />}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            Update Status
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TripStatusUpdateModal;