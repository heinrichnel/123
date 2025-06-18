// ─── React ───────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';

// ─── Types ───────────────────────────────────────────────────────
import { Trip, InvoiceAging, AGING_THRESHOLDS, FOLLOW_UP_THRESHOLDS } from '../../types';

// ─── Context ─────────────────────────────────────────────────────
import { useAppContext } from '../../context/AppContext';

// ─── UI Components ───────────────────────────────────────────────
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { Input, Select } from '../ui/FormElements';

// ─── Modals ──────────────────────────────────────────────────────
import InvoiceFollowUpModal from './InvoiceFollowUpModal';
import PaymentUpdateModal from './PaymentUpdateModal';

// ─── Icons ───────────────────────────────────────────────────────
import { 
  DollarSign,
  Filter,
  Download,
  Eye,
  Bell,
  Phone,
  MessageSquare,
  CreditCard
} from 'lucide-react';

// ─── Utils ───────────────────────────────────────────────────────
import { formatCurrency, formatDate, formatDateTime } from '../../utils/helpers';


interface InvoiceAgingDashboardProps {
  trips: Trip[];
  onViewTrip: (trip: Trip) => void;
}

const InvoiceAgingDashboard: React.FC<InvoiceAgingDashboardProps> = ({
  trips,
  onViewTrip
}) => {
  const { updateTrip, updateInvoicePayment } = useAppContext();
  const [filters, setFilters] = useState({
    currency: '',
    status: '',
    customer: '',
    agingCategory: ''
  });
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // Prepare invoice data from trips
  const invoiceData = useMemo(() => {
    return trips
      .filter(trip => trip.status === 'invoiced' || trip.status === 'paid')
      .filter(trip => trip.invoiceNumber && trip.invoiceDate && trip.invoiceDueDate)
      .map(trip => {
        const dueDate = new Date(trip.invoiceDueDate!);
        const today = new Date();
        const agingDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const thresholds = AGING_THRESHOLDS[trip.revenueCurrency];
        let status: 'current' | 'warning' | 'critical' | 'overdue' = 'current';
        
        if (agingDays >= thresholds.overdue.min) {
          status = 'overdue';
        } else if (agingDays >= thresholds.critical.min && agingDays <= thresholds.critical.max) {
          status = 'critical';
        } else if (agingDays >= thresholds.warning.min && agingDays <= thresholds.warning.max) {
          status = 'warning';
        }

        return {
          tripId: trip.id,
          invoiceNumber: trip.invoiceNumber!,
          customerName: trip.clientName,
          invoiceDate: trip.invoiceDate!,
          dueDate: trip.invoiceDueDate!,
          amount: trip.baseRevenue,
          currency: trip.revenueCurrency,
          agingDays,
          status,
          paymentStatus: trip.paymentStatus,
          lastFollowUp: trip.lastFollowUpDate,
          followUpCount: trip.followUpHistory?.length || 0,
          trip
        } as InvoiceAging & { trip: Trip; followUpCount: number };
      });
  }, [trips]);

  // Apply filters to invoice data
  const filteredInvoices = useMemo(() => {
    return invoiceData.filter(invoice => {
      if (filters.currency && invoice.currency !== filters.currency) return false;
      if (filters.status && invoice.paymentStatus !== filters.status) return false;
      if (filters.customer && !invoice.customerName.toLowerCase().includes(filters.customer.toLowerCase())) return false;
      if (filters.agingCategory && invoice.status !== filters.agingCategory) return false;
      return true;
    });
  }, [invoiceData, filters]);

  // Sort invoices with overdue first and descending aging days
  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => {
      // Overdue first, then by aging days descending
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (a.status !== 'overdue' && b.status === 'overdue') return 1;
      return b.agingDays - a.agingDays;
    });
  }, [filteredInvoices]);

  // Summarize aging by currency and category
  const agingSummary = useMemo(() => {
    const summary = {
      ZAR: { current: 0, warning: 0, critical: 0, overdue: 0, total: 0 },
      USD: { current: 0, warning: 0, critical: 0, overdue: 0, total: 0 }
    };

    filteredInvoices.forEach(invoice => {
      summary[invoice.currency][invoice.status] += invoice.amount;
      summary[invoice.currency].total += invoice.amount;
    });

    return summary;
  }, [filteredInvoices]);

  // Identify invoices needing immediate follow-up
  const alertsNeeded = useMemo(() => {
    return filteredInvoices.filter(invoice => {
      const threshold = FOLLOW_UP_THRESHOLDS[invoice.currency];
      return invoice.agingDays >= threshold && invoice.paymentStatus === 'unpaid';
    });
  }, [filteredInvoices]);

  // Add a follow-up record
  const handleAddFollowUp = (tripId: string, followUpData: {
    followUpDate: string;
    contactMethod: 'call' | 'email' | 'whatsapp' | 'in_person' | 'sms';
    responsibleStaff: string;
    responseSummary: string;
    nextFollowUpDate?: string;
    status: 'pending' | 'completed' | 'escalated';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    outcome: 'no_response' | 'promised_payment' | 'dispute' | 'payment_received' | 'partial_payment';
  }) => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;

    const followUpRecord = {
      id: `FU${Date.now()}`,
      tripId: trip.id,
      followUpDate: followUpData.followUpDate,
      contactMethod: followUpData.contactMethod,
      responsibleStaff: followUpData.responsibleStaff,
      responseSummary: followUpData.responseSummary,
      nextFollowUpDate: followUpData.nextFollowUpDate,
      status: followUpData.status,
      priority: followUpData.priority,
      outcome: followUpData.outcome
    };

    const updatedTrip: Trip = {
      ...trip,
      followUpHistory: [...(trip.followUpHistory || []), followUpRecord],
      lastFollowUpDate: followUpData.followUpDate
    };

    updateTrip(updatedTrip);
    setShowFollowUpModal(false);
    setSelectedTrip(null);

    alert(`Follow-up recorded successfully!\n\nCustomer: ${trip.clientName}\nOutcome: ${followUpData.outcome.replace('_', ' ').toUpperCase()}\n\nFollow-up history has been updated.`);
  };

  const handleRecordFollowUp = (trip: Trip) => {
    setSelectedTrip(trip);
    setShowFollowUpModal(true);
  };

  const handleUpdatePayment = (trip: Trip) => {
    setSelectedTrip(trip);
    setShowPaymentModal(true);
  };

  const handlePaymentUpdate = (tripId: string, paymentData: {
    paymentStatus: 'unpaid' | 'partial' | 'paid';
    paymentAmount?: number;
    paymentReceivedDate?: string;
    paymentNotes?: string;
    paymentMethod?: string;
    bankReference?: string;
  }) => {
    updateInvoicePayment(tripId, paymentData);
    setShowPaymentModal(false);
    setSelectedTrip(null);

    const trip = trips.find(t => t.id === tripId);
    const statusMessage = paymentData.paymentStatus === 'paid' ? 'PAID IN FULL' : 
                         paymentData.paymentStatus === 'partial' ? 'PARTIAL PAYMENT' : 'UNPAID';
    
    alert(`Payment status updated successfully!\n\nCustomer: ${trip?.clientName}\nStatus: ${statusMessage}\n${paymentData.paymentAmount ? `Amount: ${formatCurrency(paymentData.paymentAmount, trip?.revenueCurrency || 'ZAR')}` : ''}\n\nInvoice aging tracking has been updated.`);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({ currency: '', status: '', customer: '', agingCategory: '' });
  };

  const exportAging = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "INVOICE FOLLOW-UP ANALYSIS\n";
    csvContent += `Generated on,${formatDateTime(new Date())}\n\n`;
    
    csvContent += "Invoice Number,Customer,Invoice Date,Due Date,Amount,Currency,Aging Days,Status,Payment Status,Follow-ups,Last Follow-Up\n";
    sortedInvoices.forEach(invoice => {
      csvContent += `${invoice.invoiceNumber},"${invoice.customerName}",${formatDate(invoice.invoiceDate)},${formatDate(invoice.dueDate)},${invoice.amount},${invoice.currency},${invoice.agingDays},${invoice.status.toUpperCase()},${invoice.paymentStatus.toUpperCase()},${invoice.followUpCount},"${invoice.lastFollowUp ? formatDate(invoice.lastFollowUp) : 'None'}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `invoice-followup-analysis-${formatDate(new Date()).replace(/\s/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoice Follow-up Management</h2>
          <p className="text-gray-600">Track follow-up activities and customer communications for outstanding invoices</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={exportAging}
            icon={<Download className="w-4 h-4" />}
          >
            Export Follow-up Report
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alertsNeeded.length > 0 && (
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Bell className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Follow-up Alerts</h4>
                <p className="text-sm text-red-700 mt-1">
                  {alertsNeeded.length} invoice{alertsNeeded.length !== 1 ? 's' : ''} require immediate follow-up action
                </p>
                <div className="mt-2 space-y-1">
                  {alertsNeeded.slice(0, 3).map(invoice => (
                    <div key={invoice.invoiceNumber} className="text-xs text-red-600">
                      • {invoice.invoiceNumber} - {invoice.customerName} ({invoice.agingDays} days overdue)
                    </div>
                  ))}
                  {alertsNeeded.length > 3 && (
                    <div className="text-xs text-red-600">
                      • +{alertsNeeded.length - 3} more requiring attention
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aging Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ZAR Summary */}
        <Card>
          <CardHeader title="ZAR Aging Summary" />
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 font-medium">Current (0-20 days)</p>
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(agingSummary.ZAR.current, 'ZAR')}
                  </p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-600 font-medium">Warning (21-29 days)</p>
                  <p className="text-lg font-bold text-yellow-700">
                    {formatCurrency(agingSummary.ZAR.warning, 'ZAR')}
                  </p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-600 font-medium">Critical (30 days)</p>
                  <p className="text-lg font-bold text-orange-700">
                    {formatCurrency(agingSummary.ZAR.critical, 'ZAR')}
                  </p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600 font-medium">Overdue (30+ days)</p>
                  <p className="text-lg font-bold text-red-700">
                    {formatCurrency(agingSummary.ZAR.overdue, 'ZAR')}
                  </p>
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 font-medium">Total Outstanding</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(agingSummary.ZAR.total, 'ZAR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* USD Summary */}
        <Card>
          <CardHeader title="USD Aging Summary" />
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 font-medium">Current (0-10 days)</p>
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(agingSummary.USD.current, 'USD')}
                  </p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-600 font-medium">Warning (11-13 days)</p>
                  <p className="text-lg font-bold text-yellow-700">
                    {formatCurrency(agingSummary.USD.warning, 'USD')}
                  </p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-600 font-medium">Critical (14 days)</p>
                  <p className="text-lg font-bold text-orange-700">
                    {formatCurrency(agingSummary.USD.critical, 'USD')}
                  </p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600 font-medium">Overdue (14+ days)</p>
                  <p className="text-lg font-bold text-red-700">
                    {formatCurrency(agingSummary.USD.overdue, 'USD')}
                  </p>
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 font-medium">Total Outstanding</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(agingSummary.USD.total, 'USD')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader 
          title="Filter Invoices" 
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={clearFilters}
              icon={<Filter className="w-4 h-4" />}
            >
              Clear Filters
            </Button>
          }
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Currency"
              value={filters.currency}
              onChange={value => handleFilterChange('currency', value)}
              options={[
                { label: 'All Currencies', value: '' },
                { label: 'ZAR (R)', value: 'ZAR' },
                { label: 'USD ($)', value: 'USD' }
              ]}
            />
            <Select
              label="Payment Status"
              value={filters.status}
              onChange={value => handleFilterChange('status', value)}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Unpaid', value: 'unpaid' },
                { label: 'Partial', value: 'partial' },
                { label: 'Paid', value: 'paid' }
              ]}
            />
            <Select
              label="Aging Category"
              value={filters.agingCategory}
              onChange={value => handleFilterChange('agingCategory', value)}
              options={[
                { label: 'All Categories', value: '' },
                { label: 'Current', value: 'current' },
                { label: 'Warning', value: 'warning' },
                { label: 'Critical', value: 'critical' },
                { label: 'Overdue', value: 'overdue' }
              ]}
            />
            <Input
              label="Customer"
              value={filters.customer}
              onChange={value => handleFilterChange('customer', value)}
              placeholder="Search customer..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoice List */}
      <Card>
        <CardHeader title={`Invoice Follow-up Tracking (${sortedInvoices.length})`} />
        <CardContent>
          {sortedInvoices.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No invoices match your current filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Invoice #</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Customer</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Due Date</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Amount</th>
                    <th className="text-center py-3 text-sm font-medium text-gray-500">Aging</th>
                    <th className="text-center py-3 text-sm font-medium text-gray-500">Payment Status</th>
                    <th className="text-center py-3 text-sm font-medium text-gray-500">Follow-ups</th>
                    <th className="text-center py-3 text-sm font-medium text-gray-500">Last Contact</th>
                    <th className="text-center py-3 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedInvoices.map((invoice) => (
                    <tr key={invoice.invoiceNumber} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="py-3 text-sm text-gray-900">
                        {invoice.customerName}
                      </td>
                      <td className="py-3 text-sm text-gray-900">
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td className="py-3 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                          invoice.status === 'current' ? 'text-green-600 bg-green-50 border-green-200' :
                          invoice.status === 'warning' ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
                          invoice.status === 'critical' ? 'text-orange-600 bg-orange-50 border-orange-200' :
                          'text-red-600 bg-red-50 border-red-200'
                        }`}>
                          {invoice.agingDays} days
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {invoice.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">{invoice.followUpCount}</span>
                        </div>
                      </td>
                      <td className="py-3 text-center text-sm text-gray-600">
                        {invoice.lastFollowUp ? formatDate(invoice.lastFollowUp) : 'Never'}
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex justify-center space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewTrip(invoice.trip)}
                            icon={<Eye className="w-3 h-3" />}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdatePayment(invoice.trip)}
                            icon={<CreditCard className="w-3 h-3" />}
                          >
                            Payment
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleRecordFollowUp(invoice.trip)}
                            icon={<Phone className="w-3 h-3" />}
                          >
                            Follow Up
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Follow-up Modal */}
      {selectedTrip && (
        <InvoiceFollowUpModal
          isOpen={showFollowUpModal}
          trip={selectedTrip}
          onClose={() => {
            setShowFollowUpModal(false);
            setSelectedTrip(null);
          }}
          onAddFollowUp={handleAddFollowUp}
        />
      )}

      {/* Payment Update Modal */}
      {selectedTrip && (
        <PaymentUpdateModal
          isOpen={showPaymentModal}
          trip={selectedTrip}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedTrip(null);
          }}
          onUpdatePayment={handlePaymentUpdate}
        />
      )}
    </div>
  );
};

export default InvoiceAgingDashboard;
