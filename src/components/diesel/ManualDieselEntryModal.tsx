import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select, TextArea } from '../ui/FormElements';
import { 
  Save, 
  X, 
  Plus, 
  Calculator,
  AlertTriangle,
  Fuel,
  Link,
  Database
} from 'lucide-react';
import { FLEET_NUMBERS, DRIVERS, TRUCKS_WITH_PROBES } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface ManualDieselEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManualDieselEntryModal: React.FC<ManualDieselEntryModalProps> = ({
  isOpen,
  onClose
}) => {
  const { addDieselRecord, trips, connectionStatus } = useAppContext();
  
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
    currency: 'ZAR' as 'USD' | 'ZAR',
    probeReading: '' // NEW: Probe reading field
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoCalculate, setAutoCalculate] = useState(true);

  // Check if selected fleet has a probe
  const hasProbe = TRUCKS_WITH_PROBES.includes(formData.fleetNumber);

  // Get available trips for the selected fleet
  const availableTrips = trips.filter(trip => 
    trip.fleetNumber === formData.fleetNumber && 
    trip.status === 'active'
  );

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Auto-calculate when relevant fields change
    if (autoCalculate && ['litresFilled', 'costPerLitre', 'totalCost'].includes(field)) {
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
    if (!formData.kmReading) newErrors.kmReading = 'KM reading is required';
    if (!formData.litresFilled) newErrors.litresFilled = 'Litres filled is required';
    if (!formData.totalCost) newErrors.totalCost = 'Total cost is required';
    if (!formData.fuelStation) newErrors.fuelStation = 'Fuel station is required';
    if (!formData.driverName) newErrors.driverName = 'Driver name is required';

    // Validate numbers
    if (formData.kmReading && (isNaN(Number(formData.kmReading)) || Number(formData.kmReading) <= 0)) {
      newErrors.kmReading = 'Must be a valid positive number';
    }
    if (formData.previousKmReading && (isNaN(Number(formData.previousKmReading)) || Number(formData.previousKmReading) < 0)) {
      newErrors.previousKmReading = 'Must be a valid number';
    }
    if (formData.litresFilled && (isNaN(Number(formData.litresFilled)) || Number(formData.litresFilled) <= 0)) {
      newErrors.litresFilled = 'Must be a valid positive number';
    }
    if (formData.totalCost && (isNaN(Number(formData.totalCost)) || Number(formData.totalCost) <= 0)) {
      newErrors.totalCost = 'Must be a valid positive number';
    }

    // Validate KM readings
    if (formData.kmReading && formData.previousKmReading) {
      const current = Number(formData.kmReading);
      const previous = Number(formData.previousKmReading);
      if (current <= previous) {
        newErrors.kmReading = 'Current KM must be greater than previous KM';
      }
    }

    // Validate probe reading if truck has probe
    if (hasProbe) {
      if (!formData.probeReading) {
        newErrors.probeReading = 'Probe reading is required for this truck';
      } else if (isNaN(Number(formData.probeReading)) || Number(formData.probeReading) < 0) {
        newErrors.probeReading = 'Must be a valid number';
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
    const probeReading = formData.probeReading ? Number(formData.probeReading) : undefined;

    // Calculate derived values
    const distanceTravelled = previousKmReading ? kmReading - previousKmReading : undefined;
    const kmPerLitre = distanceTravelled && litresFilled > 0 ? distanceTravelled / litresFilled : undefined;

    // Calculate probe discrepancy if applicable
    const probeDiscrepancy = probeReading && litresFilled ? litresFilled - probeReading : undefined;
    const probeVerified = probeReading !== undefined;

    const recordData = {
      fleetNumber: formData.fleetNumber,
      date: formData.date,
      kmReading,
      litresFilled,
      costPerLitre,
      totalCost,
      fuelStation: formData.fuelStation.trim(),
      driverName: formData.driverName,
      notes: formData.notes.trim(),
      previousKmReading,
      distanceTravelled,
      kmPerLitre,
      tripId: formData.tripId || undefined, // Link to trip
      currency: formData.currency,
      hasProbe,
      probeReading,
      probeDiscrepancy,
      probeVerified
    };

    addDieselRecord(recordData);
    
    // Prepare alert message
    let alertMessage = `Diesel record added successfully!\n\nFleet: ${formData.fleetNumber}\nKM/L: ${kmPerLitre?.toFixed(2) || 'N/A'}\nCost: ${formData.currency === 'USD' ? '$' : 'R'}${totalCost.toFixed(2)}\n\n${formData.tripId ? 'Linked to trip for cost allocation.' : 'No trip linkage - standalone record.'}`;
    
    // Add probe verification info if applicable
    if (hasProbe && probeDiscrepancy !== undefined) {
      const discrepancyAbs = Math.abs(probeDiscrepancy);
      if (discrepancyAbs > 50) {
        alertMessage += `\n\n⚠️ WARNING: Large probe discrepancy detected (${discrepancyAbs.toFixed(1)}L).\nThis has been flagged for investigation.`;
      } else {
        alertMessage += `\n\nProbe verification: ${discrepancyAbs.toFixed(1)}L difference (within acceptable range).`;
      }
    }
    
    alert(alertMessage);
    
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
      probeReading: ''
    });
    setErrors({});
    onClose();
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

  // Calculate probe discrepancy
  const calculateProbeDiscrepancy = () => {
    if (!hasProbe || !formData.probeReading || !formData.litresFilled) return null;
    
    const probeReading = Number(formData.probeReading);
    const litresFilled = Number(formData.litresFilled);
    
    return litresFilled - probeReading;
  };

  const probeDiscrepancy = calculateProbeDiscrepancy();
  const hasLargeDiscrepancy = probeDiscrepancy !== null && Math.abs(probeDiscrepancy) > 50;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Diesel Entry"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Connection Status Warning */}
        {connectionStatus !== 'connected' && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <Database className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">Working Offline</h4>
                <p className="text-sm text-amber-700 mt-1">
                  You're currently working offline. This diesel record will be stored locally and synced when your connection is restored.
                </p>
              </div>
            </div>
          </div>
        )}

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

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Fleet Number *"
            value={formData.fleetNumber}
            onChange={(e) => handleChange('fleetNumber', e.target.value)}
            options={[
              { label: 'Select fleet...', value: '' },
              ...FLEET_NUMBERS.map(f => ({ 
                label: `${f}${TRUCKS_WITH_PROBES.includes(f) ? ' (Has Probe)' : ''}`, 
                value: f 
              }))
            ]}
            error={errors.fleetNumber}
          />

          <Input
            label="Date *"
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            error={errors.date}
          />

          <Input
            label="Current KM Reading *"
            type="number"
            step="1"
            min="0"
            value={formData.kmReading}
            onChange={(e) => handleChange('kmReading', e.target.value)}
            placeholder="125000"
            error={errors.kmReading}
          />

          <Input
            label="Previous KM Reading"
            type="number"
            step="1"
            min="0"
            value={formData.previousKmReading}
            onChange={(e) => handleChange('previousKmReading', e.target.value)}
            placeholder="123560"
            error={errors.previousKmReading}
          />

          <Input
            label="Litres Filled *"
            type="number"
            step="0.1"
            min="0.1"
            value={formData.litresFilled}
            onChange={(e) => handleChange('litresFilled', e.target.value)}
            placeholder="450"
            error={errors.litresFilled}
          />

          {/* NEW: Probe Reading field for trucks with probes */}
          {hasProbe && (
            <Input
              label="Probe Reading (Litres) *"
              type="number"
              step="0.1"
              min="0"
              value={formData.probeReading}
              onChange={(e) => handleChange('probeReading', e.target.value)}
              placeholder="e.g., 445.5"
              error={errors.probeReading}
            />
          )}

          <Select
            label="Currency *"
            value={formData.currency}
            onChange={(e) => handleChange('currency', e.target.value)}
            options={[
              { label: 'ZAR (R)', value: 'ZAR' },
              { label: 'USD ($)', value: 'USD' }
            ]}
          />

          <Input
            label={`Cost per Litre (${formData.currency === 'USD' ? '$' : 'R'})`}
            type="number"
            step="0.01"
            min="0"
            value={formData.costPerLitre}
            onChange={(e) => handleChange('costPerLitre', e.target.value)}
            placeholder="18.50"
            error={errors.costPerLitre}
          />

          <Input
            label={`Total Cost (${formData.currency === 'USD' ? '$' : 'R'}) *`}
            type="number"
            step="0.01"
            min="0.01"
            value={formData.totalCost}
            onChange={(e) => handleChange('totalCost', e.target.value)}
            placeholder="8325.00"
            error={errors.totalCost}
          />

          <Input
            label="Fuel Station *"
            value={formData.fuelStation}
            onChange={(e) => handleChange('fuelStation', e.target.value)}
            placeholder="RAM Petroleum Harare"
            error={errors.fuelStation}
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

          {/* Trip Linkage */}
          <Select
            label="Link to Trip (Optional)"
            value={formData.tripId}
            onChange={(e) => handleChange('tripId', e.target.value)}
            options={[
              { label: 'No trip linkage', value: '' },
              ...availableTrips.map(trip => ({ 
                label: `${trip.route} (${trip.startDate} - ${trip.endDate})`, 
                value: trip.id 
              }))
            ]}
            disabled={!formData.fleetNumber}
          />
        </div>

        <TextArea
          label="Notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Additional notes about this fuel entry..."
          rows={3}
        />

        {/* Calculation Preview */}
        {(formData.kmReading && formData.previousKmReading && formData.litresFilled) && (
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

        {/* Probe Verification Preview */}
        {hasProbe && formData.probeReading && formData.litresFilled && (
          <div className={`border rounded-md p-4 ${hasLargeDiscrepancy ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <h4 className={`text-sm font-medium mb-2 ${hasLargeDiscrepancy ? 'text-red-800' : 'text-green-800'}`}>
              Probe Verification
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className={hasLargeDiscrepancy ? 'text-red-600' : 'text-green-600'}>Filled Amount</p>
                <p className="font-bold">{Number(formData.litresFilled).toFixed(1)}L</p>
              </div>
              <div>
                <p className={hasLargeDiscrepancy ? 'text-red-600' : 'text-green-600'}>Probe Reading</p>
                <p className="font-bold">{Number(formData.probeReading).toFixed(1)}L</p>
              </div>
              <div>
                <p className={hasLargeDiscrepancy ? 'text-red-600' : 'text-green-600'}>Discrepancy</p>
                <p className={`font-bold ${hasLargeDiscrepancy ? 'text-red-800' : 'text-green-800'}`}>
                  {probeDiscrepancy !== null ? Math.abs(probeDiscrepancy).toFixed(1) : '0'}L
                </p>
              </div>
            </div>
            
            {hasLargeDiscrepancy && (
              <div className="mt-3 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">
                  <strong>WARNING:</strong> Large discrepancy detected between filled amount and probe reading. 
                  This will be flagged for investigation.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Trip Linkage Info */}
        {formData.tripId && (
          <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <Link className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-purple-800">Trip Cost Allocation</h4>
                <p className="text-sm text-purple-700 mt-1">
                  This diesel cost will be automatically allocated to the selected trip for accurate profitability tracking.
                  The cost will appear in the trip's expense breakdown.
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

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
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