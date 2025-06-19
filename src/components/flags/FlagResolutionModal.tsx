// ─── React ───────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';

// ─── Types ───────────────────────────────────────────────────────
import { CostEntry } from '../../types';

// ─── UI Components ───────────────────────────────────────────────
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select, TextArea } from '../ui/FormElements';
import FileUpload from '../ui/FileUpload';

// ─── Icons ───────────────────────────────────────────────────────
import {
  Save,
  X,
  Upload,
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';

// ─── Utilities ───────────────────────────────────────────────────
import { formatCurrency, formatDate } from '../../utils/helpers';


interface FlagResolutionModalProps {
  isOpen: boolean;
  cost: CostEntry | null;
  onClose: () => void;
  onResolve: (updatedCost: CostEntry, resolutionComment: string) => void;
}

const FlagResolutionModal: React.FC<FlagResolutionModalProps> = ({
  isOpen,
  cost,
  onClose,
  onResolve
}) => {
  const [formData, setFormData] = useState({
    amount: '',
    notes: '',
    resolutionComment: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cost) {
      setFormData({
        amount: cost.amount.toString(),
        notes: cost.notes || '',
        resolutionComment: ''
      });
      setSelectedFiles(null);
      setErrors({});
    }
  }, [cost]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || isNaN(Number(formData.amount))) {
      newErrors.amount = 'Amount must be a valid number';
    }
    if (Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.resolutionComment.trim()) {
      newErrors.resolutionComment = 'Resolution comment is required for audit purposes';
    }

    // IMPORTANT: We're removing this restriction to allow resolving flags without changes
    // This addresses the issue where flags couldn't be resolved
    /*
    // Check for any change to allow resolving
    const hasAmountChange = cost && Number(formData.amount) !== cost.amount;
    const hasNotesChange = cost && formData.notes !== (cost.notes || '');
    const hasFileUpload = selectedFiles && selectedFiles.length > 0;

    if (!hasAmountChange && !hasNotesChange && !hasFileUpload) {
      newErrors.general = 'Please make at least one change (amount, notes, or upload document) to resolve this flag.';
    }
    */

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResolve = async () => {
    if (!cost || !validateForm()) return;
    
    try {
      setIsSubmitting(true);

      const newAttachments = selectedFiles
        ? Array.from(selectedFiles).map((file, index) => ({
            id: `A${Date.now()}-${index}`,
            costEntryId: cost.id,
            filename: file.name,
            fileUrl: URL.createObjectURL(file), // TODO: Replace with actual upload URL
            fileType: file.type,
            fileSize: file.size,
            uploadedAt: new Date().toISOString()
          }))
        : [];

      const updatedCost: CostEntry = {
        ...cost,
        amount: Number(formData.amount),
        notes: formData.notes,
        attachments: [...cost.attachments, ...newAttachments],
        investigationStatus: 'resolved',
        investigationNotes: cost.investigationNotes
          ? `${cost.investigationNotes}\n\nResolution: ${formData.resolutionComment}`
          : `Resolution: ${formData.resolutionComment}`,
        resolvedAt: new Date().toISOString(),
        resolvedBy: 'Current User' // Replace with actual user context
      };

      onResolve(updatedCost, formData.resolutionComment);
    } catch (error) {
      console.error('Error resolving flag:', error);
      alert(`Error resolving flag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ amount: '', notes: '', resolutionComment: '' });
    setSelectedFiles(null);
    setErrors({});
    onClose();
  };

  if (!cost) return null;

  const hasAmountChange = Number(formData.amount) !== cost.amount;
  const hasNotesChange = formData.notes !== (cost.notes || '');
  const hasFileUpload = selectedFiles && selectedFiles.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Resolve Flagged Cost Entry" maxWidth="lg">
      <div className="space-y-6">
        {/* Flagged Cost Summary */}
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-800">Flagged Cost Entry</h4>
              <div className="text-sm text-amber-700 mt-2 space-y-1">
                <p>
                  <strong>Category:</strong> {cost.category} - {cost.subCategory}
                </p>
                <p>
                  <strong>Original Amount:</strong> {formatCurrency(cost.amount, cost.currency)}
                </p>
                <p>
                  <strong>Date:</strong> {formatDate(cost.date)}
                </p>
                <p>
                  <strong>Reference:</strong> {cost.referenceNumber}
                </p>
                {cost.flagReason && <p><strong>Flag Reason:</strong> {cost.flagReason}</p>}
                {cost.noDocumentReason && <p><strong>Missing Document Reason:</strong> {cost.noDocumentReason}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Current Attachments */}
        {cost.attachments.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-800 mb-2">Current Attachments</h4>
            <div className="space-y-2">
              {cost.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center space-x-2 text-sm">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{attachment.filename}</span>
                  <span className="text-gray-500">
                    ({attachment.fileSize ? `${(attachment.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolution Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Resolution Actions</h3>

          {/* Amount Correction */}
          <div>
            <Input
              label={`Corrected Amount (${cost.currency})`}
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(value) => handleChange('amount', value)}
              error={errors.amount}
            />
            {hasAmountChange && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                <p className="text-blue-800">
                  <strong>Amount Change:</strong> {formatCurrency(cost.amount, cost.currency)} →{' '}
                  {formatCurrency(Number(formData.amount) || 0, cost.currency)}
                  <span className="ml-2">
                    {(Number(formData.amount) || 0) > cost.amount ? '+' : ''}
                    {formatCurrency((Number(formData.amount) || 0) - cost.amount, cost.currency)}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Notes Update */}
          <div>
            <TextArea
              label="Updated Notes"
              value={formData.notes}
              onChange={(value) => handleChange('notes', value)}
              placeholder="Add or update notes for this cost entry..."
              rows={3}
            />
            {hasNotesChange && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                <p className="text-green-800">✓ Notes will be updated</p>
              </div>
            )}
          </div>

          {/* Document Upload */}
          <div>
            <FileUpload
              label="Upload Missing Documents"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              multiple
              onFileSelect={setSelectedFiles}
            />
            {hasFileUpload && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                <p className="text-green-800 font-medium mb-1">
                  ✓ {selectedFiles!.length} file(s) will be uploaded:
                </p>
                <ul className="text-green-700 space-y-1">
                  {Array.from(selectedFiles!).map((file, index) => (
                    <li key={index} className="flex items-center">
                      <Upload className="w-3 h-3 mr-2" />
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Resolution Comment */}
          <div>
            <TextArea
              label="Resolution Comment (Required) *"
              value={formData.resolutionComment}
              onChange={(value) => handleChange('resolutionComment', value)}
              placeholder="Explain what was corrected and why..."
              rows={3}
              error={errors.resolutionComment}
            />
            <p className="text-xs text-gray-500 mt-1">
              This comment will be logged for audit purposes and included in reports.
            </p>
          </div>
        </div>

        {/* Resolution Summary */}
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-green-800 mb-2">Resolution Summary</h4>
          <div className="text-sm text-green-700 space-y-1">
            {hasAmountChange && (
              <p>• Amount will be corrected from {formatCurrency(cost.amount, cost.currency)} to {formatCurrency(Number(formData.amount) || 0, cost.currency)}</p>
            )}
            {hasNotesChange && <p>• Notes will be updated</p>}
            {hasFileUpload && <p>• {selectedFiles!.length} document(s) will be uploaded</p>}
            <p>• Flag status will be marked as "Resolved"</p>
            <p>• Resolution will be logged with timestamp and user</p>
          </div>
        </div>

        {errors.general && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {errors.general}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            icon={<X className="w-4 h-4" />}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResolve}
            disabled={!formData.resolutionComment.trim() || isSubmitting}
            icon={<CheckCircle className="w-4 h-4" />}
            isLoading={isSubmitting}
          >
            Resolve Flag
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default FlagResolutionModal;