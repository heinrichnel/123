import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useAppContext } from '../../context/AppContext';
import { Select } from '../ui/FormElements';
import { 
  Link, 
  X, 
  Save, 
  AlertTriangle, 
  DollarSign,
  Truck,
  Calendar
} from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils/helpers';

interface TripLinkageModalProps {
  isOpen: boolean;
  onClose: () => void;
  dieselRecordId: string;
}

const TripLinkageModal: React.FC<TripLinkageModalProps> = ({
  isOpen,
  onClose,
  dieselRecordId
}) => {
  const { trips, dieselRecords, allocateDieselToTrip, removeDieselFromTrip } = useAppContext();
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get the diesel record
  const dieselRecord = dieselRecords.find(r => r.id === dieselRecordId);
  if (!dieselRecord) return null;

  // Get available trips for the selected fleet
  const availableTrips = trips.filter(trip => 
    trip.fleetNumber === dieselRecord.fleetNumber && 
    trip.status === 'active'
  );

  // Check if already linked to a trip
  const currentLinkedTrip = dieselRecord.tripId ? trips.find(t => t.id === dieselRecord.tripId) : undefined;

  const handleChange = (tripId: string) => {
    setSelectedTripId(tripId);
    setErrors({});
  };

  const handleSave = () => {
    if (!selectedTripId) {
      setErrors({ tripId: 'Please select a trip to link this diesel record to' });
      return;
    }

    allocateDieselToTrip(dieselRecordId, selectedTripId);
    
    const trip = trips.find(t => t.id === selectedTripId);
    alert(`Diesel record successfully linked to trip!\n\nTrip: ${trip?.route}\nDates: ${trip?.startDate} to ${trip?.endDate}\n\nA cost entry has been automatically created in the trip's expenses.`);
    
    onClose();
  };

  const handleRemoveLinkage = () => {
    if (!dieselRecord.tripId) return;
    
    if (confirm('Are you sure you want to remove this diesel record from the linked trip? This will also remove the associated cost entry from the trip.')) {
      removeDieselFromTrip(dieselRecordId);
      alert('Diesel record has been unlinked from the trip and the cost entry has been removed.');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Link Diesel Record to Trip"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Diesel Record Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Diesel Record Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <p><strong>Fleet:</strong> {dieselRecord.fleetNumber}</p>
              <p><strong>Driver:</strong> {dieselRecord.driverName}</p>
              <p><strong>Date:</strong> {formatDate(dieselRecord.date)}</p>
            </div>
            <div>
              <p><strong>Litres:</strong> {dieselRecord.litresFilled}</p>
              <p><strong>Cost:</strong> {formatCurrency(dieselRecord.totalCost, 'ZAR')}</p>
              <p><strong>Station:</strong> {dieselRecord.fuelStation}</p>
            </div>
          </div>
        </div>

        {/* Current Linkage Status */}
        {currentLinkedTrip && (
          <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <Link className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-purple-800">Currently Linked to Trip</h4>
                <div className="text-sm text-purple-700 mt-2 space-y-1">
                  <p><strong>Route:</strong> {currentLinkedTrip.route}</p>
                  <p><strong>Dates:</strong> {formatDate(currentLinkedTrip.startDate)} to {formatDate(currentLinkedTrip.endDate)}</p>
                  <p><strong>Client:</strong> {currentLinkedTrip.clientName}</p>
                </div>
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleRemoveLinkage}
                  >
                    Remove Linkage
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trip Selection */}
        {!currentLinkedTrip && (
          <>
            {availableTrips.length > 0 ? (
              <div className="space-y-4">
                <Select
                  label="Select Trip to Link *"
                  value={selectedTripId}
                  onChange={(e) => handleChange(e.target.value)}
                  options={[
                    { label: 'Select a trip...', value: '' },
                    ...availableTrips.map(trip => ({ 
                      label: `${trip.route} (${formatDate(trip.startDate)} - ${formatDate(trip.endDate)})`, 
                      value: trip.id 
                    }))
                  ]}
                  error={errors.tripId}
                />

                {selectedTripId && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-green-800 mb-2">Selected Trip Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {(() => {
                        const trip = trips.find(t => t.id === selectedTripId);
                        if (!trip) return null;
                        
                        return (
                          <>
                            <div className="flex items-center space-x-2">
                              <Truck className="w-4 h-4 text-green-600" />
                              <div>
                                <p className="text-green-700"><strong>Route:</strong> {trip.route}</p>
                                <p className="text-green-700"><strong>Fleet:</strong> {trip.fleetNumber}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-green-600" />
                              <div>
                                <p className="text-green-700"><strong>Start:</strong> {formatDate(trip.startDate)}</p>
                                <p className="text-green-700"><strong>End:</strong> {formatDate(trip.endDate)}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 col-span-2">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <p className="text-green-700">
                                <strong>Revenue:</strong> {formatCurrency(trip.baseRevenue, trip.revenueCurrency)}
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-start space-x-3">
                    <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Cost Allocation</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        When you link this diesel record to a trip, a cost entry will be automatically created in the trip's expenses.
                        This ensures accurate profitability tracking for the trip.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-amber-800">No Active Trips Available</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      There are no active trips for fleet {dieselRecord.fleetNumber} that can be linked to this diesel record.
                      Please create an active trip for this fleet first.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            icon={<X className="w-4 h-4" />}
          >
            Cancel
          </Button>
          {!currentLinkedTrip && availableTrips.length > 0 && (
            <Button
              onClick={handleSave}
              icon={<Save className="w-4 h-4" />}
              disabled={!selectedTripId}
            >
              Link to Trip
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TripLinkageModal;