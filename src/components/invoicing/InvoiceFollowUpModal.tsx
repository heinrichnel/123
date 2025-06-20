// ─── React ───────────────────────────────────────────────────────
import React, { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────
import { Trip } from '../../types';

// ─── UI Components ───────────────────────────────────────────────
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select, Textarea } from '../ui/FormElements';

// ─── Icons ───────────────────────────────────────────────────────
import { Save, X, Phone, Calendar, User } from 'lucide-react';

// ─── Utils ───────────────────────────────────────────────────────
import { formatCurrency, formatDate } from '../../utils/helpers';


interface InvoiceFollowUpModalProps {
  isOpen: boolean;
  trip: Trip;
  onClose: () => void;
  onAddFollowUp: (
    tripId: string, 
    followUpData: {
      followUpDate: string;
      contactMethod: 'call' | 'email' | 'whatsapp' | 'in_person' | 'sms';
      responsibleStaff: string;
      responseSummary: string;
      nextFollowUpDate?: string;
      status: 'pending' | 'completed' | 'escalated';
      priority: 'low' | 'medium' | 'high' | 'urgent';
      outcome: 'no_response' | 'promised_payment' | 'dispute' | 'payment_received' | 'partial_payment';
    }
  ) => void;
}

const InvoiceFollowUpModal: React.FC<InvoiceFollowUpModalProps> = ({
  isOpen,
  trip,
  onClose,
  onAddFollowUp
}) => {
  const [formData, setFormData] = useState({
    followUpDate: new Date().toISOString().split('T')[0],
    contactMethod: 'call' as 'call' | 'email' | 'whatsapp' | 'in_person' | 'sms',
    responsibleStaff: '',
    responseSummary: '',
    nextFollowUpDate: '',
    status: 'completed' as 'pending' | 'completed' | 'escalated',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    outcome: 'no_response' as 'no_response' | 'promised_payment' | 'dispute' | 'payment_received' | 'partial_payment'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.followUpDate) {
      newErrors.followUpDate = 'Follow-up date is required';
    }
    if (!formData.responsibleStaff.trim()) {
      newErrors.responsibleStaff = 'Staff member name is required';
    }
    if (!formData.responseSummary.trim()) {
      newErrors.responseSummary = 'Follow-up summary is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const followUpData = {
      followUpDate: formData.followUpDate,
      contactMethod: formData.contactMethod,
      responsibleStaff: formData.responsibleStaff.trim(),
      responseSummary: formData.responseSummary.trim(),
      nextFollowUpDate: formData.nextFollowUpDate || undefined,
      status: formData.status,
      priority: formData.priority,
      outcome: formData.outcome
    };

    onAddFollowUp(trip.id, followUpData);
    onClose();
  };

  const agingDays = trip.invoiceDueDate ? 
    Math.floor((new Date().getTime() - new Date(trip.invoiceDueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Follow-up Activity"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Invoice Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Invoice Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <p><strong>Invoice #:</strong> {trip.invoiceNumber}</p>
              <p><strong>Customer:</strong> {trip.clientName}</p>
              <p><strong>Amount:</strong> {formatCurrency(trip.baseRevenue, trip.revenueCurrency)}</p>
            </div>
            <div>
              <p><strong>Due Date:</strong> {formatDate(trip.invoiceDueDate!)}</p>
              <p>
                <strong>Aging:</strong> 
                <span className={agingDays > 30 ? 'text-red-600 font-bold' : agingDays > 20 ? 'text-orange-600 font-bold' : 'text-green-600'}>
                  {agingDays} days
                </span>
              </p>
              <p><strong>Status:</strong> {trip.paymentStatus.toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Previous Follow-ups */}
        {trip.followUpHistory && trip.followUpHistory.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-800 mb-2">Previous Follow-ups ({trip.followUpHistory.length})</h4>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {trip.followUpHistory.slice(-3).map((followUp, index) => (
                <div key={index} className="text-xs bg-white p-2 rounded border">
                  <div className="flex justify-between items-start">
                    <div>
                      <p><strong>{formatDate(followUp.followUpDate)}</strong> - {followUp.contactMethod.toUpperCase()}</p>
                      <p className="text-gray-600">{followUp.responseSummary}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      followUp.outcome === 'payment_received' ? 'bg-green-100 text-green-800' :
                      followUp.outcome === 'promised_payment' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {followUp.outcome.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Follow-up Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Follow-up Date *"
              type="date"
              value={formData.followUpDate}
              onChange={(e) => handleChange('followUpDate', e.target.value)}
              error={errors.followUpDate}
            />
            <Select
              label="Contact Method *"
              value={formData.contactMethod}
              onChange={(e) => handleChange('contactMethod', e.target.value)}
              options={[
                { label: 'Phone Call', value: 'call' },
                { label: 'Email', value: 'email' },
                { label: 'WhatsApp', value: 'whatsapp' },
                { label: 'In Person', value: 'in_person' },
                { label: 'SMS', value: 'sms' }
              ]}
            />
          </div>

          <Input
            label="Staff Member *"
            value={formData.responsibleStaff}
            onChange={(e) => handleChange('responsibleStaff', e.target.value)}
            placeholder="Name of person who conducted follow-up"
            error={errors.responsibleStaff}
          />

          <TextArea
            label="Follow-up Summary *"
            value={formData.responseSummary}
            onChange={(e) => handleChange('responseSummary', e.target.value)}
            placeholder="Describe the conversation, customer response, and any commitments made..."
            rows={4}
            error={errors.responseSummary}
          />

          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Priority"
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              options={[
                { label: 'Low', value: 'low' },
                { label: 'Medium', value: 'medium' },
                { label: 'High', value: 'high' },
                { label: 'Urgent', value: 'urgent' }
              ]}
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              options={[
                { label: 'Completed', value: 'completed' },
                { label: 'Pending', value: 'pending' },
                { label: 'Escalated', value: 'escalated' }
              ]}
            />
            <Select
              label="Outcome"
              value={formData.outcome}
              onChange={(e) => handleChange('outcome', e.target.value)}
              options={[
                { label: 'No Response', value: 'no_response' },
                { label: 'Promised Payment', value: 'promised_payment' },
                { label: 'Dispute Raised', value: 'dispute' },
                { label: 'Payment Received', value: 'payment_received' },
                { label: 'Partial Payment', value: 'partial_payment' }
              ]}
            />
          </div>

          <Input
            label="Next Follow-up Date"
            type="date"
            value={formData.nextFollowUpDate}
            onChange={(e) => handleChange('nextFollowUpDate', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
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
            icon={<Save className="w-4 h-4" />}
          >
            Record Follow-up
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceFollowUpModal;
