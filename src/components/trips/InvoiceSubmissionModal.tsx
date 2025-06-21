import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { formatCurrency, calculateKPIs } from '../../utils/helpers';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, TextArea } from '../ui/FormElements';
import AdditionalCostsForm from '../costs/AdditionalCostsForm';
import { Trip, AdditionalCost } from '../../types/index';
import FileUpload from '../ui/FileUpload';

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
    validationNotes: ''
  });

  const [proofOfDelivery, setProofOfDelivery] = useState<FileList | null>(null);
  const [signedInvoice, setSignedInvoice] = useState<FileList | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    
    // Check for required documents
    if (!proofOfDelivery || proofOfDelivery.length === 0) {
      newErrors.proofOfDelivery = 'Proof of delivery is required for invoicing';
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
        finalArrivalDateTime: trip.actualArrivalDateTime || trip.plannedArrivalDateTime || new Date().toISOString(),
        finalOffloadDateTime: trip.actualOffloadDateTime || trip.plannedOffloadDateTime || new Date().toISOString(),
        finalDepartureDateTime: trip.actualDepartureDateTime || trip.plannedDepartureDateTime || new Date().toISOString()
      },
      validationNotes: formData.validationNotes.trim(),
      proofOfDelivery,
      signedInvoice
    });
  };

  const kpis = calculateKPIs(trip);
  const totalAdditionalCosts = trip.additionalCosts?.reduce((sum, cost) => sum + cost.amount, 0) || 0;
  const finalInvoiceAmount = kpis.totalRevenue + totalAdditionalCosts;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Trip for Invoicing"
      maxWidth="2xl"
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

        {/* Invoice Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Invoice Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Invoice Number *"
              value={formData.invoiceNumber}
              onChange={value => handleChange('invoiceNumber', value)}
              placeholder="e.g., INV-2025-001"
              error={errors.invoiceNumber}
            />
            
            <Input
              label="Invoice Date *"
              type="date"
              value={formData.invoiceDate}
              onChange={value => handleChange('invoiceDate', value)}
              error={errors.invoiceDate}
            />
            
            <Input
              label="Due Date *"
              type="date"
              value={formData.invoiceDueDate}
              onChange={value => handleChange('invoiceDueDate', value)}
              error={errors.invoiceDueDate}
            />
          </div>
          
          <TextArea
            label="Invoice Notes (Optional)"
            value={formData.validationNotes}
            onChange={value => handleChange('validationNotes', value)}
            placeholder="Add any notes about this invoice..."
            rows={3}
          />
        </div>

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
          onAddCost={onAddAdditionalCost}
          onRemoveCost={onRemoveAdditionalCost}
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