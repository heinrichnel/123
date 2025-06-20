<<<<<<< HEAD
// ─── React & State ───────────────────────────────────────────────
import React, { useState, useEffect } from 'react';

// ─── Types ───────────────────────────────────────────────────────
import { Trip, CostEntry, AdditionalCost } from '../../types';

// ─── Context ─────────────────────────────────────────────────────
import { useAppContext } from '../../context/AppContext';

// ─── UI Components ───────────────────────────────────────────────
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card, { CardContent, CardHeader } from '../ui/Card';
import { Input, Select, TextArea } from '../ui/FormElements';
import FileUpload from '../ui/FileUpload';

// ─── Custom Modules ──────────────────────────────────────────────
import CostForm from '../costs/CostForm';
import CostList from '../costs/CostList';
import SystemCostGenerator from '../costs/IndirectCost';
import TripReport from '../reports/TripReport';
import InvoiceSubmissionModal from './InvoiceSubmissionModal';

// ─── Helpers ─────────────────────────────────────────────────────
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  calculateTotalCosts,
  calculateKPIs,
  getFileIcon,
  getFlaggedCostsCount,
  getUnresolvedFlagsCount,
  canCompleteTrip
} from '../../utils/helpers';

// ─── Icons ───────────────────────────────────────────────────────
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bell,
  Building,
  Calendar,
  Calculator,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  FileText,
  FileUp,
  FileX,
  Flag,
  History,
  Image,
  Lock,
  MapPin,
  Navigation,
  Paperclip,
  Plus,
  Save,
  Send,
  Shield,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  User,
  X
} from 'lucide-react';

=======
import React from 'react';
import { User, Bell, Settings } from 'lucide-react';
import Button from '../ui/Button.tsx';

interface HeaderProps {
  title?: string;
  userName?: string;
  onProfileClick?: () => void;
  onNotificationsClick?: () => void;
  onSettingsClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, userName, onProfileClick, onNotificationsClick, onSettingsClick }) => {
  return (
    <header className="flex justify-between items-center p-4 bg-gray-800 text-white">
      <h1>{title}</h1>
      <div className="flex items-center space-x-4">
        <Button onClick={onProfileClick}><User /></Button>
        <Button onClick={onNotificationsClick}><Bell /></Button>
        <Button onClick={onSettingsClick}><Settings /></Button>
      </div>
    </header>
  );
};

export default Header;import React, { useState } from 'react';
import { Trip, CostEntry, AdditionalCost } from '../../types/index.js';
import { useAppContext } from '../../context/AppContext.js';
import Card, { CardContent, CardHeader } from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import Modal from '../ui/Modal.tsx';
import CostForm from '../costs/CostForm.tsx';
import CostList from '../costs/CostList.tsx';
import TripReport from '../reports/TripReport.tsx';
import SystemCostGenerator from '../costs/IndirectCost'; // ✅ CORRECT
import InvoiceSubmissionModal from './InvoiceSubmissionModal.tsx';
import TripPlanningForm from '../planning/TripPlanningForm.tsx';
import { Trash2, Edit, Save, X, AlertTriangle, FileText, FileSpreadsheet, Calendar, DollarSign, Flag, CheckCircle, Eye, Download, Lock, Clock, Navigation, Building, User, MapPin, TrendingUp, TrendingDown, FileUp, FileX, Plus, Upload, Paperclip, Image, History, Bell, Shield, Send, Calculator, ArrowLeft, BarChart3 } from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime, calculateTotalCosts, getFileIcon, calculateKPIs, getFlaggedCostsCount, getUnresolvedFlagsCount, canCompleteTrip } from '../../utils/helpers.ts';
>>>>>>> 26992b5f0a3b081be38f1bd0501c447ccf1bbf89

interface TripDetailsProps {
  trip: Trip;
  onBack: () => void;
}

const TripDetails: React.FC<TripDetailsProps> = ({ trip, onBack }) => {
  const { addCostEntry, updateCostEntry, deleteCostEntry, updateTrip, addAdditionalCost, removeAdditionalCost } = useAppContext();
  const [showCostForm, setShowCostForm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showSystemCostGenerator, setShowSystemCostGenerator] = useState(false);
  const [showInvoiceSubmission, setShowInvoiceSubmission] = useState(false);
  const [editingCost, setEditingCost] = useState<CostEntry | undefined>();
  const [costEntries, setCostEntries] = useState<CostEntry[]>([]);
  const [viewingAttachment, setViewingAttachment] = useState<{url: string, filename: string} | null>(null);

  // Ensure trip has costs array
  if (!trip.costs) {
    trip.costs = [];
  }

  // Update local cost entries when trip changes
  useEffect(() => {
    setCostEntries(trip.costs || []);
  }, [trip]);

  // Enhanced handleAddCost with file support
  const handleAddCost = async (costData: Omit<CostEntry, "id" | "attachments">, files?: FileList) => {
    try {
      const costId = await addCostEntry(trip.id, costData, files);
      setShowCostForm(false);
      
      // Add the new cost to local state immediately
      const newCost: CostEntry = {
        ...costData,
        id: costId,
        attachments: files ? Array.from(files).map((file, index) => ({
          id: `A${Date.now()}-${index}`,
          costEntryId: costId,
          filename: file.name,
          fileUrl: URL.createObjectURL(file),
          fileType: file.type,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          fileData: ""
        })) : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setCostEntries(prev => [...prev, newCost]);
      
      // Show success message with cost details
      alert(`Cost entry added successfully!\n\nCategory: ${costData.category}\nAmount: ${formatCurrency(costData.amount, costData.currency)}\nReference: ${costData.referenceNumber}`);
    } catch (error) {
      console.error('Error adding cost entry:', error);
      alert('Error adding cost entry. Please try again.');
    }
  };

  // Enhanced handleUpdateCost with file support
  const handleUpdateCost = async (costData: Omit<CostEntry, "id" | "attachments">, files?: FileList) => {
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

        await updateCostEntry(updatedCost);
        
        // Update local state immediately
        setCostEntries(prev => prev.map(cost => 
          cost.id === updatedCost.id ? updatedCost : cost
        ));
        
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

  const handleDeleteCost = async (id: string) => {
    if (confirm('Are you sure you want to delete this cost entry? This action cannot be undone.')) {
      try {
        await deleteCostEntry(id);
        
        // Update local state immediately
        setCostEntries(prev => prev.filter(cost => cost.id !== id));
        
        alert('Cost entry deleted successfully!');
      } catch (error) {
        console.error('Error deleting cost entry:', error);
        alert('Error deleting cost entry. Please try again.');
      }
    }
  };

  const handleGenerateSystemCosts = async (systemCosts: Omit<CostEntry, 'id' | 'attachments'>[]) => {
    try {
      const newCosts: CostEntry[] = [];
      
      // Add each system cost entry individually
      for (const costData of systemCosts) {
        const costId = await addCostEntry(trip.id, costData);
        
        // Create a complete cost entry for local state
        const newCost: CostEntry = {
          ...costData,
          id: costId,
          attachments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        newCosts.push(newCost);
      }
      
      // Update local state with all new costs
      setCostEntries(prev => [...prev, ...newCosts]);
      
      // Update the trip in the database to ensure system costs are saved
      const updatedTrip = {
        ...trip,
        costs: [...trip.costs, ...newCosts]
      };
      await updateTrip(updatedTrip);
      
      setShowSystemCostGenerator(false);
      
      // Show detailed success message
      alert(`System costs generated successfully!\n\n${systemCosts.length} cost entries have been added:\n\n${systemCosts.map(cost => `• ${cost.subCategory}: ${formatCurrency(cost.amount, cost.currency)}`).join('\n')}\n\nTotal system costs: ${formatCurrency(systemCosts.reduce((sum, cost) => sum + cost.amount, 0), trip.revenueCurrency)}`);
    } catch (error) {
      console.error('Error generating system costs:', error);
      alert('Error generating system costs. Please try again.');
    }
  };

  const handleCompleteTrip = () => {
    try {
      const updatedTrip = {
        ...trip,
        costs: costEntries,
        status: 'completed' as const,
        completedAt: new Date().toISOString(),
        completedBy: 'Current User' // In a real app, this would be the logged-in user
      };
      
      updateTrip(updatedTrip);
      
      alert('Trip has been successfully completed and is now ready for invoicing.');
      onBack();
    } catch (error) {
      console.error('Error completing trip:', error);
      alert('Error completing trip. Please try again.');
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
        costs: costEntries,
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

  // Handle viewing attachment
  const handleViewAttachment = (url: string, filename: string) => {
    setViewingAttachment({ url, filename });
  };

  const kpis = calculateKPIs(trip);
  const flaggedCount = getFlaggedCostsCount(costEntries);
  const unresolvedFlags = getUnresolvedFlagsCount(costEntries);
  
  // Check if system costs have been generated
  const hasSystemCosts = costEntries.some(cost => cost.isSystemGenerated);
  const systemCosts = costEntries.filter(cost => cost.isSystemGenerated);
  const manualCosts = costEntries.filter(cost => !cost.isSystemGenerated);

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
                icon={<CheckCircle className="w-4 h-4" />}
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
                Due date: {trip.invoiceDueDate}. Payment status: {trip.paymentStatus?.toUpperCase() || 'UNPAID'}.
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
                This trip was completed on {formatDate(trip.completedAt || '')} by {trip.completedBy}. 
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
            trip.status === 'completed' ? `Completed ${formatDate(trip.completedAt || '')}` : 
            trip.status === 'invoiced' ? `Invoiced ${formatDate(trip.invoiceDate || '')}` :
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
                {trip.tripDescription && (
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium text-gray-700">{trip.tripDescription}</p>
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
                  <p className="font-medium">{costEntries.length} entries</p>
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
                        {costEntries.filter(c => c.attachments && c.attachments.length > 0).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Missing receipts:</span>
                      <span className="text-red-600 font-medium">
                        {costEntries.filter(c => !c.attachments || c.attachments.length === 0).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Entries Section */}
      <Card>
        <CardHeader
          title={`Cost Entries (${costEntries.length})`}
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
            costs={costEntries} 
            onEdit={trip.status === 'active' ? handleEditCost : undefined}
            onDelete={trip.status === 'active' ? handleDeleteCost : undefined}
            onViewAttachment={handleViewAttachment}
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
        <TripReport trip={{...trip, costs: costEntries}} />
      </Modal>

      {/* Attachment Viewer Modal */}
      <Modal
        isOpen={!!viewingAttachment}
        onClose={() => setViewingAttachment(null)}
        title={viewingAttachment?.filename || "View Attachment"}
        maxWidth="2xl"
      >
        {viewingAttachment && (
          <div className="flex flex-col items-center space-y-4">
            {viewingAttachment.url.includes('.pdf') ? (
              <iframe 
                src={viewingAttachment.url} 
                className="w-full h-[70vh]" 
                title={viewingAttachment.filename}
              />
            ) : viewingAttachment.url.includes('image') ? (
              <img 
                src={viewingAttachment.url} 
                alt={viewingAttachment.filename} 
                className="max-w-full max-h-[70vh] object-contain"
              />
            ) : (
              <div className="text-center p-8 bg-gray-100 rounded-lg">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700">{viewingAttachment.filename}</p>
                <p className="text-sm text-gray-500 mt-2">This file type cannot be previewed directly.</p>
                <Button 
                  className="mt-4"
                  onClick={() => window.open(viewingAttachment.url, '_blank')}
                >
                  Download File
                </Button>
              </div>
            )}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => window.open(viewingAttachment.url, '_blank')}
                icon={<Download className="w-4 h-4" />}
              >
                Download
              </Button>
              <Button
                variant="outline"
                onClick={() => setViewingAttachment(null)}
                icon={<X className="w-4 h-4" />}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TripDetails;