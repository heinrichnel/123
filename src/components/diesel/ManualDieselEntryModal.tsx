// ─── React & Context ─────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';

// ─── Types ───────────────────────────────────────────────────────
import { Trip, DRIVERS, FUEL_STATIONS, FLEET_NUMBERS, DieselConsumptionRecord, FLEETS_WITH_PROBES } from '../../types';

// ─── UI Components ───────────────────────────────────────────────
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select, TextArea } from '../ui/FormElements';

// ─── Icons ───────────────────────────────────────────────────────
import { 
  Save, 
  X, 
  Plus, 
  Calculator,
  AlertTriangle,
  Fuel,
  Link,
  Building,
  Clock
} from 'lucide-react';

// ─── Utilities ───────────────────────────────────────────────────
import { formatDate } from '../../utils/helpers';


interface ManualDieselEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManualDieselEntryModal: React.FC<ManualDieselEntryModalProps> = ({
  isOpen,
  onClose
}) => {
  const { addDieselRecord, trips, dieselRecords } = useAppContext();
  
  const [formData, setFormData] = useState({
    fleetNumber: '',
    date: new Date().toISOString().split('T')[0],
    kmReading: '',
    previousKmReading: '',
    litresFilled: '',
    costPerLitre: '',
    totalCost: '',
    fuelStation: '',
    driverName: '',
    notes: '',
    tripId: '', // Link to trip
    currency: 'ZAR' as 'USD' | 'ZAR', // Add currency field with default value
    isReeferUnit: false, // Add flag for reefer units
    linkedHorseId: '', // For reefer units
    hoursOperated: '' // For reefer units - hours of operation
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoCalculate, setAutoCalculate] = useState(true);

  // Get available trips for the selected fleet
  const availableTrips = trips.filter(trip => 
    trip.fleetNumber === formData.fleetNumber && 
    trip.status === 'active'
  );

  // Get available horses for reefer units
  const availableHorses = formData.isReeferUnit ? 
    dieselRecords.filter(record => 
      !record.isReeferUnit && 
      ['4H', '6H', '21H', '22H', '23H', '24H', '26H', '28H', '29H', '30H', '31H', '32H', '33H', 'UD'].includes(record.fleetNumber)
    ) : [];

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Auto-calculate when relevant fields change
    if (autoCalculate && ['litresFilled', 'costPerLitre', 'totalCost', 'hoursOperated'].includes(field) && typeof value === 'string') {
      autoCalculateFields(field, value);
    }
  };

  const autoCalculateFields = (changedField: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setFormData(prev => {
      const litres = changedField === 'litresFilled' ? numValue : parseFloat(prev.litresFilled) || 0;
      const costPerLitre = changedField === 'costPerLitre' ? numValue : parseFloat(prev.costPerLitre) || 0;
      const totalCost = changedField === 'totalCost' ? numValue : parseFloat(prev.totalCost) || 0;

      let newData = { ...prev };

      if (changedField === 'litresFilled' && costPerLitre > 0) {
        newData.totalCost = (litres * costPerLitre).toFixed(2);
      } else if (changedField === 'costPerLitre' && litres > 0) {
        newData.totalCost = (litres * costPerLitre).toFixed(2);
      } else if (changedField === 'totalCost' && litres > 0) {
        newData.costPerLitre = (totalCost / litres).toFixed(2);
      }

      return newData;
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fleetNumber) newErrors.fleetNumber = 'Fleet number is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.litresFilled) newErrors.litresFilled = 'Litres filled is required';
    if (!formData.totalCost) newErrors.totalCost = 'Total cost is required';
    if (!formData.fuelStation) newErrors.fuelStation = 'Fuel station is required';
    if (!formData.driverName) newErrors.driverName = 'Driver name is required';
    if (!formData.currency) newErrors.currency = 'Currency is required';

    // Validate numbers
    if (formData.litresFilled && (isNaN(Number(formData.litresFilled)) || Number(formData.litresFilled) <= 0)) {
      newErrors.litresFilled = 'Must be a valid positive number';
    }
    if (formData.totalCost && (isNaN(Number(formData.totalCost)) || Number(formData.totalCost) <= 0)) {
      newErrors.totalCost = 'Must be a valid positive number';
    }
    
    // For reefer units, validate hours operated
    if (formData.isReeferUnit) {
      if (!formData.hoursOperated) {
        newErrors.hoursOperated = 'Hours operated is required for reefer units';
      } else if (isNaN(Number(formData.hoursOperated)) || Number(formData.hoursOperated) <= 0) {
        newErrors.hoursOperated = 'Hours operated must be a positive number';
      }
    } else {
      // For regular units, validate KM reading
      if (!formData.kmReading || isNaN(Number(formData.kmReading)) || Number(formData.kmReading) <= 0) {
        newErrors.kmReading = 'KM reading must be a valid positive number';
      }
      
      // Validate KM readings
      if (formData.kmReading && formData.previousKmReading) {
        const current = Number(formData.kmReading);
        const previous = Number(formData.previousKmReading);
        if (current <= previous) {
          newErrors.kmReading = 'Current KM must be greater than previous KM';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const kmReading = Number(formData.kmReading);
    const previousKmReading = formData.previousKmReading ? Number(formData.previousKmReading) : undefined;
    const litresFilled = Number(formData.litresFilled);
    const totalCost = Number(formData.totalCost);
    const costPerLitre = formData.costPerLitre ? Number(formData.costPerLitre) : totalCost / litresFilled;
    const hoursOperated = formData.hoursOperated ? Number(formData.hoursOperated) : undefined;

    // Calculate derived values
    const distanceTravelled = !formData.isReeferUnit && previousKmReading !== undefined ? kmReading - previousKmReading : undefined;
    const kmPerLitre = !formData.isReeferUnit && distanceTravelled && litresFilled > 0 ? distanceTravelled / litresFilled : undefined;

    // Create a unique ID for the diesel record
    const newId = `diesel-${Date.now()}`;

    // Prepare the record data
    const recordData: DieselConsumptionRecord = {
      id: newId,
      fleetNumber: formData.fleetNumber,
      date: formData.date,
      kmReading: formData.isReeferUnit ? 0 : kmReading,
      litresFilled,
      costPerLitre,
      totalCost,
      fuelStation: String(formData.fuelStation ?? '').trim(),
      driverName: formData.driverName,
      notes: String(formData.notes ?? '').trim(),
      previousKmReading: formData.isReeferUnit ? undefined : previousKmReading,
      distanceTravelled,
      kmPerLitre,
      currency: formData.currency,
      isReeferUnit: formData.isReeferUnit,
      hoursOperated
    };
    
    // Add trip ID for regular diesel or linked horse ID for reefer units
    if (!formData.isReeferUnit && formData.tripId && typeof formData.tripId === 'string' && formData.tripId.trim() !== '') {
      recordData.tripId = formData.tripId;
    } else if (formData.isReeferUnit && formData.linkedHorseId && typeof formData.linkedHorseId === 'string' && formData.linkedHorseId.trim() !== '') {
      recordData.linkedHorseId = formData.linkedHorseId;
    }

    try {
      addDieselRecord(recordData);
      
      // Prepare success message
      let successMessage = `Diesel record added successfully!\n\nFleet: ${formData.fleetNumber}\n`;
      
      if (formData.isReeferUnit) {
        successMessage += `Reefer Unit\n`;
        successMessage += `Hours Operated: ${hoursOperated} hours\n`;
        successMessage += `Consumption Rate: ${(litresFilled / (hoursOperated || 1)).toFixed(2)} L/hr\n`;
        
        if (formData.linkedHorseId) {
          const horseRecord = dieselRecords.find(r => r.id === formData.linkedHorseId);
          successMessage += `Linked to Horse: ${horseRecord?.fleetNumber || formData.linkedHorseId}\n`;
          
          // If the horse is linked to a trip, mention that costs will be allocated
          if (horseRecord?.tripId) {
            const trip = trips.find(t => t.id === horseRecord.tripId);
            successMessage += `Cost will be allocated to trip: ${trip?.route || horseRecord.tripId}\n`;
          }
        }
      } else {
        successMessage += `KM/L: ${kmPerLitre?.toFixed(2) || 'N/A'}\n`;
        if (formData.tripId) {
          const trip = trips.find(t => t.id === formData.tripId);
          successMessage += `Linked to Trip: ${trip?.route || formData.tripId}\n`;
          successMessage += `Cost will be allocated to trip expenses\n`;
        }
      }
      
      successMessage += `Cost: ${formData.currency === 'USD' ? '$' : 'R'}${totalCost.toFixed(2)}\n`;
      
      alert(successMessage);
      
      // Reset form
      setFormData({
        fleetNumber: '',
        date: new Date().toISOString().split('T')[0],
        kmReading: '',
        previousKmReading: '',
        litresFilled: '',
        costPerLitre: '',
        totalCost: '',
        fuelStation: '',
        driverName: '',
        notes: '',
        tripId: '',
        currency: 'ZAR',
        isReeferUnit: false,
        linkedHorseId: '',
        hoursOperated: ''
      });
      setErrors({});
      onClose();
    } catch (err: any) {
      alert('Failed to add diesel record. Please check all fields and try again.\n' + (err?.message || ''));
    }
  };

  const calculateDistance = () => {
    if (formData.kmReading && formData.previousKmReading) {
      const distance = Number(formData.kmReading) - Number(formData.previousKmReading);
      return distance > 0 ? distance : 0;
    }
    return 0;
  };

  const calculateKmPerLitre = () => {
    const distance = calculateDistance();
    const litres = Number(formData.litresFilled) || 0;
    return distance > 0 && litres > 0 ? distance / litres : 0;
  };

  const calculateLitresPerHour = () => {
    const litres = Number(formData.litresFilled) || 0;
    const hours = Number(formData.hoursOperated) || 0;
    return hours > 0 ? litres / hours : 0;
  };

  // Check if the selected fleet is a reefer unit
  const isReeferUnit = ['4F', '5F', '6F', '7F', '8F'].includes(formData.fleetNumber);
  
  // Check if the selected fleet has a probe
  const hasProbe = FLEETS_WITH_PROBES.includes(formData.fleetNumber);

  // Update isReeferUnit when fleet number changes
  useEffect(() => {
    if (['4F', '5F', '6F', '7F', '8F'].includes(formData.fleetNumber)) {
      setFormData(prev => ({ ...prev, isReeferUnit: true }));
    } else {
      setFormData(prev => ({ ...prev, isReeferUnit: false }));
    }
  }, [formData.fleetNumber]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Diesel Entry"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start space-x-3">
            <Fuel className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Manual Diesel Record Entry</h4>
              <p className="text-sm text-blue-700 mt-1">
                Add diesel consumption records manually. All efficiency calculations will be performed automatically.
                You can optionally link this record to an active trip for cost allocation.
              </p>
            </div>
          </div>
        </div>

        {/* Auto-Calculate Toggle */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="autoCalculate"
            checked={autoCalculate}
            onChange={(e) => setAutoCalculate(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="autoCalculate" className="flex items-center text-sm font-medium text-gray-700">
            <Calculator className="w-4 h-4 mr-2" />
            Auto-calculate costs and efficiency
          </label>
        </div>

        {/* Reefer Unit Toggle */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isReeferUnit"
            checked={formData.isReeferUnit}
            onChange={(e) => handleChange('isReeferUnit', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isReeferUnit" className="flex items-center text-sm font-medium text-gray-700">
            <Building className="w-4 h-4 mr-2" />
            This is a refrigeration trailer (4F, 5F, 6F, 7F, 8F)
          </label>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Fleet Number *"
            value={formData.fleetNumber}
            onChange={val => handleChange('fleetNumber', val)}
            options={[
              { label: 'Select fleet...', value: '' },
              ...FLEET_NUMBERS.map(f => ({ 
                label: `${f}${FLEETS_WITH_PROBES.includes(f) ? ' (Probe)' : ['4F', '5F', '6F', '7F', '8F'].includes(f) ? ' (Reefer)' : ''}`, 
                value: f 
              }))
            ]}
            error={errors.fleetNumber}
          />

          <Input
            label="Date *"
            type="date"
            value={formData.date}
            onChange={val => handleChange('date', val)}
            error={errors.date}
          />

          {!formData.isReeferUnit ? (
            <>
              <Input
                label="Current KM Reading *"
                type="number"
                step="1"
                min="0"
                value={formData.kmReading}
                onChange={val => handleChange('kmReading', val)}
                placeholder="125000"
                error={errors.kmReading}
              />

              <Input
                label="Previous KM Reading"
                type="number"
                step="1"
                min="0"
                value={formData.previousKmReading}
                onChange={val => handleChange('previousKmReading', val)}
                placeholder="123560"
                error={errors.previousKmReading}
              />
            </>
          ) : (
            <Input
              label="Hours Operated *"
              type="number"
              step="0.1"
              min="0.1"
              value={formData.hoursOperated}
              onChange={val => handleChange('hoursOperated', val)}
              placeholder="5.5"
              error={errors.hoursOperated}
            />
          )}

          <Input
            label="Litres Filled *"
            type="number"
            step="0.1"
            min="0.1"
            value={formData.litresFilled}
            onChange={val => handleChange('litresFilled', val)}
            placeholder="450"
            error={errors.litresFilled}
          />

          <Input
            label="Cost per Litre"
            type="number"
            step="0.01"
            min="0"
            value={formData.costPerLitre}
            onChange={val => handleChange('costPerLitre', val)}
            placeholder="18.50"
            error={errors.costPerLitre}
          />

          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Currency *"
              value={formData.currency}
              onChange={val => handleChange('currency', val)}
              options={[
                { label: 'ZAR (R)', value: 'ZAR' },
                { label: 'USD ($)', value: 'USD' }
              ]}
              error={errors.currency}
            />
            
            <Input
              label="Total Cost *"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.totalCost}
              onChange={val => handleChange('totalCost', val)}
              placeholder="8325.00"
              error={errors.totalCost}
            />
          </div>

          <Select
            label="Fuel Station *"
            value={formData.fuelStation}
            onChange={val => handleChange('fuelStation', val)}
            options={[
              { label: 'Select fuel station...', value: '' },
              ...FUEL_STATIONS.map(station => ({ label: station, value: station }))
            ]}
            error={errors.fuelStation}
          />

          <Select
            label="Driver *"
            value={formData.driverName}
            onChange={val => handleChange('driverName', val)}
            options={[
              { label: 'Select driver...', value: '' },
              ...DRIVERS.map(d => ({ label: d, value: d }))
            ]}
            error={errors.driverName}
          />

          {!formData.isReeferUnit ? (
            <Select
              label="Link to Trip (Optional)"
              value={formData.tripId}
              onChange={val => handleChange('tripId', val)}
              options={[
                { label: 'No trip linkage', value: '' },
                ...availableTrips.map(trip => ({ 
                  label: `${trip.route} (${formatDate(trip.startDate)} - ${formatDate(trip.endDate)})`, 
                  value: trip.id 
                }))
              ]}
              disabled={!formData.fleetNumber}
            />
          ) : (
            <Select
              label="Link to Horse (Optional)"
              value={formData.linkedHorseId}
              onChange={val => handleChange('linkedHorseId', val)}
              options={[
                { label: 'No horse linkage', value: '' },
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
              disabled={!formData.fleetNumber}
            />
          )}
        </div>

        <TextArea
          label="Notes"
          value={formData.notes}
          onChange={val => handleChange('notes', val)}
          placeholder="Additional notes about this fuel entry..."
          rows={3}
        />

        {/* Calculation Preview */}
        {!formData.isReeferUnit && (formData.kmReading && formData.previousKmReading && formData.litresFilled) && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-green-800 mb-2">Calculated Metrics</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-green-600">Distance Travelled</p>
                <p className="font-bold text-green-800">{calculateDistance().toLocaleString()} km</p>
              </div>
              <div>
                <p className="text-green-600">Efficiency</p>
                <p className="font-bold text-green-800">{calculateKmPerLitre().toFixed(2)} KM/L</p>
              </div>
              <div>
                <p className="text-green-600">Cost per KM</p>
                <p className="font-bold text-green-800">
                  {formData.currency === 'USD' ? '$' : 'R'}{calculateDistance() > 0 ? (Number(formData.totalCost) / calculateDistance()).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reefer Unit Calculation Preview */}
        {formData.isReeferUnit && formData.litresFilled && formData.hoursOperated && (
          <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-purple-800 mb-2">Reefer Unit Metrics</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-purple-600">Hours Operated</p>
                <p className="font-bold text-purple-800">{Number(formData.hoursOperated).toFixed(1)} hours</p>
              </div>
              <div>
                <p className="text-purple-600">Consumption Rate</p>
                <p className="font-bold text-purple-800">{calculateLitresPerHour().toFixed(2)} L/hr</p>
              </div>
              <div>
                <p className="text-purple-600">Cost per Hour</p>
                <p className="font-bold text-purple-800">
                  {formData.currency === 'USD' ? '$' : 'R'}{Number(formData.hoursOperated) > 0 ? (Number(formData.totalCost) / Number(formData.hoursOperated)).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reefer Unit Info */}
        {formData.isReeferUnit && (
          <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-purple-800">Refrigeration Trailer Information</h4>
                <p className="text-sm text-purple-700 mt-1">
                  Refrigeration trailers are measured in litres per hour instead of kilometers per litre.
                  Please enter the number of hours the reefer unit was operated.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Trip Linkage Info */}
        {formData.tripId && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <Link className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Trip Cost Allocation</h4>
                <p className="text-sm text-blue-700 mt-1">
                  This diesel cost will be automatically allocated to the selected trip for accurate profitability tracking.
                  The cost will appear in the trip's expense breakdown.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Horse Linkage Info */}
        {formData.isReeferUnit && formData.linkedHorseId && (
          <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <Link className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-purple-800">Horse Linkage</h4>
                <p className="text-sm text-purple-700 mt-1">
                  This reefer diesel cost will be linked to the selected horse. If the horse is linked to a trip,
                  the cost will be automatically allocated to that trip.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Validation Warnings */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Please fix the following errors:</h4>
                <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                  {Object.values(errors).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            icon={<X className="w-4 h-4" />}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            icon={<Save className="w-4 h-4" />}
          >
            Add Diesel Record
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ManualDieselEntryModal;