// ─── React & Icons ────────────────────────────────────────────────
import React, { useState } from 'react';
import { Send, X, AlertTriangle, Flag } from 'lucide-react';

// ─── Types & Helpers ──────────────────────────────────────────────
import { Trip, AdditionalCost } from '../../types';
import { formatCurrency, formatDateTime, calculateKPIs } from '../../utils/helpers';

// ─── UI Components ────────────────────────────────────────────────
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select, Textarea } from '../ui/FormElements';

// ─── Feature Components ───────────────────────────────────────────
import AdditionalCostsForm from '../costs/AdditionalCostsForm';


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
            <ul className="list-disc list-inside text-sm text-red-700 max-h-32 overflow-y-auto">
              {trip.delayReasons.map((delay) => (
                <li key={delay.id}>
                  {formatDate(delay.date)} - {delay.reason} ({delay.duration} minutes) - {delay.notes}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Proof of Delivery & Signed Invoice Upload */}
        <div className="space-y-6">
          <FileUpload
            label="Upload Proof of Delivery *"
            accept="image/*,application/pdf"
            multiple={true}
            onFileSelect={setProofOfDelivery}
            className="max-w-lg"
            error={errors.proofOfDelivery}
          />
          <FileUpload
            label="Upload Signed Invoice (optional)"
            accept="image/*,application/pdf"
            multiple={true}
            onFileSelect={setSignedInvoice}
            className="max-w-lg"
          />
        </div>

        {/* Additional Costs Form */}
        <AdditionalCostsForm
          tripId={trip.id}
          onAddAdditionalCost={onAddAdditionalCost}
          onRemoveAdditionalCost={onRemoveAdditionalCost}
          additionalCosts={trip.additionalCosts || []}
        />

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
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
            Submit Invoice
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceSubmissionModal;
