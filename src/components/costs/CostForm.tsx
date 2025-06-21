// ─── React ───────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';

// ─── Types ───────────────────────────────────────────────────────
import { CostEntry, COST_CATEGORIES } from '../../types/index';

// ─── Components ───────────────────────────────────────────────────────
import Button from '../ui/Button';
import { Input, Select, TextArea } from '../ui/FormElements';
import FileUpload from '../ui/FileUpload';
// ─── Icons ───────────────────────────────────────────────────────
import {
  AlertTriangle,
  Flag,
  Save,
  Upload,
  X
} from 'lucide-react';


interface CostFormProps {
  tripId: string;
  cost?: CostEntry;
  onSubmit: (costData: Omit<CostEntry, 'id' | 'attachments'>, files?: FileList) => void;
  onCancel: () => void;
}

const CostForm: React.FC<CostFormProps> = ({ tripId, cost, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<{
    category: string;
    subCategory: string;
    amount: string;
    currency: 'USD' | 'ZAR';
    referenceNumber: string;
    date: string;
    notes: string;
    isFlagged: boolean;
    flagReason: string;
    noDocumentReason: string;
  }>({
    category: '',
    subCategory: '',
    amount: '',
    currency: 'ZAR',
    referenceNumber: '',
    date: '',
    notes: '',
    isFlagged: false,
    flagReason: '',
    noDocumentReason: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [availableSubCategories, setAvailableSubCategories] = useState<string[]>([]);

  // Move these to top-level so they are available everywhere
  const hasFiles = selectedFiles && selectedFiles.length > 0;
  const hasExistingAttachments = cost && cost.attachments && cost.attachments.length > 0;
  const hasDocumentation = hasFiles || hasExistingAttachments;
  const isHighRiskCategory = ['Non-Value-Added Costs', 'Border Costs'].includes(formData.category);

  useEffect(() => {
    if (cost) {
      setFormData({
        category: cost.category,
        subCategory: cost.subCategory,
        amount: cost.amount.toString(),
        currency: cost.currency,
        referenceNumber: cost.referenceNumber,
        date: cost.date,
        notes: cost.notes || '',
        isFlagged: cost.isFlagged,
        flagReason: cost.flagReason || '',
        noDocumentReason: cost.noDocumentReason || ''
      });
      if (cost.category && (COST_CATEGORIES as Record<string, string[]>)[cost.category]) {
        setAvailableSubCategories((COST_CATEGORIES as Record<string, string[]>)[cost.category]);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        date: new Date().toISOString().split('T')[0]
      }));
    }
  }, [cost]);

  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'category' && typeof value === 'string') {
      const subCategories = (COST_CATEGORIES as Record<string, string[]>)[value] || [];
      setAvailableSubCategories(subCategories);
      setFormData(prev => ({ ...prev, subCategory: '' }));
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.category) newErrors.category = 'Cost category is required';
    if (!formData.subCategory) newErrors.subCategory = 'Sub-cost type is required';
    if (!formData.amount) newErrors.amount = 'Amount is required';
    if (formData.amount && isNaN(Number(formData.amount))) {
      newErrors.amount = 'Amount must be a valid number';
    }
    if (formData.amount && Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.currency) newErrors.currency = 'Currency is required';
    if (!formData.referenceNumber) newErrors.referenceNumber = 'Reference number is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (formData.category === 'System Costs') {
      newErrors.category = 'System costs are automatically generated and cannot be manually added';
    }
    const hasFiles = selectedFiles && selectedFiles.length > 0;
    const hasExistingAttachments = cost && cost.attachments && cost.attachments.length > 0;
    const hasNoDocumentReason = String(formData.noDocumentReason ?? '').trim().length > 0;
    if (!cost && !hasFiles && !hasNoDocumentReason) {
      newErrors.documents = 'Either attach a receipt/document OR provide a reason for missing documentation';
    }
    if (formData.isFlagged && !String(formData.flagReason ?? '').trim()) {
      newErrors.flagReason = 'Flag reason is required when manually flagging a cost entry';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    // Use already declared variables
    const highRiskCategories = ['Non-Value-Added Costs', 'Border Costs'];
    const isHighRisk = highRiskCategories.includes(formData.category);
    const missingDocumentation = !hasDocumentation && formData.noDocumentReason.trim();
    const shouldFlag = formData.isFlagged || isHighRisk || missingDocumentation;
    let flagReason = '';
    if (formData.isFlagged && String(formData.flagReason ?? '').trim()) {
      flagReason = String(formData.flagReason ?? '').trim();
    } else if (isHighRisk) {
      flagReason = `High-risk category: ${formData.category} - ${formData.subCategory} requires review`;
    } else if (missingDocumentation) {
      flagReason = `Missing documentation: ${String(formData.noDocumentReason ?? '').trim()}`;
    }
    const costData: Omit<CostEntry, 'id' | 'attachments'> = {
      tripId,
      category: formData.category,
      subCategory: formData.subCategory,
      amount: Number(formData.amount),
      currency: formData.currency,
      referenceNumber: String(formData.referenceNumber ?? '').trim(),
      date: formData.date,
      notes: String(formData.notes ?? '').trim() || undefined,
      isFlagged: Boolean(shouldFlag),
      flagReason: flagReason || undefined,
      noDocumentReason: String(formData.noDocumentReason ?? '').trim() || undefined,
      investigationStatus: shouldFlag ? 'pending' : undefined,
      flaggedAt: shouldFlag ? new Date().toISOString() : undefined,
      flaggedBy: shouldFlag ? 'Current User' : undefined,
      isSystemGenerated: false,
      // createdAt and updatedAt are not part of Omit<CostEntry, 'id' | 'attachments'>
    };
    onSubmit(costData, selectedFiles || undefined);
  };

  const getCurrencySymbol = (currency: 'USD' | 'ZAR'): string => {
    return currency === 'USD' ? '$' : 'R';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* High-Risk Category Warning */}
      {isHighRiskCategory && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">High-Risk Category</h4>
              <p className="text-sm text-amber-700 mt-1">
                {formData.category} costs are automatically flagged for investigation due to their risk profile. 
                Ensure all documentation is complete and accurate.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Structured Cost Category Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cost Category *</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
          >
            <option value="">Select cost category</option>
            {Object.keys(COST_CATEGORIES).filter(cat => cat !== 'System Costs').map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Cost Type *</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            value={formData.subCategory}
            onChange={(e) => handleChange('subCategory', e.target.value)}
            disabled={!formData.category}
          >
            <option value="">
              {formData.category ? 'Select sub-cost type' : 'Select category first'}
            </option>
            {availableSubCategories.map((subCategory) => (
              <option key={subCategory} value={subCategory}>
                {subCategory}
              </option>
            ))}
          </select>
          {errors.subCategory && <p className="text-sm text-red-600 mt-1">{errors.subCategory}</p>}
          {formData.category && availableSubCategories.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">No sub-categories available for this category</p>
          )}
        </div>

        <Select
          label="Currency *"
          value={formData.currency}
          onChange={(value) => handleChange('currency', value)}
          options={[
            { label: 'ZAR (R)', value: 'ZAR' },
            { label: 'USD ($)', value: 'USD' }
          ]}
          error={errors.currency}
        />

        <Input
          label={`Amount (${getCurrencySymbol(formData.currency)}) *`}
          type="number"
          step="0.01"
          min="0.01"
          value={formData.amount}
          onChange={(value) => handleChange('amount', value)}
          placeholder="0.00"
          error={errors.amount}
        />

        <Input
          label="Reference Number *"
          value={formData.referenceNumber}
          onChange={(value) => handleChange('referenceNumber', value)}
          placeholder="e.g., INV-123456, RECEIPT-001"
          error={errors.referenceNumber}
        />

        <Input
          label="Date *"
          type="date"
          value={formData.date}
          onChange={(value) => handleChange('date', value)}
          error={errors.date}
        />
      </div>

      <TextArea
        label="Notes (Optional)"
        value={formData.notes || ''}
        onChange={(value) => handleChange('notes', value)}
        placeholder="Additional notes about this cost entry..."
        rows={3}
      />

      {/* MANDATORY DOCUMENT ATTACHMENT SECTION */}
      <div className="space-y-4 border-t pt-6">
        <div className="flex items-center space-x-2">
          <Upload className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Document Attachment (Required)</h3>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Documentation Requirement</h4>
              <p className="text-sm text-blue-700 mt-1">
                Every cost entry must include either a receipt/document upload OR a valid explanation for missing documentation. 
                Items without proper documentation will be automatically flagged for investigation.
              </p>
            </div>
          </div>
        </div>

        <FileUpload
          label="Attach Receipt/Document"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          multiple
          onFileSelect={setSelectedFiles}
        />

        {hasFiles && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm font-medium text-green-800 mb-2">
              Selected Files ({selectedFiles!.length}):
            </p>
            <ul className="text-sm text-green-700 space-y-1">
              {Array.from(selectedFiles!).map((file, index) => (
                <li key={index} className="flex items-center">
                  <Upload className="w-3 h-3 mr-2" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasExistingAttachments && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <p className="text-sm font-medium text-gray-800 mb-2">
              Existing Attachments ({cost!.attachments.length}):
            </p>
            <ul className="text-sm text-gray-700 space-y-1">
              {cost!.attachments.map((attachment) => (
                <li key={attachment.id} className="flex items-center">
                  <Upload className="w-3 h-3 mr-2" />
                  {attachment.filename}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* No Document Reason - Required if no files */}
        {!hasDocumentation && (
          <div className="space-y-2">
            <TextArea
              label="Reason for Missing Documentation *"
              value={formData.noDocumentReason}
              onChange={(value) => handleChange('noDocumentReason', value)}
              placeholder="Explain why no receipt/document is available (e.g., 'Receipt lost during trip', 'Digital payment - no physical receipt', 'Emergency expense - receipt not provided')..."
              rows={3}
            />
            <p className="text-xs text-amber-600">
              ⚠️ This entry will be automatically flagged for investigation due to missing documentation.
            </p>
          </div>
        )}

        {errors.documents && <p className="text-sm text-red-600">{errors.documents}</p>}
      </div>

      {/* Manual Flag Section */}
      <div className="space-y-4 border-t pt-6">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="manualFlag"
            checked={formData.isFlagged}
            onChange={(e) => handleChange('isFlagged', e.target.checked)}
            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          <label htmlFor="manualFlag" className="flex items-center text-sm font-medium text-gray-700">
            <Flag className="w-4 h-4 mr-2 text-red-500" />
            Manually flag this cost entry for investigation
          </label>
        </div>

        {formData.isFlagged && (
          <div className="ml-7">
            <TextArea
              label="Flag Reason *"
              value={formData.flagReason}
              onChange={(value) => handleChange('flagReason', value)}
              placeholder="Explain why this cost is being flagged (e.g., 'Amount seems excessive', 'Unusual expense for this route', 'Requires management approval')..."
              rows={2}
              error={errors.flagReason}
            />
          </div>
        )}

        <div className="text-xs text-gray-500 ml-7">
          Use manual flagging for suspicious amounts, unusual expenses, or items requiring special attention.
          {isHighRiskCategory && (
            <span className="block text-amber-600 font-medium mt-1">
              Note: This category will be automatically flagged regardless of manual selection.
            </span>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          icon={<X className="w-4 h-4" />}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          icon={<Save className="w-4 h-4" />}
        >
          {cost ? 'Update Cost Entry' : 'Add Cost Entry'}
        </Button>
      </div>
    </form>
  );
};

export default CostForm;