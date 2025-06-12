import React, { useState } from 'react';
import { Trip, CostEntry, AdditionalCost } from '../../types';
import { useAppContext } from '../../context/AppContext';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import CostForm from '../costs/CostForm';
import CostList from '../costs/CostList';
import TripReport from '../reports/TripReport';
import SystemCostGenerator from '../costs/SystemCostGenerator';
import InvoiceSubmissionModal from './InvoiceSubmissionModal';
import TripPlanningForm from '../planning/TripPlanningForm';
import { 
  Plus, 
  ArrowLeft, 
  BarChart3, 
  CheckCircle, 
  AlertTriangle, 
  Flag, 
  Calculator,
  Send,
  Clock,
  Calendar
} from 'lucide-react';
import { 
  formatCurrency, 
  calculateKPIs, 
  getFlaggedCostsCount, 
  getUnresolvedFlagsCount, 
  canCompleteTrip,
  formatDateTime
} from '../../utils/helpers';

interface TripDetailsProps {
  trip: Trip;
  onBack: () => void;
}

const TripDetails: React.FC<TripDetailsProps> = ({ trip, onBack }) => {
  const { addCostEntry, updateCostEntry, deleteCostEntry, updateTrip, addAdditionalCost, removeAdditionalCost, addDelayReason } = useAppContext();
  const [showCostForm, setShowCostForm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showSystemCostGenerator, setShowSystemCostGenerator] = useState(false);
  const [showInvoiceSubmission, setShowInvoiceSubmission] = useState(false);
  const [showTripPlanning, setShowTripPlanning] = useState(false);
  const [editingCost, setEditingCost] = useState<CostEntry | undefined>();

  // Enhanced handleAddCost with file support
  const handleAddCost = (costData: Omit<CostEntry, 'id' | 'attachments'>, files?: FileList) => {
    try {
      const costId = addCostEntry(costData, files);
      setShowCostForm(false);
      
      // Show success message with cost details
      alert(`Cost entry added successfully!\n\nCategory: ${costData.category}\nAmount: ${formatCurrency(costData.amount, costData.currency)}\nReference: ${costData.referenceNumber}`);
    } catch (error) {
      console.error('Error adding cost entry:', error);
      alert('Error adding cost entry. Please try again.');
    }
  };

  // Enhanced handleUpdateCost with file support
  const handleUpdateCost = (costData: Omit<CostEntry, 'id' | 'attachments'>, files?: FileList) => {
    if (editingCost) {
      try {
        // Process new files if provided
        const newAttachments = files ? Array.from(files).map((file, index) => ({
          id: `A${Date.now()}-${index}`,
          costEntryId: editingCost.id,
          filename: file.name,
          fileUrl: URL.createObjectURL(file),
          fileType: file.type,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          fileData: ''
        })) : [];

        const updatedCost: CostEntry = {
          ...editingCost,
          ...costData,
          attachments: [...editingCost.attachments, ...newAttachments]
        };

        updateCostEntry(updatedCost);
        setEditingCost(undefined);
        setShowCostForm(false);
        
        alert('Cost entry updated successfully!');
      } catch (error) {
        console.error('Error updating cost entry:', error);
        alert('Error updating cost entry. Please try again.');
      }
    }
  };

  const handleEditCost = (cost: CostEntry) => {
    setEditingCost(cost);
    setShowCostForm(true);
  };

  const handleDeleteCost = (id: string) => {
    if (confirm('Are you sure you want to delete this cost entry? This action cannot be undone.')) {
      try {
        deleteCostEntry(id);
        alert('Cost entry deleted successfully!');
      } catch (error) {
        console.error('Error deleting cost entry:', error);
        alert('Error deleting cost entry. Please try again.');
      }
    }
  };

  const handleGenerateSystemCosts = (systemCosts: Omit<CostEntry, 'id' | 'attachments'>[]) => {
    try {
      // Add each system cost entry individually
      for (const costData of systemCosts) {
        addCostEntry(costData);
      }
      
      setShowSystemCostGenerator(false);
      
      // Show detailed success message
      alert(`System costs generated successfully!\n\n${systemCosts.length} cost entries have been added:\n\n${systemCosts.map(cost => `• ${cost.subCategory}: ${formatCurrency(cost.amount, cost.currency)}`).join('\n')}\n\nTotal system costs: ${formatCurrency(systemCosts.reduce((sum, cost) => sum + cost.amount, 0), trip.revenueCurrency)}`);
    } catch (error) {
      console.error('Error generating system costs:', error);
      alert('Error generating system costs. Please try again.');
    }
  };

  const handleCompleteTrip = () => {
    const unresolvedFlags = getUnresolvedFlagsCount(trip.costs);
    
    if (unresolvedFlags > 0) {
      alert(`Cannot complete trip: ${unresolvedFlags} unresolved flagged items must be resolved before completing the trip.\n\nPlease go to the Flags & Investigations section to resolve all outstanding issues.`);
      return;
    }

    const confirmMessage = `Are you sure you want to mark this trip as COMPLETED?\n\n` +
      `This will:\n` +
      `• Lock the trip from further editing\n` +
      `• Move it to the Completed Trips section\n` +
      `• Make it available for invoicing\n\n` +
      `This action cannot be undone.`;

    if (confirm(confirmMessage)) {
      try {
        updateTrip({
          ...trip,
          status: 'completed',
          completedAt: new Date().toISOString().split('T')[0],
          completedBy: 'Current User' // In a real app, this would be the logged-in user
        });
        
        alert('Trip has been successfully completed and is now ready for invoicing.');
        onBack();
      } catch (error) {
        console.error('Error completing trip:', error);
        alert('Error completing trip. Please try again.');
      }
    }
  };

  // Handle invoice submission
  const handleInvoiceSubmission = (invoiceData: {
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
  }) => {
    try {
      // Create proof of delivery attachments
      const podAttachments = invoiceData.proofOfDelivery ? Array.from(invoiceData.proofOfDelivery).map((file, index) => ({
        id: `POD${Date.now()}-${index}`,
        tripId: trip.id,
        filename: file.name,
        fileUrl: URL.createObjectURL(file),
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        fileData: ''
      })) : [];

      // Create signed invoice attachments
      const invoiceAttachments = invoiceData.signedInvoice ? Array.from(invoiceData.signedInvoice).map((file, index) => ({
        id: `INV${Date.now()}-${index}`,
        tripId: trip.id,
        filename: file.name,
        fileUrl: URL.createObjectURL(file),
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        fileData: ''
      })) : [];

      const updatedTrip: Trip = {
        ...trip,
        status: 'invoiced',
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceDate: invoiceData.invoiceDate,
        invoiceDueDate: invoiceData.invoiceDueDate,
        invoiceSubmittedAt: new Date().toISOString(),
        invoiceSubmittedBy: 'Current User',
        invoiceValidationNotes: invoiceData.validationNotes,
        finalArrivalDateTime: invoiceData.finalTimeline.finalArrivalDateTime,
        finalOffloadDateTime: invoiceData.finalTimeline.finalOffloadDateTime,
        finalDepartureDateTime: invoiceData.finalTimeline.finalDepartureDateTime,
        timelineValidated: true,
        timelineValidatedBy: 'Current User',
        timelineValidatedAt: new Date().toISOString(),
        proofOfDelivery: podAttachments,
        signedInvoice: invoiceAttachments,
        paymentStatus: 'unpaid'
      };

      updateTrip(updatedTrip);
      setShowInvoiceSubmission(false);
      
      alert(`Trip successfully submitted for invoicing!\n\nInvoice Number: ${invoiceData.invoiceNumber}\nDue Date: ${invoiceData.invoiceDueDate}\n\nThe trip is now in the invoicing workflow and payment tracking has begun.`);
      onBack();
    } catch (error) {
      console.error('Error submitting invoice:', error);
      alert('Error submitting invoice. Please try again.');
    }
  };

  // Handle additional cost management
  const handleAddAdditionalCost = (cost: Omit<AdditionalCost, 'id'>, files?: FileList) => {
    try {
      addAdditionalCost(trip.id, cost, files);
    } catch (error) {
      console.error('Error adding additional cost:', error);
      alert('Error adding additional cost. Please try again.');
    }
  };

  const handleRemoveAdditionalCost = (costId: string) => {
    try {
      removeAdditionalCost(trip.id, costId);
    } catch (error) {
      console.error('Error removing additional cost:', error);
      alert('Error removing additional cost. Please try again.');
    }
  };

  const closeCostForm = () => {
    setShowCostForm(false);
    setEditingCost(undefined);
  };

  const kpis = calculateKPIs(trip);
  const flaggedCount = getFlaggedCostsCount(trip.costs);
  const unresolvedFlags = getUnresolvedFlagsCount(trip.costs);
  const canComplete = canCompleteTrip(trip);
  
  // Check if system costs have been generated
  const hasSystemCosts = trip.costs.some(cost => cost.isSystemGenerated);
  const systemCosts = trip.costs.filter(cost => cost.isSystemGenerated);
  const manualCosts = trip.costs.filter(cost => !cost.isSystemGenerated);

  // Calculate timeline discrepancies for display
  const hasTimelineDiscrepancies = () => {
    if (!trip.plannedArrivalDateTime || !trip.actualArrivalDateTime) return false;
    
    const planned = new Date(trip.plannedArrivalDateTime);
    const actual = new Date(trip.actualArrivalDateTime);
    const diffHours = Math.abs((actual.getTime() - planned.getTime()) / (1000 * 60 * 60));
    
    return diffHours > 1; // More than 1 hour difference
  };

  return (
    <div className="space-y-6">
      {/* Header with Navigation and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button variant="outline" onClick={onBack} icon={<ArrowLeft className="w-4 h-4" />}>
          Back to Trips
        </Button>
        
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={() => setShowReport(true)} 
            icon={<BarChart3 className="w-4 h-4" />}
          >
            View Report
          </Button>
          
          {trip.status === 'active' && (
            <>
              <Button 
                variant="outline"
                onClick={() => setShowTripPlanning(true)} 
                icon={<Calendar className="w-4 h-4" />}
              >
                Trip Planning
              </Button>

              {!hasSystemCosts && (
                <Button 
                  variant="outline"
                  onClick={() => setShowSystemCostGenerator(true)} 
                  icon={<Calculator className="w-4 h-4" />}
                >
                  Generate System Costs
                </Button>
              )}
              
              <Button 
                onClick={() => setShowCostForm(true)} 
                icon={<Plus className="w-4 h-4" />}
              >
                Add Cost Entry
              </Button>
              
              <Button 
                onClick={handleCompleteTrip}
                disabled={!canComplete}
                icon={<CheckCircle className="w-4 h-4" />}
                className={!canComplete ? 'opacity-50 cursor-not-allowed' : ''}
                title={!canComplete ? `Cannot complete: ${unresolvedFlags} unresolved flags` : 'Mark trip as completed'}
              >
                Complete Trip
              </Button>
            </>
          )}

          {trip.status === 'completed' && (
            <Button 
              onClick={() => setShowInvoiceSubmission(true)}
              icon={<Send className="w-4 h-4" />}
            >
              Submit for Invoicing
            </Button>
          )}
        </div>
      </div>

      {/* Status Alerts */}
      {trip.status === 'invoiced' && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md">
          <div className="flex items-start">
            <Send className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">
                Trip Invoiced - Payment Tracking Active
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Invoice #{trip.invoiceNumber} submitted on {formatDateTime(trip.invoiceSubmittedAt!)} by {trip.invoiceSubmittedBy}. 
                Due date: {trip.invoiceDueDate}. Payment status: {trip.paymentStatus.toUpperCase()}.
              </p>
              {trip.timelineValidated && (
                <p className="text-sm text-blue-600 mt-1">
                  ✓ Timeline validated on {formatDateTime(trip.timelineValidatedAt!)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Timeline Discrepancy Alert */}
      {hasTimelineDiscrepancies() && trip.status === 'active' && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-md">
          <div className="flex items-start">
            <Clock className="w-5 h-5 text-amber-600 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">
                Timeline Discrepancies Detected
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                Significant differences found between planned and actual times. Review timeline in Trip Planning section before completion.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Auto-completion notification */}
      {trip.autoCompletedAt && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-md">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-green-800">
                Trip Auto-Completed
              </h4>
              <p className="text-sm text-green-700 mt-1">
                This trip was automatically completed on {new Date(trip.autoCompletedAt).toLocaleDateString()} 
                because all investigations were resolved. Reason: {trip.autoCompletedReason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* System Costs Alert */}
      {trip.status === 'active' && !hasSystemCosts && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md">
          <div className="flex items-start">
            <Calculator className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">
                System Costs Not Generated
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Automatic operational overhead costs have not been applied to this trip. 
                Generate system costs to ensure accurate profitability assessment including per-kilometer and per-day fixed costs.
              </p>
              <div className="mt-2">
                <Button 
                  size="sm"
                  onClick={() => setShowSystemCostGenerator(true)} 
                  icon={<Calculator className="w-4 h-4" />}
                >
                  Generate System Costs Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Costs Summary */}
      {hasSystemCosts && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-md">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-green-800">
                System Costs Applied ({systemCosts.length} entries)
              </h4>
              <p className="text-sm text-green-700 mt-1">
                Automatic operational overhead costs have been applied: {formatCurrency(systemCosts.reduce((sum, cost) => sum + cost.amount, 0), trip.revenueCurrency)} total system costs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trip Status Alerts */}
      {trip.status === 'active' && unresolvedFlags > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-md">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">
                {unresolvedFlags} Unresolved Flag{unresolvedFlags !== 1 ? 's' : ''} - Trip Cannot Be Completed
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                All flagged cost entries must be investigated and resolved before this trip can be marked as completed. 
                Visit the <strong>Flags & Investigations</strong> section to resolve outstanding issues.
              </p>
              <div className="mt-2">
                <span className="text-xs text-amber-600">
                  Flagged items: {flaggedCount} total • {unresolvedFlags} unresolved • {flaggedCount - unresolvedFlags} resolved
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {trip.status === 'completed' && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-md">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-green-800">Trip Completed - Ready for Invoicing</h4>
              <p className="text-sm text-green-700">
                This trip was completed on {trip.completedAt} by {trip.completedBy}. 
                All cost entries are finalized and the trip is ready for invoice submission.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trip Summary with Enhanced KPIs */}
      <Card>
        <CardHeader 
          title={`Fleet ${trip.fleetNumber} - Trip Details`}
          subtitle={
            trip.status === 'completed' ? `Completed ${trip.completedAt}` : 
            trip.status === 'invoiced' ? `Invoiced ${trip.invoiceDate}` :
            'Active Trip'
          }
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Trip Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b pb-2">Trip Information</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Driver</p>
                  <p className="font-medium">{trip.driverName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="font-medium">{trip.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Client Type</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    trip.clientType === 'internal' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {trip.clientType === 'internal' ? 'Internal Client' : 'External Client'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Route</p>
                  <p className="font-medium">{trip.route}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{trip.startDate} to {trip.endDate}</p>
                </div>
                {trip.distanceKm && (
                  <div>
                    <p className="text-sm text-gray-500">Distance</p>
                    <p className="font-medium">{trip.distanceKm} km</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    trip.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    trip.status === 'invoiced' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {trip.status === 'completed' ? 'Completed' : 
                     trip.status === 'invoiced' ? 'Invoiced' : 'Active'}
                  </span>
                </div>
                {trip.description && (
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium text-gray-700">{trip.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b pb-2">Financial Summary</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Currency</p>
                  <p className="font-medium">{kpis.currency} ({kpis.currency === 'USD' ? '$' : 'R'})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Base Revenue</p>
                  <p className="font-medium text-green-600">{formatCurrency(kpis.totalRevenue, kpis.currency)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Costs</p>
                  <p className="font-medium text-red-600">{formatCurrency(kpis.totalExpenses, kpis.currency)}</p>
                  {hasSystemCosts && (
                    <div className="text-xs text-gray-500 mt-1">
                      Manual: {formatCurrency(manualCosts.reduce((sum, cost) => sum + cost.amount, 0), kpis.currency)} • 
                      System: {formatCurrency(systemCosts.reduce((sum, cost) => sum + cost.amount, 0), kpis.currency)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Net Profit/Loss</p>
                  <p className={`font-bold text-lg ${kpis.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(kpis.netProfit, kpis.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Profit Margin</p>
                  <p className={`font-medium ${kpis.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {kpis.profitMargin.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            {/* KPIs and Status */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b pb-2">Key Metrics & Status</h4>
              <div className="space-y-3">
                {kpis.costPerKm > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Cost per Kilometer</p>
                    <p className="font-medium">{formatCurrency(kpis.costPerKm, kpis.currency)}/km</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Cost Entries</p>
                  <p className="font-medium">{trip.costs.length} entries</p>
                  {hasSystemCosts && (
                    <div className="text-xs text-gray-500">
                      {manualCosts.length} manual • {systemCosts.length} system
                    </div>
                  )}
                </div>
                {flaggedCount > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Flagged Items</p>
                    <div className="flex items-center space-x-2">
                      <Flag className="w-4 h-4 text-amber-500" />
                      <span className="font-medium text-amber-600">
                        {flaggedCount} flagged
                      </span>
                      {unresolvedFlags > 0 && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          {unresolvedFlags} unresolved
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Documentation Status</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>With receipts:</span>
                      <span className="text-green-600 font-medium">
                        {trip.costs.filter(c => c.attachments.length > 0).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Missing receipts:</span>
                      <span className="text-red-600 font-medium">
                        {trip.costs.filter(c => c.attachments.length === 0).length}
                      </span>
                    </div>
                  </div>
                </div>
                {trip.status === 'active' && (
                  <div>
                    <p className="text-sm text-gray-500">Completion Status</p>
                    <p className={`font-medium ${canComplete ? 'text-green-600' : 'text-red-600'}`}>
                      {canComplete ? 'Ready to Complete' : 'Cannot Complete'}
                    </p>
                    {!canComplete && (
                      <p className="text-xs text-red-500 mt-1">
                        Resolve {unresolvedFlags} flag{unresolvedFlags !== 1 ? 's' : ''} first
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Entries Section */}
      <Card>
        <CardHeader
          title={`Cost Entries (${trip.costs.length})`}
          action={
            trip.status === 'active' && (
              <Button size="sm" onClick={() => setShowCostForm(true)} icon={<Plus className="w-4 h-4" />}>
                Add Cost Entry
              </Button>
            )
          }
        />
        <CardContent>
          <CostList 
            costs={trip.costs} 
            onEdit={trip.status === 'active' ? handleEditCost : undefined}
            onDelete={trip.status === 'active' ? handleDeleteCost : undefined}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      {trip.status === 'active' && (
        <>
          <Modal
            isOpen={showCostForm}
            onClose={closeCostForm}
            title={editingCost ? 'Edit Cost Entry' : 'Add Cost Entry'}
            maxWidth="lg"
          >
            <CostForm
              tripId={trip.id}
              cost={editingCost}
              onSubmit={editingCost ? handleUpdateCost : handleAddCost}
              onCancel={closeCostForm}
            />
          </Modal>

          <Modal
            isOpen={showSystemCostGenerator}
            onClose={() => setShowSystemCostGenerator(false)}
            title="Generate System Costs"
            maxWidth="2xl"
          >
            <SystemCostGenerator
              trip={trip}
              onGenerateSystemCosts={handleGenerateSystemCosts}
            />
          </Modal>

          <Modal
            isOpen={showTripPlanning}
            onClose={() => setShowTripPlanning(false)}
            title="Trip Planning & Timeline"
            maxWidth="2xl"
          >
            <TripPlanningForm
              trip={trip}
              onUpdate={updateTrip}
              onAddDelay={(delay) => addDelayReason(trip.id, delay)}
            />
          </Modal>
        </>
      )}

      {trip.status === 'completed' && (
        <InvoiceSubmissionModal
          isOpen={showInvoiceSubmission}
          trip={trip}
          onClose={() => setShowInvoiceSubmission(false)}
          onSubmit={handleInvoiceSubmission}
          onAddAdditionalCost={handleAddAdditionalCost}
          onRemoveAdditionalCost={handleRemoveAdditionalCost}
        />
      )}

      <Modal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        title="Trip Report"
        maxWidth="2xl"
      >
        <TripReport trip={trip} />
      </Modal>
    </div>
  );
};

export default TripDetails;