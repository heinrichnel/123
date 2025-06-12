import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useAppContext } from '../../context/AppContext';
import { Input, TextArea } from '../ui/FormElements';
import { 
  Save, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Fuel,
  FileText,
  Upload
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';

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
  
  const [formData, setFormData] = useState({
    probeReading: '',
    verificationNotes: '',
    actionTaken: '',
    verifiedBy: 'Current User'
  });
  
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Get the diesel record
  const dieselRecord = dieselRecords.find(r => r.id === dieselRecordId);
  
  // Initialize form data when record changes
  useEffect(() => {
    if (dieselRecord) {
      setFormData({
        probeReading: dieselRecord.probeReading?.toString() || '',
        verificationNotes: dieselRecord.probeVerificationNotes || '',
        actionTaken: '',
        verifiedBy: 'Current User'
      });
    }
  }, [dieselRecord]);
  
  if (!dieselRecord) return null;
  
  // Calculate discrepancy
  const calculateDiscrepancy = () => {
    if (!formData.probeReading) return null;
    
    const probeReading = parseFloat(formData.probeReading);
    return dieselRecord.litresFilled - probeReading;
  };
  
  const discrepancy = calculateDiscrepancy();
  const hasLargeDiscrepancy = discrepancy !== null && Math.abs(discrepancy) > 50;
  
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.probeReading) {
      newErrors.probeReading = 'Probe reading is required';
    } else if (isNaN(parseFloat(formData.probeReading)) || parseFloat(formData.probeReading) < 0) {
      newErrors.probeReading = 'Must be a valid positive number';
    }
    
    if (hasLargeDiscrepancy && !formData.verificationNotes) {
      newErrors.verificationNotes = 'Verification notes are required for large discrepancies';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const probeReading = parseFloat(formData.probeReading);
    const probeDiscrepancy = dieselRecord.litresFilled - probeReading;
    
    // Create attachments for any uploaded files
    const attachments = selectedFiles ? Array.from(selectedFiles).map((file, index) => ({
      id: `A${Date.now()}-${index}`,
      filename: file.name,
      fileUrl: URL.createObjectURL(file),
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString()
    })) : [];
    
    // Update the diesel record
    updateDieselRecord({
      ...dieselRecord,
      probeReading,
      probeDiscrepancy,
      probeVerified: true,
      probeVerificationNotes: formData.verificationNotes,
      probeVerifiedBy: formData.verifiedBy,
      probeVerifiedAt: new Date().toISOString(),
      probeActionTaken: formData.actionTaken || undefined,
      probeAttachments: [...(dieselRecord.probeAttachments || []), ...attachments]
    });
    
    // Show success message
    alert(`Probe verification completed successfully.\n\nProbe Reading: ${probeReading}L\nFilled Amount: ${dieselRecord.litresFilled}L\nDiscrepancy: ${Math.abs(probeDiscrepancy).toFixed(1)}L${hasLargeDiscrepancy ? ' (SIGNIFICANT)' : ''}`);
    
    onClose();
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Probe Verification"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Record Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Diesel Record Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <p><strong>Fleet:</strong> {dieselRecord.fleetNumber}</p>
              <p><strong>Driver:</strong> {dieselRecord.driverName}</p>
              <p><strong>Date:</strong> {formatDate(dieselRecord.date)}</p>
            </div>
            <div>
              <p><strong>Litres Filled:</strong> {dieselRecord.litresFilled}</p>
              <p><strong>Cost:</strong> {formatCurrency(dieselRecord.totalCost, dieselRecord.currency || 'ZAR')}</p>
              <p><strong>Station:</strong> {dieselRecord.fuelStation}</p>
            </div>
          </div>
        </div>
        
        {/* Verification Form */}
        <div className="space-y-4">
          <Input
            label="Probe Reading (Litres) *"
            type="number"
            step="0.1"
            min="0"
            value={formData.probeReading}
            onChange={(e) => handleChange('probeReading', e.target.value)}
            placeholder="Enter actual probe reading in litres"
            error={errors.probeReading}
          />
          
          {/* Discrepancy Display */}
          {discrepancy !== null && (
            <div className={`p-4 rounded-md ${
              hasLargeDiscrepancy ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
            }`}>
              <div className="flex items-start space-x-3">
                {hasLargeDiscrepancy ? (
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-800">Verification Result</h4>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <p className="text-xs text-gray-500">Filled Amount</p>
                      <p className="font-medium">{dieselRecord.litresFilled}L</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Probe Reading</p>
                      <p className="font-medium">{parseFloat(formData.probeReading).toFixed(1)}L</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Discrepancy</p>
                      <p className={`font-medium ${hasLargeDiscrepancy ? 'text-red-600' : 'text-green-600'}`}>
                        {Math.abs(discrepancy).toFixed(1)}L {discrepancy > 0 ? '(over)' : '(under)'}
                      </p>
                    </div>
                  </div>
                  
                  {hasLargeDiscrepancy && (
                    <div className="mt-3 text-sm text-red-700">
                      <p className="font-medium">SIGNIFICANT DISCREPANCY DETECTED</p>
                      <p>This discrepancy exceeds the 50L threshold and requires investigation.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <TextArea
            label={`Verification Notes ${hasLargeDiscrepancy ? '*' : '(Optional)'}`}
            value={formData.verificationNotes}
            onChange={(e) => handleChange('verificationNotes', e.target.value)}
            placeholder={hasLargeDiscrepancy ? 
              "Explain the reason for the large discrepancy (e.g., 'Probe malfunction', 'Suspected fuel theft', 'Calibration issue')" : 
              "Add any notes about the verification process (optional)"}
            rows={3}
            error={errors.verificationNotes}
          />
          
          <TextArea
            label="Action Taken (Optional)"
            value={formData.actionTaken}
            onChange={(e) => handleChange('actionTaken', e.target.value)}
            placeholder="Describe any actions taken to address discrepancies (e.g., 'Recalibrated probe', 'Reported to management', 'Scheduled maintenance')"
            rows={2}
          />
          
          {/* Supporting Documents */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supporting Documents (Optional)
            </label>
            <input
              type="file"
              multiple
              onChange={(e) => setSelectedFiles(e.target.files)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                file:rounded-md file:border-0 file:text-sm file:font-medium 
                file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100
                file:cursor-pointer cursor-pointer"
            />
            {selectedFiles && selectedFiles.length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                <p className="font-medium text-blue-800">
                  Selected {selectedFiles.length} file(s)
                </p>
                <ul className="mt-1 text-xs text-blue-700">
                  {Array.from(selectedFiles).map((file, index) => (
                    <li key={index} className="flex items-center">
                      <FileText className="w-3 h-3 mr-1" />
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Existing Attachments */}
          {dieselRecord.probeAttachments && dieselRecord.probeAttachments.length > 0 && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Attachments</h4>
              <div className="space-y-2">
                {dieselRecord.probeAttachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Upload className="w-3 h-3 mr-2 text-gray-500" />
                      <span>{attachment.filename}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(attachment.fileUrl, '_blank')}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Verification Guidelines */}
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-800 mb-2">Verification Guidelines</h4>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>Compare the filled amount with the probe reading</li>
            <li>Discrepancies greater than 50L require investigation</li>
            <li>Document any findings and actions taken</li>
            <li>Attach supporting evidence when available</li>
            <li>Report suspected theft or fraud to management immediately</li>
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
            onClick={handleSubmit}
            icon={<CheckCircle className="w-4 h-4" />}
          >
            Complete Verification
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProbeVerificationModal;