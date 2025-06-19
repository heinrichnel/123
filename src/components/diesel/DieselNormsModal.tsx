// ─── React ───────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';

// ─── UI Components ───────────────────────────────────────────────
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card, { CardContent, CardHeader } from '../ui/Card';
import { Input } from '../ui/FormElements';

// ─── Utilities ───────────────────────────────────────────────────
import { formatCurrency, formatDate } from '../../utils/helpers';

// ─── Icons ───────────────────────────────────────────────────────
import {
  Save,
  X,
  Settings,
  AlertTriangle,
  Plus,
  Trash2,
  History,
  Clock
} from 'lucide-react';

// ─── Constants / Types ───────────────────────────────────────────
import { FLEET_NUMBERS } from '../../types';

// Define which fleets have probes
const FLEETS_WITH_PROBES = ['22H', '23H', '24H', '26H', '28H', '31H', '30H'];

interface DieselNorms {
  fleetNumber: string;
  expectedKmPerLitre: number;
  tolerancePercentage: number;
  lastUpdated: string;
  updatedBy: string;
  isReeferUnit?: boolean;
  litresPerHour?: number; // For reefer units
}

interface DieselNormsModalProps {
  isOpen: boolean;
  onClose: () => void;
  norms: DieselNorms[];
  onUpdateNorms: (norms: DieselNorms[]) => void;
}

const DieselNormsModal: React.FC<DieselNormsModalProps> = ({
  isOpen,
  onClose,
  norms,
  onUpdateNorms
}) => {
  const [editedNorms, setEditedNorms] = useState<DieselNorms[]>(norms);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load norms from localStorage when modal opens
  useEffect(() => {
    const savedNorms = localStorage.getItem('dieselNorms');
    if (savedNorms) {
      try {
        const parsedNorms = JSON.parse(savedNorms);
        setEditedNorms(parsedNorms);
      } catch (error) {
        console.error("Error parsing saved diesel norms:", error);
        setEditedNorms(norms);
      }
    } else {
      setEditedNorms(norms);
    }
  }, [norms, isOpen]);

  const handleNormChange = (fleetNumber: string, field: 'expectedKmPerLitre' | 'tolerancePercentage' | 'litresPerHour', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setErrors(prev => {
        const key = `${fleetNumber}-${field}`;
        return { ...prev, [key]: 'Must be a positive number' };
      });
      return;
    }

    if (field === 'tolerancePercentage' && numValue > 50) {
      setErrors(prev => {
        const key = `${fleetNumber}-${field}`;
        return { ...prev, [key]: 'Tolerance cannot exceed 50%' };
      });
      return;
    }

    setErrors(prev => {
      const key = `${fleetNumber}-${field}`;
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });

    setEditedNorms(prev => prev.map(norm =>
      norm.fleetNumber === fleetNumber
        ? {
          ...norm,
          [field]: numValue,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'Current User'
        }
        : norm
    ));
  };

  const addNewFleetNorm = () => {
    const availableFleets = [...FLEET_NUMBERS, '4F', '5F', '6F', '7F', '8F'].filter(fleet =>
      !editedNorms.some(norm => norm.fleetNumber === fleet)
    );

    if (availableFleets.length === 0) {
      alert('All fleets already have norms configured.');
      return;
    }

    const selectedFleet = availableFleets[0];
    const isReeferUnit = ['4F', '5F', '6F', '7F', '8F'].includes(selectedFleet);
    const hasProbe = FLEETS_WITH_PROBES.includes(selectedFleet);

    const newNorm: DieselNorms = {
      fleetNumber: selectedFleet,
      expectedKmPerLitre: isReeferUnit ? 0 : 3.0, // Default value for trucks
      tolerancePercentage: isReeferUnit ? 15 : 10, // Higher tolerance for reefers
      lastUpdated: new Date().toISOString(),
      updatedBy: 'Current User',
      isReeferUnit,
      litresPerHour: isReeferUnit ? 3.5 : undefined // Default litres per hour for reefers
    };

    setEditedNorms(prev => [...prev, newNorm]);
  };

  const removeFleetNorm = (fleetNumber: string) => {
    if (confirm(`Remove efficiency norms for Fleet ${fleetNumber}?`)) {
      setEditedNorms(prev => prev.filter(norm => norm.fleetNumber !== fleetNumber));
    }
  };

  const handleSave = () => {
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (hasErrors) {
      alert('Please fix all errors before saving.');
      return;
    }

    // Save to localStorage for persistence
    localStorage.setItem('dieselNorms', JSON.stringify(editedNorms));
    
    onUpdateNorms(editedNorms);
    alert('Fleet efficiency norms updated successfully!\n\nNew tolerance ranges will be applied to all future diesel records.');
    onClose();
  };

  const resetToDefaults = () => {
    if (confirm('Reset all norms to default values? This will overwrite your current settings.')) {
      const defaultNorms = [
        // Truck norms
        ...FLEET_NUMBERS.map(fleet => ({
          fleetNumber: fleet,
          expectedKmPerLitre: fleet === 'UD' ? 2.8 : 3.2,
          tolerancePercentage: fleet === 'UD' ? 15 : 10,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'System Default',
          isReeferUnit: false
        })),
        // Reefer norms
        ...['4F', '5F', '6F', '7F', '8F'].map(fleet => ({
          fleetNumber: fleet,
          expectedKmPerLitre: 0, // Reefers don't use km/l
          tolerancePercentage: 15,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'System Default',
          isReeferUnit: true,
          litresPerHour: 3.5 // Default litres per hour
        }))
      ];
      setEditedNorms(defaultNorms);
      
      // Clear localStorage
      localStorage.removeItem('dieselNorms');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Fleet Efficiency Norms Configuration"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start space-x-3">
            <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Efficiency Norms & Tolerance Configuration</h4>
              <p className="text-sm text-blue-700 mt-1">
                Set expected KM/L performance and tolerance ranges for each fleet. Records outside tolerance will be automatically flagged for debrief.
                Changes will apply to all future diesel records and debrief calculations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex space-x-3">
            <Button
              size="sm"
              variant="outline"
              onClick={addNewFleetNorm}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Fleet Norm
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={resetToDefaults}
              icon={<History className="w-4 h-4" />}
            >
              Reset to Defaults
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            {editedNorms.length} fleet{editedNorms.length !== 1 ? 's' : ''} configured
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {editedNorms.map(norm => (
            <Card key={norm.fleetNumber} className="relative">
              <CardHeader
                title={`Fleet ${norm.fleetNumber} ${norm.isReeferUnit ? '(Reefer)' : FLEETS_WITH_PROBES.includes(norm.fleetNumber) ? '(Probe)' : ''}`}
                action={
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => removeFleetNorm(norm.fleetNumber)}
                    icon={<Trash2 className="w-3 h-3" />}
                    className="p-1"
                  />
                }
              />
              <CardContent className="space-y-4">
                {!norm.isReeferUnit ? (
                  <Input
                    label="Expected KM/L"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={norm.expectedKmPerLitre.toString()}
                    onChange={e => {
                      // Robustly handle both event and value
                      let value = '';
                      if (e && typeof e === 'object' && 'target' in e && e.target && typeof e.target.value === 'string') {
                        value = e.target.value;
                      } else if (typeof e === 'string') {
                        value = e;
                      }
                      handleNormChange(norm.fleetNumber, 'expectedKmPerLitre', value);
                    }}
                    error={errors[`${norm.fleetNumber}-expectedKmPerLitre`]}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="bg-purple-50 rounded-md p-3">
                      <p className="text-xs font-medium text-purple-700 mb-1">Reefer Unit:</p>
                      <p className="text-sm font-mono text-purple-900">
                        Measured in litres per hour instead of KM/L
                      </p>
                    </div>
                    <Input
                      label="Expected Litres/Hour"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={(norm.litresPerHour || 3.5).toString()}
                      onChange={e => {
                        // Robustly handle both event and value
                        let value = '';
                        if (e && typeof e === 'object' && 'target' in e && e.target && typeof e.target.value === 'string') {
                          value = e.target.value;
                        } else if (typeof e === 'string') {
                          value = e;
                        }
                        handleNormChange(norm.fleetNumber, 'litresPerHour', value);
                      }}
                      error={errors[`${norm.fleetNumber}-litresPerHour`]}
                    />
                  </div>
                )}
                <Input
                  label="Tolerance (%)"
                  type="number"
                  step="1"
                  min="1"
                  max="50"
                  value={norm.tolerancePercentage.toString()}
                  onChange={e => {
                    // Robustly handle both event and value
                    let value = '';
                    if (e && typeof e === 'object' && 'target' in e && e.target && typeof e.target.value === 'string') {
                      value = e.target.value;
                    } else if (typeof e === 'string') {
                      value = e;
                    }
                    handleNormChange(norm.fleetNumber, 'tolerancePercentage', value);
                  }}
                  error={errors[`${norm.fleetNumber}-tolerancePercentage`]}
                />
                {!norm.isReeferUnit && (
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Acceptable Range:</p>
                    <p className="text-sm font-mono text-gray-900">
                      {(norm.expectedKmPerLitre * (1 - norm.tolerancePercentage / 100)).toFixed(2)} - {(norm.expectedKmPerLitre * (1 + norm.tolerancePercentage / 100)).toFixed(2)} KM/L
                    </p>
                  </div>
                )}
                {norm.isReeferUnit && norm.litresPerHour && (
                  <div className="bg-purple-50 rounded-md p-3">
                    <p className="text-xs font-medium text-purple-700 mb-1">Acceptable Range:</p>
                    <p className="text-sm font-mono text-purple-900">
                      {(norm.litresPerHour * (1 - norm.tolerancePercentage / 100)).toFixed(2)} - {(norm.litresPerHour * (1 + norm.tolerancePercentage / 100)).toFixed(2)} L/hr
                    </p>
                  </div>
                )}
                <div className="text-xs text-gray-500 border-t pt-2">
                  <p>Updated: {new Date(norm.lastUpdated).toLocaleDateString()}</p>
                  <p>By: {norm.updatedBy}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">Configuration Impact</h4>
              <div className="text-sm text-amber-700 mt-1 space-y-1">
                <p>• Changes will affect all future diesel record evaluations</p>
                <p>• Existing records will be re-evaluated with new tolerance ranges</p>
                <p>• Debrief requirements will be updated automatically</p>
                <p>• Performance classifications may change for existing records</p>
                <p>• Settings will be saved and persist between sessions</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} icon={<X className="w-4 h-4" />}>Cancel</Button>
          <Button onClick={handleSave} icon={<Save className="w-4 h-4" />}>Save Norms Configuration</Button>
        </div>
      </div>
    </Modal>
  );
};

export default DieselNormsModal;