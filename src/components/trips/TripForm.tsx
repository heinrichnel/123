import React, { useState } from 'react';
import { Trip, CostEntry, AdditionalCost, SystemCostRates, DEFAULT_SYSTEM_COST_RATES } from '../../types/index.js';
import { useAppContext } from '../../context/AppContext.js';
import Card, { CardContent, CardHeader } from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import Modal from '../ui/Modal.tsx';
import CostForm from '../costs/CostForm.tsx';
import CostList from '../costs/CostList.tsx';
import TripReport from '../reports/TripReport.tsx';
import InvoiceSubmissionModal from './InvoiceSubmissionModal.tsx';
import TripPlanningForm from '../planning/TripPlanningForm.tsx';
import {
  Trash2, Edit, Save, X, AlertTriangle, FileText, FileSpreadsheet, Calendar, DollarSign, Flag, CheckCircle, Eye, Download, Lock, Clock, Navigation, Building, User, MapPin, TrendingUp, TrendingDown, FileUp, FileX, Plus, Upload, Paperclip, Image, History, Bell, Shield, Send, Calculator, ArrowLeft, BarChart3
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime, calculateTotalCosts, getFileIcon, calculateKPIs, getFlaggedCostsCount, getUnresolvedFlagsCount, canCompleteTrip } from '../../utils/helpers.ts';

interface TripDetailsProps {
  trip: Trip;
  onBack: () => void;
}

const TripDetails: React.FC<TripDetailsProps> = ({ trip, onBack }) => {
  const {
    addCostEntry,
    updateCostEntry,
    deleteCostEntry,
    updateTrip,
    addAdditionalCost,
    removeAdditionalCost,
    addDelayReason,
    // If you have a way to get system cost rates, use your own context/hook here.
    // Otherwise, use DEFAULT_SYSTEM_COST_RATES as fallback.
  } = useAppContext();

  const [showCostForm, setShowCostForm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showInvoiceSubmission, setShowInvoiceSubmission] = useState(false);
  const [showTripPlanning, setShowTripPlanning] = useState(false);
  const [editingCost, setEditingCost] = useState<CostEntry | undefined>();

  // System Cost Generation—directly in this file!
  const handleGenerateSystemCosts = () => {
    if (!trip) return;
    if (!trip.distanceKm || !trip.startDate || !trip.endDate) {
      alert('Cannot generate system costs: Please ensure trip distance and dates are set.');
      return;
    }

    // Replace this with your logic to fetch current rates (from context/store, etc)
    const systemRates: SystemCostRates = DEFAULT_SYSTEM_COST_RATES[trip.revenueCurrency];

    const tripStart = new Date(trip.startDate);
    const tripEnd = new Date(trip.endDate);
    const days = Math.max(1, Math.ceil((+tripEnd - +tripStart) / (1000 * 60 * 60 * 24)));

    // Generate per-km costs
    const perKmEntries = [
      {
        category: 'system',
        subCategory: 'Repair & Maintenance (per km)',
        amount: trip.distanceKm * systemRates.perKmCosts.repairMaintenance,
        currency: trip.revenueCurrency,
        isSystemGenerated: true,
      },
      {
        category: 'system',
        subCategory: 'Tyre Cost (per km)',
        amount: trip.distanceKm * systemRates.perKmCosts.tyreCost,
        currency: trip.revenueCurrency,
        isSystemGenerated: true,
      },
    ];

    // Generate per-day costs
    const perDayEntries = Object.entries(systemRates.perDayCosts).map(([key, value]) => ({
      category: 'system',
      subCategory: `${key.replace(/([A-Z])/g, ' $1').trim()} (per day)`,
      amount: days * value,
      currency: trip.revenueCurrency,
      isSystemGenerated: true,
    }));

    // Combine all system costs
    const allEntries = [...perKmEntries, ...perDayEntries];

    // Confirm with user
    if (!window.confirm(`Generate system costs for this trip? This will add ${allEntries.length} system cost entries and cannot be undone.`)) return;

    // Add each cost entry
    for (const entry of allEntries) {
      addCostEntry(entry);
    }
    alert('System costs generated and added to this trip.');
  };

  const handleAddCost = (costData: Omit<CostEntry, 'id' | 'attachments'>, files?: FileList) => {
    try {
      const costId = addCostEntry(costData, files);
      setShowCostForm(false);
      alert(`Cost entry added successfully!\n\nCategory: ${costData.category}\nAmount: ${formatCurrency(costData.amount, costData.currency)}\nReference: ${costData.referenceNumber}`);
    } catch (error) {
      console.error('Error adding cost entry:', error);
      alert('Error adding cost entry. Please try again.');
    }
  };

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

  const handleInvoiceSubmission = (invoiceData: any) => {
    // ... your existing logic unchanged ...
  };

  // Additional cost management (unchanged)
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
      {/* ... other UI blocks unchanged ... */}

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

              {/* GENERATE SYSTEM COSTS BUTTON (NOW INLINED) */}
              {!hasSystemCosts && (
                <Button
                  variant="outline"
                  onClick={handleGenerateSystemCosts}
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

      {/* ...rest of your alerts and summary blocks unchanged... */}

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
