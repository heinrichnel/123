// ─── React ───────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';

// ─── Context ─────────────────────────────────────────────────────
import { useAppContext } from '../../context/AppContext';

// ─── UI Components ───────────────────────────────────────────────
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Select } from '../ui/FormElements';

// ─── Icons ───────────────────────────────────────────────────────
import {
  Link,
  X,
  Save,
  AlertTriangle,
  DollarSign,
  Truck,
  Calendar
} from 'lucide-react';

// ─── Utilities ───────────────────────────────────────────────────
import { formatCurrency, formatDate } from '../../utils/helpers';


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
  const { trips, dieselRecords, allocateDieselToTrip, removeDieselFromTrip, updateDieselRecord, deleteCostEntry } = useAppContext();
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [selectedHorseId, setSelectedHorseId] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the diesel record
  const dieselRecord = dieselRecords.find(r => r.id === dieselRecordId);
  if (!dieselRecord) return null;

  // Check if it's a reefer unit
  const isReeferUnit = dieselRecord.isReeferUnit || ['4F', '5F', '6F', '7F', '8F'].includes(dieselRecord.fleetNumber);

  // Get available trips for the selected fleet (for non-reefer units)
  const availableTrips = !isReeferUnit ? trips.filter(trip => 
    trip.fleetNumber === dieselRecord.fleetNumber && 
    trip.status === 'active'
  ) : [];

  // Get available horse diesel records (for reefer units)
  const availableHorses = isReeferUnit ? dieselRecords.filter(record => 
    !record.isReeferUnit && 
    ['4H', '6H', '21H', '22H', '23H', '24H', '26H', '28H', '29H', '30H', '31H', '32H', '33H', 'UD'].includes(record.fleetNumber)
  ) : [];

  // Check if already linked
  const currentLinkedTrip = !isReeferUnit && dieselRecord.tripId ? 
    trips.find(t => t.id === dieselRecord.tripId) : undefined;

  const currentLinkedHorse = isReeferUnit && dieselRecord.linkedHorseId ?
    dieselRecords.find(r => r.id === dieselRecord.linkedHorseId) : undefined;

  // Reset selection when modal opens or diesel record changes
  useEffect(() => {
    if (isOpen && dieselRecord) {
      setSelectedTripId(dieselRecord.tripId || '');
      setSelectedHorseId(dieselRecord.linkedHorseId || '');
      setErrors({});
    }
  }, [isOpen, dieselRecord]);

  const handleChange = (field: string, value: string) => {
    if (field === 'tripId') {
      setSelectedTripId(value);
    } else if (field === 'horseId') {
      setSelectedHorseId(value);
    }
    setErrors({});
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      
      if (!isReeferUnit) {
        // Regular diesel record - link to trip
        if (!selectedTripId) {
          setErrors({ tripId: 'Please select a trip to link this diesel record to' });
          setIsSubmitting(false);
          return;
        }

        await allocateDieselToTrip(dieselRecordId, selectedTripId);
        
        const trip = trips.find(t => t.id === selectedTripId);
        alert(`Diesel record successfully linked to trip!\n\nTrip: ${trip?.route}\nDates: ${trip?.startDate} to ${trip?.endDate}\n\nA cost entry has been automatically created in the trip's expenses.`);
      } else {
        // Reefer unit - link to horse
        if (!selectedHorseId) {
          setErrors({ horseId: 'Please select a horse to link this reefer unit to' });
          setIsSubmitting(false);
          return;
        }

        // Update the diesel record with the linked horse ID
        const updatedRecord = {
          ...dieselRecord,
          linkedHorseId: selectedHorseId,
          updatedAt: new Date().toISOString()
        };
        
        await updateDieselRecord(updatedRecord);
        
        // If the horse is linked to a trip, create a cost entry
        const horseRecord = dieselRecords.find(r => r.id === selectedHorseId);
        if (horseRecord?.tripId) {
          const trip = trips.find(t => t.id === horseRecord.tripId);
          
          alert(`Reefer diesel record successfully linked to horse ${horseRecord.fleetNumber}!\n\n${trip ? `Trip: ${trip.route}\nDates: ${trip.startDate} to ${trip.endDate}\n\nA cost entry has been automatically created in the trip's expenses.` : 'No active trip found for this horse.'}`);
        } else {
          alert(`Reefer diesel record successfully linked to horse ${horseRecord?.fleetNumber || selectedHorseId}!\n\nNo active trip found for this horse. When the horse is linked to a trip, the reefer diesel cost will be automatically added.`);
        }
      }
      
      onClose();
    } catch (error) {
      console.error("Error linking diesel record:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveLinkage = async () => {
    try {
      setIsSubmitting(true);
      
      if (!isReeferUnit && dieselRecord.tripId) {
        // Remove trip linkage
        await removeDieselFromTrip(dieselRecordId);
        alert('Diesel record has been unlinked from the trip and the cost entry has been removed.');
      } else if (isReeferUnit && dieselRecord.linkedHorseId) {
        const horseRecord = dieselRecords.find(r => r.id === dieselRecord.linkedHorseId);
        
        // Update the diesel record to remove the linked horse ID
        const updatedRecord = {
          ...dieselRecord,
          linkedHorseId: undefined,
          updatedAt: new Date().toISOString()
        };
        
        await updateDieselRecord(updatedRecord);
        
        // If the horse is linked to a trip, remove the cost entry
        if (horseRecord?.tripId) {
          const trip = trips.find(t => t.id === horseRecord.tripId);
          if (trip) {
            const costEntry = trip.costs.find(c => 
              c.referenceNumber === `REEFER-DIESEL-${dieselRecordId}`
            );
            
            if (costEntry) {
              await deleteCostEntry(costEntry.id);
            }
          }
        }
        
        alert('Reefer diesel record has been unlinked from the horse and any associated cost entries have been removed.');
      }
      
      onClose();
    } catch (error) {
      console.error("Error removing linkage:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReeferUnit ? "Link Reefer Diesel to Horse" : "Link Diesel Record to Trip"}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Diesel Record Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Diesel Record Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <p><strong>Fleet:</strong> {dieselRecord.fleetNumber} {isReeferUnit ? '(Reefer)' : ''}</p>
              <p><strong>Driver:</strong> {dieselRecord.driverName}</p>
              <p><strong>Date:</strong> {formatDate(dieselRecord.date)}</p>
            </div>
            <div>
              <p><strong>Litres:</strong> {dieselRecord.litresFilled}</p>
              <p><strong>Cost:</strong> {formatCurrency(dieselRecord.totalCost, dieselRecord.currency || 'ZAR')}</p>
              <p><strong>Station:</strong> {dieselRecord.fuelStation}</p>
            </div>
          </div>
        </div>

        {/* Current Linkage Status - For Regular Diesel */}
        {!isReeferUnit && currentLinkedTrip && (
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
                    disabled={isSubmitting}
                  >
                    Remove Linkage
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Linkage Status - For Reefer Diesel */}
        {isReeferUnit && currentLinkedHorse && (
          <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <Link className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-purple-800">Currently Linked to Horse</h4>
                <div className="text-sm text-purple-700 mt-2 space-y-1">
                  <p><strong>Horse:</strong> {currentLinkedHorse.fleetNumber}</p>
                  <p><strong>Driver:</strong> {currentLinkedHorse.driverName}</p>
                  {currentLinkedHorse.tripId && (
                    <p><strong>Trip:</strong> {trips.find(t => t.id === currentLinkedHorse.tripId)?.route || 'Unknown'}</p>
                  )}
                </div>
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleRemoveLinkage}
                    disabled={isSubmitting}
                  >
                    Remove Linkage
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trip Selection - For Regular Diesel */}
        {!isReeferUnit && !currentLinkedTrip && (
          <>
            {availableTrips.length > 0 ? (
              <div className="space-y-4">
                <Select
                  label="Select Trip to Link *"
                  value={selectedTripId}
                  onChange={value => handleChange('tripId', value)}
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

        {/* Horse Selection - For Reefer Diesel */}
        {isReeferUnit && !currentLinkedHorse && (
          <>
            {availableHorses.length > 0 ? (
              <div className="space-y-4">
                <Select
                  label="Select Horse to Link *"
                  value={selectedHorseId}
                  onChange={value => handleChange('horseId', value)}
                  options={[
                    { label: 'Select a horse...', value: '' },
                    ...availableHorses.map(horse => {
                      const tripInfo = horse.tripId ? 
                        ` - ${trips.find(t => t.id === horse.tripId)?.route || 'Unknown Trip'}` : 
                        ' - No active trip';
                      return { 
                        label: `${horse.fleetNumber} (${horse.driverName})${tripInfo}`, 
                        value: horse.id 
                      };
                    })
                  ]}
                  error={errors.horseId}
                />

                {selectedHorseId && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-green-800 mb-2">Selected Horse Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {(() => {
                        const horse = dieselRecords.find(r => r.id === selectedHorseId);
                        if (!horse) return null;
                        
                        const trip = horse.tripId ? trips.find(t => t.id === horse.tripId) : null;
                        
                        return (
                          <>
                            <div className="flex items-center space-x-2">
                              <Truck className="w-4 h-4 text-green-600" />
                              <div>
                                <p className="text-green-700"><strong>Fleet:</strong> {horse.fleetNumber}</p>
                                <p className="text-green-700"><strong>Driver:</strong> {horse.driverName}</p>
                              </div>
                            </div>
                            {trip && (
                              <>
                                <div className="flex items-center space-x-2">
                                  <Calendar className="w-4 h-4 text-green-600" />
                                  <div>
                                    <p className="text-green-700"><strong>Route:</strong> {trip.route}</p>
                                    <p className="text-green-700"><strong>Dates:</strong> {formatDate(trip.startDate)} - {formatDate(trip.endDate)}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 col-span-2">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <p className="text-green-700">
                                    <strong>Revenue:</strong> {formatCurrency(trip.baseRevenue, trip.revenueCurrency)}
                                  </p>
                                </div>
                              </>
                            )}
                            {!trip && (
                              <div className="flex items-center space-x-2 col-span-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                <p className="text-amber-700">
                                  <strong>No active trip found for this horse.</strong> The reefer diesel cost will be added when the horse is linked to a trip.
                                </p>
                              </div>
                            )}
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
                      <h4 className="text-sm font-medium text-blue-800">Reefer Cost Allocation</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        When you link this reefer diesel record to a horse, the cost will be automatically allocated to the horse's trip (if available).
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
                    <h4 className="text-sm font-medium text-amber-800">No Horse Records Available</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      There are no horse diesel records available to link this reefer unit to.
                      Please add diesel records for horse units first.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            icon={<X className="w-4 h-4" />}
          >
            Cancel
          </Button>
          {!currentLinkedTrip && !currentLinkedHorse && (
            <Button
              onClick={handleSave}
              disabled={isSubmitting || (!isReeferUnit && !selectedTripId) || (isReeferUnit && !selectedHorseId)}
              isLoading={isSubmitting}
              icon={<Save className="w-4 h-4" />}
            >
              {isReeferUnit ? 'Link to Horse' : 'Link to Trip'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TripLinkageModal;