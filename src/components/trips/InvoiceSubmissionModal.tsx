import React, { useState } from 'react';
import { Trip, AdditionalCost, DelayReason } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, TextArea, FileUpload } from '../ui/FormElements';
import AdditionalCostsForm from '../costs/AdditionalCostsForm';
import { 
  Send, 
  X, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  FileText, 
  DollarSign,
  Calendar,
  Flag
} from 'lucide-react';
import { formatCurrency, formatDateTime, calculateKPIs } from '../../utils/helpers';

interface InvoiceSubmissionModalProps {
  isOpen: boolean;
  trip: Trip;
  onClose: () => void;
  onSubmit: (invoiceData: {
    invoiceNumber: string;
    invoiceDate: string;
    invoiceDueDate: string;
    finalTimeline: {
      finalArrivalDateTime: string;
      finalOffloadDateTime: string;
      finalDepartureDateTime: string;
    };
    validationNotes: string;
    proofOfDelivery: FileList | null;
    signedInvoice: FileList | null;
  }) => void;
  onAddAdditionalCost: (cost: Omit<AdditionalCost, 'id'>, files?: FileList) => void;
  onRemoveAdditionalCost: (costId: string) => void;
}

const InvoiceSubmissionModal: React.FC<InvoiceSubmissionModalProps> = ({
  isOpen,
  trip,
  onClose,
  onSubmit,
  onAddAdditionalCost,
  onRemoveAdditionalCost
}) => {
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceDueDate: '',
    finalArrivalDateTime: trip.actualArrivalDateTime || trip.plannedArrivalDateTime || '',
    finalOffloadDateTime: trip.actualOffloadDateTime || trip.plannedOffloadDateTime || '',
    finalDepartureDateTime: trip.actualDepartureDateTime || trip.plannedDepartureDateTime || '',
    validationNotes: ''
  });

  const [proofOfDelivery, setProofOfDelivery] = useState<FileList | null>(null);
  const [signedInvoice, setSignedInvoice] = useState<FileList | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate timeline discrepancies
  const calculateDiscrepancies = () => {
    const discrepancies = [];
    
    if (trip.plannedArrivalDateTime && formData.finalArrivalDateTime) {
      const planned = new Date(trip.plannedArrivalDateTime);
      const final = new Date(formData.finalArrivalDateTime);
      const diffHours = (final.getTime() - planned.getTime()) / (1000 * 60 * 60);
      
      if (Math.abs(diffHours) > 1) {
        discrepancies.push({
          type: 'Arrival',
          planned: formatDateTime(planned),
          final: formatDateTime(final),
          difference: `${diffHours > 0 ? '+' : ''}${diffHours.toFixed(1)} hours`,
          severity: Math.abs(diffHours) > 4 ? 'major' : Math.abs(diffHours) > 2 ? 'moderate' : 'minor'
        });
      }
    }

    if (trip.plannedOffloadDateTime && formData.finalOffloadDateTime) {
      const planned = new Date(trip.plannedOffloadDateTime);
      const final = new Date(formData.finalOffloadDateTime);
      const diffHours = (final.getTime() - planned.getTime()) / (1000 * 60 * 60);
      
      if (Math.abs(diffHours) > 1) {
        discrepancies.push({
          type: 'Offload',
          planned: formatDateTime(planned),
          final: formatDateTime(final),
          difference: `${diffHours > 0 ? '+' : ''}${diffHours.toFixed(1)} hours`,
          severity: Math.abs(diffHours) > 4 ? 'major' : Math.abs(diffHours) > 2 ? 'moderate' : 'minor'
        });
      }
    }

    if (trip.plannedDepartureDateTime && formData.finalDepartureDateTime) {
      const planned = new Date(trip.plannedDepartureDateTime);
      const final = new Date(formData.finalDepartureDateTime);
      const diffHours = (final.getTime() - planned.getTime()) / (1000 * 60 * 60);
      
      if (Math.abs(diffHours) > 1) {
        discrepancies.push({
          type: 'Departure',
          planned: formatDateTime(planned),
          final: formatDateTime(final),
          difference: `${diffHours > 0 ? '+' : ''}${diffHours.toFixed(1)} hours`,
          severity: Math.abs(diffHours) > 4 ? 'major' : Math.abs(diffHours) > 2 ? 'moderate' : 'minor'
        });
      }
    }

    return discrepancies;
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-calculate due date based on currency
    if (field === 'invoiceDate') {
      const invoiceDate = new Date(value);
      const daysToAdd = trip.revenueCurrency === 'USD' ? 14 : 30;
      const dueDate = new Date(invoiceDate.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
      setFormData(prev => ({ 
        ...prev, 
        invoiceDate: value,
        invoiceDueDate: dueDate.toISOString().split('T')[0]
      }));
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.invoiceNumber.trim()) {
      newErrors.invoiceNumber = 'Invoice number is required';
    }
    
    if (!formData.invoiceDate) {
      newErrors.invoiceDate = 'Invoice date is required';
    }
    
    if (!formData.invoiceDueDate) {
      newErrors.invoiceDueDate = 'Due date is required';
    }
    
    if (!formData.finalArrivalDateTime) {
      newErrors.finalArrivalDateTime = 'Final arrival time is required';
    }
    
    if (!formData.finalOffloadDateTime) {
      newErrors.finalOffloadDateTime = 'Final offload time is required';
    }
    
    if (!formData.finalDepartureDateTime) {
      newErrors.finalDepartureDateTime = 'Final departure time is required';
    }
    
    // Check for required documents
    if (!proofOfDelivery || proofOfDelivery.length === 0) {
      newErrors.proofOfDelivery = 'Proof of delivery is required for invoicing';
    }
    
    const discrepancies = calculateDiscrepancies();
    if (discrepancies.length > 0 && !formData.validationNotes.trim()) {
      newErrors.validationNotes = 'Validation notes are required when there are timeline discrepancies';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    onSubmit({
      invoiceNumber: formData.invoiceNumber.trim(),
      invoiceDate: formData.invoiceDate,
      invoiceDueDate: formData.invoiceDueDate,
      finalTimeline: {
        finalArrivalDateTime: formData.finalArrivalDateTime,
        finalOffloadDateTime: formData.finalOffloadDateTime,
        finalDepartureDateTime: formData.finalDepartureDateTime
      },
      validationNotes: formData.validationNotes.trim(),
      proofOfDelivery,
      signedInvoice
    });
  };

  const kpis = calculateKPIs(trip);
  const discrepancies = calculateDiscrepancies();
  const hasDiscrepancies = discrepancies.length > 0;
  const totalAdditionalCosts = trip.additionalCosts?.reduce((sum, cost) => sum + cost.amount, 0) || 0;
  const finalInvoiceAmount = kpis.totalRevenue + totalAdditionalCosts;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Trip for Invoicing"
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Trip Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-blue-800 mb-3">Trip Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-blue-600 font-medium">Fleet & Driver</p>
              <p className="text-blue-800">{trip.fleetNumber} - {trip.driverName}</p>
            </div>
            <div>
              <p className="text-blue-600 font-medium">Route</p>
              <p className="text-blue-800">{trip.route}</p>
            </div>
            <div>
              <p className="text-blue-600 font-medium">Client</p>
              <p className="text-blue-800">{trip.clientName}</p>
            </div>
            <div>
              <p className="text-blue-600 font-medium">Period</p>
              <p className="text-blue-800">{trip.startDate} to {trip.endDate}</p>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-green-800 mb-3">Invoice Amount Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-green-600">Base Revenue</p>
              <p className="text-xl font-bold text-green-800">
                {formatCurrency(trip.baseRevenue, trip.revenueCurrency)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-green-600">Additional Costs</p>
              <p className="text-xl font-bold text-green-800">
                {formatCurrency(totalAdditionalCosts, trip.revenueCurrency)}
              </p>
              <p className="text-xs text-green-600">{trip.additionalCosts?.length || 0} items</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-green-600">Total Invoice Amount</p>
              <p className="text-2xl font-bold text-green-800">
                {formatCurrency(finalInvoiceAmount, trip.revenueCurrency)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-green-600">Currency</p>
              <p className="text-xl font-bold text-green-800">{trip.revenueCurrency}</p>
            </div>
          </div>
        </div>

        {/* Timeline Validation */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Final Timeline Validation</h3>
          
          {hasDiscrepancies && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800">Timeline Discrepancies Detected</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Significant differences found between planned and final times. Please review and provide validation notes.
                  </p>
                  <div className="mt-3 space-y-2">
                    {discrepancies.map((disc, index) => (
                      <div key={index} className="text-sm bg-amber-100 p-2 rounded border border-amber-300">
                        <div className="flex items-center space-x-2">
                          <Flag className={`w-4 h-4 ${
                            disc.severity === 'major' ? 'text-red-600' : 
                            disc.severity === 'moderate' ? 'text-orange-600' : 'text-yellow-600'
                          }`} />
                          <span className="font-medium text-amber-800">{disc.type} Time Variance ({disc.severity})</span>
                        </div>
                        <div className="ml-6 mt-1 space-y-1">
                          <div className="text-amber-700">
                            <span className="font-medium">Planned:</span> {disc.planned}
                          </div>
                          <div className="text-amber-700">
                            <span className="font-medium">Final:</span> {disc.final}
                          </div>
                          <div className="text-amber-800 font-medium">
                            <span className="font-medium">Difference:</span> {disc.difference}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Final Arrival Date & Time *"
              type="datetime-local"
              value={formData.finalArrivalDateTime}
              onChange={(e) => handleChange('finalArrivalDateTime', e.target.value)}
              error={errors.finalArrivalDateTime}
            />
            <Input
              label="Final Offload Date & Time *"
              type="datetime-local"
              value={formData.finalOffloadDateTime}
              onChange={(e) => handleChange('finalOffloadDateTime', e.target.value)}
              error={errors.finalOffloadDateTime}
            />
            <Input
              label="Final Departure Date & Time *"
              type="datetime-local"
              value={formData.finalDepartureDateTime}
              onChange={(e) => handleChange('finalDepartureDateTime', e.target.value)}
              error={errors.finalDepartureDateTime}
            />
          </div>

          {hasDiscrepancies && (
            <TextArea
              label="Timeline Validation Notes *"
              value={formData.validationNotes}
              onChange={(e) => handleChange('validationNotes', e.target.value)}
              placeholder="Explain the timeline discrepancies and any delays encountered..."
              rows={3}
              error={errors.validationNotes}
            />
          )}
        </div>

        {/* Delay Reasons Summary */}
        {trip.delayReasons && trip.delayReasons.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">Recorded Delays ({trip.delayReasons.length})</h4>
            <div className="space-y-2">
              {trip.delayReasons.map((delay, index) => (
                <div key={index} className="text-sm bg-white p-2 rounded border border-red-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-red-800">{delay.delayType.replace(/_/g, ' ').toUpperCase()}</span>
                      <p className="text-red-700">{delay.description}</p>
                    </div>
                    <span className="text-red-600 font-medium">{delay.delayDuration}h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Costs */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Additional Costs</h3>
          <AdditionalCostsForm
            tripId={trip.id}
            additionalCosts={trip.additionalCosts || []}
            onAddCost={onAddAdditionalCost}
            onRemoveCost={onRemoveAdditionalCost}
          />
        </div>

        {/* Invoice Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Invoice Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Invoice Number *"
              value={formData.invoiceNumber}
              onChange={(e) => handleChange('invoiceNumber', e.target.value)}
              placeholder="INV-2025-001"
              error={errors.invoiceNumber}
            />
            <Input
              label="Invoice Date *"
              type="date"
              value={formData.invoiceDate}
              onChange={(e) => handleChange('invoiceDate', e.target.value)}
              error={errors.invoiceDate}
            />
            <Input
              label={`Due Date * (${trip.revenueCurrency === 'USD' ? '14' : '30'} days default)`}
              type="date"
              value={formData.invoiceDueDate}
              onChange={(e) => handleChange('invoiceDueDate', e.target.value)}
              error={errors.invoiceDueDate}
            />
          </div>
        </div>

        {/* Required Documents */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Required Documents</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FileUpload
                label="Proof of Delivery (POD) *"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onFileSelect={setProofOfDelivery}
              />
              {errors.proofOfDelivery && (
                <p className="text-sm text-red-600 mt-1">{errors.proofOfDelivery}</p>
              )}
              {proofOfDelivery && proofOfDelivery.length > 0 && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm font-medium text-green-800">
                    Selected: {proofOfDelivery.length} file(s)
                  </p>
                  <ul className="text-sm text-green-700 mt-1">
                    {Array.from(proofOfDelivery).map((file, index) => (
                      <li key={index}>• {file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <FileUpload
                label="Signed Invoice (Optional)"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onFileSelect={setSignedInvoice}
              />
              {signedInvoice && signedInvoice.length > 0 && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm font-medium text-blue-800">
                    Selected: {signedInvoice.length} file(s)
                  </p>
                  <ul className="text-sm text-blue-700 mt-1">
                    {Array.from(signedInvoice).map((file, index) => (
                      <li key={index}>• {file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submission Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-800 mb-2">Submission Summary</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <p>• Trip will be marked as <strong>INVOICED</strong></p>
            <p>• Invoice aging tracking will begin automatically</p>
            <p>• Payment follow-up alerts will be scheduled based on currency thresholds</p>
            <p>• Timeline validation will be recorded for compliance reporting</p>
            {hasDiscrepancies && (
              <p className="text-amber-700">• Timeline discrepancies will be flagged for review</p>
            )}
          </div>
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
            icon={<Send className="w-4 h-4" />}
          >
            Submit for Invoicing
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceSubmissionModal;