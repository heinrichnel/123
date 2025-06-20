import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, TextArea } from '../ui/FormElements';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { CheckCircle, X, Save, AlertTriangle } from 'lucide-react';
import { FLEETS_WITH_PROBES } from '../../types';

interface ProbeVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  dieselRecordId: string;
}

const ProbeVerificationModal: React.FC<ProbeVerificationModalProps> = ({
  isOpen,
  onClose,
  dieselRecordId
}) => {
  const { dieselRecords, updateDieselRecord } = useAppContext();
  const [probeReading, setProbeReading] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Find the diesel record
  const record = dieselRecords.find(r => r.id === dieselRecordId);

  // Reset form when modal opens with new record
  useEffect(() => {
    if (record) {
      setProbeReading(record.probeReading?.toString() || '');
      setVerificationNotes('');
      setErrors({});
    }
  }, [record, isOpen]);

  if (!record) return null;

  // Check if this fleet has a probe
  const hasProbe = FLEETS_WITH_PROBES.includes(record.fleetNumber);
  if (!hasProbe) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Probe Verification"
        maxWidth="md"
      >
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">No Probe Available</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Fleet {record.fleetNumber} does not have a probe installed. Probe verification is not available for this vehicle.
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </Modal>
    );
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!probeReading.trim()) {
      newErrors.probeReading = 'Probe reading is required';
    } else if (isNaN(Number(probeReading)) || Number(probeReading) < 0) {
      newErrors.probeReading = 'Probe reading must be a valid positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      const probeReadingValue = Number(probeReading);
      const probeDiscrepancy = record.litresFilled - probeReadingValue;
      
      // Update the diesel record
      await updateDieselRecord({
        ...record,
        probeReading: probeReadingValue,
        probeDiscrepancy,
        probeVerified: true,
        probeVerificationNotes: verificationNotes.trim() || undefined,
        probeVerifiedAt: new Date().toISOString(),
        probeVerifiedBy: 'Current User', // In a real app, use the logged-in user
        updatedAt: new Date().toISOString()
      });
      
      onClose();
      alert('Probe verification completed successfully');
    } catch (error) {
      console.error('Error verifying probe:', error);
      alert(`Error verifying probe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate discrepancy
  const discrepancy = probeReading ? record.litresFilled - Number(probeReading) : undefined;
  const hasLargeDiscrepancy = discrepancy !== undefined && Math.abs(discrepancy) > 50;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verify Probe Reading"
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Record Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Diesel Record Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <p><strong>Fleet:</strong> {record.fleetNumber}</p>
              <p><strong>Driver:</strong> {record.driverName}</p>
              <p><strong>Date:</strong> {formatDate(record.date)}</p>
            </div>
            <div>
              <p><strong>Litres Filled:</strong> {record.litresFilled}</p>
              <p><strong>Cost:</strong> {formatCurrency(record.totalCost, record.currency || 'ZAR')}</p>
              <p><strong>Station:</strong> {record.fuelStation}</p>
            </div>
          </div>
        </div>

        {/* Probe Verification Form */}
        <div className="space-y-4">
          <Input
            label="Probe Reading (Litres) *"
            type="number"
            step="0.1"
            min="0"
            value={probeReading}
            onChange={(value) => setProbeReading(value)}
            placeholder="Enter actual probe reading..."
            error={errors.probeReading}
          />

          {discrepancy !== undefined && (
            <div className={`p-3 rounded-md ${
              hasLargeDiscrepancy ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
            }`}>
              <div className="flex items-start space-x-3">
                {hasLargeDiscrepancy ? (
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                )}
                <div>
                  <h4 className={`text-sm font-medium ${hasLargeDiscrepancy ? 'text-red-800' : 'text-green-800'}`}>
                    {hasLargeDiscrepancy ? 'Large Discrepancy Detected' : 'Discrepancy Analysis'}
                  </h4>
                  <p className={`text-sm ${hasLargeDiscrepancy ? 'text-red-700' : 'text-green-700'} mt-1`}>
                    <strong>Filled Amount:</strong> {record.litresFilled} litres
                  </p>
                  <p className={`text-sm ${hasLargeDiscrepancy ? 'text-red-700' : 'text-green-700'}`}>
                    <strong>Probe Reading:</strong> {probeReading} litres
                  </p>
                  <p className={`text-sm font-medium ${hasLargeDiscrepancy ? 'text-red-700' : 'text-green-700'}`}>
                    <strong>Discrepancy:</strong> {discrepancy > 0 ? '+' : ''}{discrepancy.toFixed(1)} litres 
                    ({Math.abs(discrepancy / record.litresFilled * 100).toFixed(1)}%)
                  </p>
                  {hasLargeDiscrepancy && (
                    <p className="text-sm text-red-700 mt-1">
                      This discrepancy exceeds the 50 litre threshold and requires investigation.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <TextArea
            label="Verification Notes"
            value={verificationNotes}
            onChange={(value) => setVerificationNotes(value)}
            placeholder="Add any notes about the probe verification process or discrepancies..."
            rows={3}
          />
        </div>

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
            icon={<Save className="w-4 h-4" />}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            Verify Probe Reading
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProbeVerificationModal;