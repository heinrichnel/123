import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card, { CardContent, CardHeader } from '../ui/Card';
import { Input } from '../ui/FormElements';
import { 
  Save, 
  X, 
  Settings, 
  AlertTriangle, 
  Plus, 
  Trash2,
  History
} from 'lucide-react';
import { FLEET_NUMBERS } from '../../types';

interface DieselNorms {
  fleetNumber: string;
  expectedKmPerLitre: number;
  tolerancePercentage: number;
  lastUpdated: string;
  updatedBy: string;
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

  const handleNormChange = (fleetNumber: string, field: 'expectedKmPerLitre' | 'tolerancePercentage', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
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
    const availableFleets = FLEET_NUMBERS.filter(fleet => 
      !editedNorms.some(norm => norm.fleetNumber === fleet)
    );
    
    if (availableFleets.length === 0) {
      alert('All fleets already have norms configured.');
      return;
    }

    const newNorm: DieselNorms = {
      fleetNumber: availableFleets[0],
      expectedKmPerLitre: 3.0,
      tolerancePercentage: 10,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'Current User'
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

    onUpdateNorms(editedNorms);
    alert('Fleet efficiency norms updated successfully!\n\nNew tolerance ranges will be applied to all future diesel records.');
    onClose();
  };

  const resetToDefaults = () => {
    if (confirm('Reset all norms to default values? This will overwrite your current settings.')) {
      const defaultNorms = FLEET_NUMBERS.map(fleet => ({
        fleetNumber: fleet,
        expectedKmPerLitre: fleet === 'UD' ? 2.8 : 3.2,
        tolerancePercentage: fleet === 'UD' ? 15 : 10,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'System Default'
      }));
      setEditedNorms(defaultNorms);
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
        {/* Header Info */}
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

        {/* Action Buttons */}
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

        {/* Norms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {editedNorms.map((norm) => (
            <Card key={norm.fleetNumber} className="relative">
              <CardHeader 
                title={`Fleet ${norm.fleetNumber}`}
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
                <div>
                  <Input
                    label="Expected KM/L"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={norm.expectedKmPerLitre.toString()}
                    onChange={(e) => handleNormChange(norm.fleetNumber, 'expectedKmPerLitre', e.target.value)}
                    error={errors[`${norm.fleetNumber}-expectedKmPerLitre`]}
                  />
                </div>
                
                <div>
                  <Input
                    label="Tolerance (%)"
                    type="number"
                    step="1"
                    min="1"
                    max="50"
                    value={norm.tolerancePercentage.toString()}
                    onChange={(e) => handleNormChange(norm.fleetNumber, 'tolerancePercentage', e.target.value)}
                    error={errors[`${norm.fleetNumber}-tolerancePercentage`]}
                  />
                </div>

                {/* Tolerance Range Display */}
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Acceptable Range:</p>
                  <p className="text-sm font-mono text-gray-900">
                    {(norm.expectedKmPerLitre * (1 - norm.tolerancePercentage/100)).toFixed(2)} - {(norm.expectedKmPerLitre * (1 + norm.tolerancePercentage/100)).toFixed(2)} KM/L
                  </p>
                </div>

                {/* Last Updated Info */}
                <div className="text-xs text-gray-500 border-t pt-2">
                  <p>Updated: {new Date(norm.lastUpdated).toLocaleDateString()}</p>
                  <p>By: {norm.updatedBy}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Impact Warning */}
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
              </div>
            </div>
          </div>
        </div>

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
            onClick={handleSave}
            icon={<Save className="w-4 h-4" />}
          >
            Save Norms Configuration
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DieselNormsModal;