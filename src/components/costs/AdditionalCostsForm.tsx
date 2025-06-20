// ─── React & State ───────────────────────────────────────────────
import React, { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────
import { AdditionalCost, ADDITIONAL_COST_TYPES } from '../../types/index';

// ─── UI Components ───────────────────────────────────────────────
import Button from '../ui/Button';
import Card, { CardContent, CardHeader } from '../ui/Card';
import { Input, Select, TextArea } from '../ui/FormElements';

// ─── Icons ───────────────────────────────────────────────────────
import { DollarSign, Plus, Upload, X } from 'lucide-react';

// ─── Utilities ───────────────────────────────────────────────────
import { formatCurrency } from '../../utils/helpers';


interface AdditionalCostsFormProps {
  tripId: string;
  additionalCosts: AdditionalCost[];
  onAddCost: (cost: Omit<AdditionalCost, 'id'>, files?: FileList) => void;
  onRemoveCost: (costId: string) => void;
  readOnly?: boolean;
}

const AdditionalCostsForm: React.FC<AdditionalCostsFormProps> = ({
  tripId,
  additionalCosts,
  onAddCost,
  onRemoveCost,
  readOnly = false
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    costType: '',
    amount: '',
    currency: 'ZAR' as 'USD' | 'ZAR',
    notes: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.costType) newErrors.costType = 'Cost type is required';
    if (!formData.amount) newErrors.amount = 'Amount is required';
    if (formData.amount && isNaN(Number(formData.amount))) {
      newErrors.amount = 'Amount must be a valid number';
    }
    if (Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const costData: Omit<AdditionalCost, 'id'> = {
      tripId,
      costType: formData.costType as any,
      amount: Number(formData.amount),
      currency: formData.currency,
      supportingDocuments: [], // Will be populated by the parent component
      notes: formData.notes,
      addedAt: new Date().toISOString(),
      addedBy: 'Current User'
    };

    onAddCost(costData, selectedFiles || undefined);

    // Reset form
    setFormData({
      costType: '',
      amount: '',
      currency: 'ZAR',
      notes: ''
    });
    setSelectedFiles(null);
    setShowForm(false);
  };

  const getTotalAdditionalCosts = (currency: 'USD' | 'ZAR') => {
    return additionalCosts
      .filter(cost => cost.currency === currency)
      .reduce((sum, cost) => sum + cost.amount, 0);
  };

  const getCurrencySymbol = (currency: 'USD' | 'ZAR') => {
    return currency === 'USD' ? '$' : 'R';
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader 
          title="Additional Costs Summary" 
          icon={<DollarSign className="w-5 h-5 text-green-600" />}
          action={
            !readOnly && (
              <Button
                size="sm"
                onClick={() => setShowForm(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Additional Cost
              </Button>
            )
          }
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-500">ZAR Additional Costs</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(getTotalAdditionalCosts('ZAR'), 'ZAR')}
              </p>
              <p className="text-xs text-gray-400">
                {additionalCosts.filter(c => c.currency === 'ZAR').length} entries
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-500">USD Additional Costs</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(getTotalAdditionalCosts('USD'), 'USD')}
              </p>
              <p className="text-xs text-gray-400">
                {additionalCosts.filter(c => c.currency === 'USD').length} entries
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-500">Total Entries</p>
              <p className="text-xl font-bold text-purple-600">
                {additionalCosts.length}
              </p>
              <p className="text-xs text-gray-400">additional costs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Cost Form */}
      {showForm && !readOnly && (
        <Card>
          <CardHeader 
            title="Add Additional Cost" 
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowForm(false)}
                icon={<X className="w-4 h-4" />}
              >
                Cancel
              </Button>
            }
          />
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Cost Type *"
                  value={formData.costType}
                  onChange={(e) => handleChange('costType', e.target.value)}
                  options={[
                    { label: 'Select cost type...', value: '' },
                    ...ADDITIONAL_COST_TYPES
                  ]}
                  error={errors.costType}
                />
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
                  label={`Amount (${getCurrencySymbol(formData.currency)}) *`}
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  placeholder="0.00"
                  error={errors.amount}
                />
              </div>

              <TextArea
                label="Notes (Optional)"
                value={formData.notes || ''}
                onChange={e => handleChange('notes', typeof e === 'string' ? e : e.target?.value || '')}
                placeholder="Additional notes about this cost..."
                rows={3}
              />

              <FileUpload
                label="Supporting Documents"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                multiple
                onFileSelect={setSelectedFiles}
              />

              {selectedFiles && selectedFiles.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-sm font-medium text-green-800 mb-2">
                    Selected Files ({selectedFiles.length}):
                  </p>
                  <ul className="text-sm text-green-700 space-y-1">
                    {Array.from(selectedFiles).map((file, index) => (
                      <li key={index} className="flex items-center">
                        <Upload className="w-3 h-3 mr-2" />
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  Add Additional Cost
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Additional Costs */}
      {additionalCosts.length > 0 && (
        <Card>
          <CardHeader title="Additional Costs List" />
          <CardContent>
            <div className="space-y-3">
              {additionalCosts.map((cost) => (
                <div key={cost.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {ADDITIONAL_COST_TYPES.find(t => t.value === cost.costType)?.label || cost.costType}
                        </h4>
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(cost.amount, cost.currency)}
                        </span>
                      </div>
                      
                      {cost.notes && (
                        <p className="text-sm text-gray-600 mb-2">{cost.notes}</p>
                      )}

                      <div className="text-xs text-gray-500">
                        Added by {cost.addedBy} on {new Date(cost.addedAt).toLocaleDateString()}
                      </div>

                      {cost.supportingDocuments.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            Supporting Documents ({cost.supportingDocuments.length}):
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {cost.supportingDocuments.map((doc) => (
                              <span key={doc.id} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                <Upload className="w-3 h-3 mr-1" />
                                {doc.filename}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {!readOnly && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => onRemoveCost(cost.id)}
                        icon={<X className="w-3 h-3" />}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {additionalCosts.length === 0 && (
        <div className="text-center py-8">
          <DollarSign className="mx-auto h-10 w-10 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No additional costs</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add additional costs like demurrage, clearing fees, or detention charges.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdditionalCostsForm;
