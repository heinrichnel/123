// ─── React ───────────────────────────────────────────────────────
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
  Link
} from 'lucide-react';
import { FLEET_NUMBERS, DRIVERS } from '../../types';
import { useAppContext } from '../../context/AppContext';


interface ManualDieselEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManualDieselEntryModal: React.FC<ManualDieselEntryModalProps> = ({
  isOpen,
  onClose
}) => {
  const { addDieselRecord, trips } = useAppContext();
  
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
    tripId: '' // Link to trip
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoCalculate, setAutoCalculate] = useState(true);

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

    // Calculate derived values
    const distanceTravelled = previousKmReading ? kmReading - previousKmReading : undefined;
    const kmPerLitre = distanceTravelled && litresFilled > 0 ? distanceTravelled / litresFilled : undefined;

    const recordData = {
      fleetNumber: formData.fleetNumber,
      date: formData.date,
      kmReading,
      litresFilled,
      costPerLitre,
      totalCost,
      fuelStation: String(formData.fuelStation ?? '').trim(),
      driverName: formData.driverName,
      notes: String(formData.notes ?? '').trim(),
      previousKmReading,
      distanceTravelled,
      kmPerLitre,
      tripId: formData.tripId || undefined // Link to trip
    };

    addDieselRecord(recordData);
    
    alert(`Diesel record added successfully!\n\nFleet: ${formData.fleetNumber}\nKM/L: ${kmPerLitre?.toFixed(2) || 'N/A'}\nCost: R${totalCost.toFixed(2)}\n\n${formData.tripId ? 'Linked to trip for cost allocation.' : 'No trip linkage - standalone record.'}`);
    
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
      tripId: ''
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

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Fleet Number *"
            value={formData.fleetNumber}
            onChange={value => handleChange('fleetNumber', value)}
            options={[
              { label: 'Select fleet...', value: '' },
              ...FLEET_NUMBERS.map(f => ({ label: f, value: f }))
            ]}
            error={errors.fleetNumber}
          />

          <Input
            label="Date *"
            type="date"
            value={formData.date}
            onChange={value => handleChange('date', value)}
            error={errors.date}
          />

          <Input
            label="Current KM Reading *"
            type="number"
            step="1"
            min="0"
            value={formData.kmReading}
            onChange={value => handleChange('kmReading', value)}
            placeholder="125000"
            error={errors.kmReading}
          />

          <Input
            label="Previous KM Reading"
            type="number"
            step="1"
            min="0"
            value={formData.previousKmReading}
            onChange={value => handleChange('previousKmReading', value)}
            placeholder="123560"
            error={errors.previousKmReading}
          />

          <Input
            label="Litres Filled *"
            type="number"
            step="0.1"
            min="0.1"
            value={formData.litresFilled}
            onChange={value => handleChange('litresFilled', value)}
            placeholder="450"
            error={errors.litresFilled}
          />

          <Input
            label="Cost per Litre (R)"
            type="number"
            step="0.01"
            min="0"
            value={formData.costPerLitre}
            onChange={value => handleChange('costPerLitre', value)}
            placeholder="18.50"
            error={errors.costPerLitre}
          />

          <Input
            label="Total Cost (R) *"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.totalCost}
            onChange={value => handleChange('totalCost', value)}
            placeholder="8325.00"
            error={errors.totalCost}
          />

          <Input
            label="Fuel Station *"
            value={formData.fuelStation}
            onChange={value => handleChange('fuelStation', value)}
            placeholder="RAM Petroleum Harare"
            error={errors.fuelStation}
          />

          <Select
            label="Driver *"
            value={formData.driverName}
            onChange={value => handleChange('driverName', value)}
            options={[
              { label: 'Select driver...', value: '' },
              ...DRIVERS.map(d => ({ label: d, value: d }))
            ]}
            error={errors.driverName}
          />

          <Select
            label="Link to Trip (Optional)"
            value={formData.tripId}
            onChange={value => handleChange('tripId', value)}
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
          onChange={value => handleChange('notes', value)}
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
                  R{calculateDistance() > 0 ? (Number(formData.totalCost) / calculateDistance()).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
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
