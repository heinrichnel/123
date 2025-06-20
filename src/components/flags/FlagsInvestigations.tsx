// ─── React ───────────────────────────────────────────────────────
import React, { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────
import { Trip, FlaggedCost } from '../../types';

// ─── Context ─────────────────────────────────────────────────────
import { useAppContext } from '../../context/AppContext';

// ─── UI Components ───────────────────────────────────────────────
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { Input, Select } from '../ui/FormElements';
import FlagResolutionModal from './FlagResolutionModal';

// ─── Icons ───────────────────────────────────────────────────────
import {
  AlertTriangle,
  Eye,
  CheckCircle,
  Clock,
  Play,
  Flag,
  Upload,
  Edit
} from 'lucide-react';

// ─── Utilities ───────────────────────────────────────────────────
import { formatCurrency, formatDate, getAllFlaggedCosts } from '../../utils/helpers';


interface FlagsInvestigationsProps {
  trips: Trip[];
}

const FlagsInvestigations: React.FC<FlagsInvestigationsProps> = ({ trips }) => {
  const { updateCostEntry, completeTrip } = useAppContext();
  const [selectedCost, setSelectedCost] = useState<FlaggedCost | null>(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [driverFilter, setDriverFilter] = useState<string>('');

  const flaggedCosts = getAllFlaggedCosts(trips);

  const filteredCosts = flaggedCosts.filter(cost => {
    if (statusFilter && cost.investigationStatus !== statusFilter) return false;
    if (driverFilter && !trips.find(t => t.id === cost.tripId)?.driverName.includes(driverFilter)) return false;
    return true;
  });

  const handleResolveFlag = (updatedCost: CostEntry, resolutionComment: string) => {
    updateCostEntry(updatedCost);
    setShowResolutionModal(false);
    setSelectedCost(null);

    alert(`Flag resolved successfully!\n\nResolution: ${resolutionComment}\n\nThe cost entry has been updated and marked as resolved.`);

    // Check if all flags for the trip are resolved - if yes, mark trip as completed
    const unresolvedFlagsForTrip = flaggedCosts.filter(c => c.tripId === updatedCost.tripId && c.investigationStatus !== 'resolved');

    if (unresolvedFlagsForTrip.length === 0) {
      completeTrip(updatedCost.tripId);
      alert(`All flags for Trip ${updatedCost.tripFleetNumber} are resolved. Trip marked as completed.`);
    }
  };

  const handleOpenResolution = (cost: FlaggedCost) => {
    setSelectedCost(cost);
    setShowResolutionModal(true);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'in-progress':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'in-progress':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'resolved':
        return 'bg-green-50 text-green-800 border-green-200';
      default:
        return 'bg-red-50 text-red-800 border-red-200';
    }
  };

  const statusCounts = {
    pending: flaggedCosts.filter(c => c.investigationStatus === 'pending').length,
    'in-progress': flaggedCosts.filter(c => c.investigationStatus === 'in-progress').length,
    resolved: flaggedCosts.filter(c => c.investigationStatus === 'resolved').length,
    total: flaggedCosts.length
  };

  const uniqueDrivers = [...new Set(trips.map(trip => trip.driverName))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Flags & Investigations</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Flag className="w-4 h-4" />
            <span>{statusCounts.total} total flags</span>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{statusCounts['in-progress']}</p>
              </div>
              <Play className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Flags</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.total}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader title="Filter Flagged Items" />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Investigation Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Pending', value: 'pending' },
                { label: 'In Progress', value: 'in-progress' },
                { label: 'Resolved', value: 'resolved' }
              ]}
            />
            <Select
              label="Driver"
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              options={[
                { label: 'All Drivers', value: '' },
                ...uniqueDrivers.map(d => ({ label: d, value: d }))
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Flagged Costs List */}
      {filteredCosts.length === 0 ? (
        <div className="text-center py-12">
          <Flag className="mx-auto h-10 w-10 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No flagged items</h3>
          <p className="mt-1 text-sm text-gray-500">
            {statusFilter || driverFilter ? 'No items match your current filters.' : 'All cost entries are properly documented.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCosts.map((cost) => {
            const trip = trips.find(t => t.id === cost.tripId);
            const canResolve = cost.investigationStatus !== 'resolved';

            return (
              <Card key={cost.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(cost.investigationStatus)}
                        <h4 className="font-medium text-gray-900">{cost.category}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(cost.investigationStatus)}`}>
                          {cost.investigationStatus || 'pending'}
                        </span>
                        {cost.investigationStatus === 'resolved' && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            ✓ RESOLVED
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-500">Trip</p>
                          <p className="font-medium">Fleet {cost.tripFleetNumber}</p>
                          <p className="text-sm text-gray-600">{cost.tripRoute}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Driver</p>
                          <p className="font-medium">{trip?.driverName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Amount</p>
                          <p className="font-medium">{formatCurrency(cost.amount, cost.currency)}</p>
                          <p className="text-sm text-gray-600">{formatDate(cost.date)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Reference</p>
                          <p className="font-medium">{cost.referenceNumber}</p>
                        </div>
                      </div>

                      {cost.flagReason && (
                        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm font-medium text-red-800">Flag Reason:</p>
                          <p className="text-sm text-red-700">{cost.flagReason}</p>
                        </div>
                      )}

                      {cost.noDocumentReason && (
                        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded">
                          <p className="text-sm font-medium text-amber-800">Missing Document Reason:</p>
                          <p className="text-sm text-amber-700">{cost.noDocumentReason}</p>
                        </div>
                      )}

                      {cost.investigationNotes && (
                        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm font-medium text-blue-800">Investigation Notes:</p>
                          <p className="text-sm text-blue-700">{cost.investigationNotes}</p>
                        </div>
                      )}

                      {/* Attachments Status */}
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 mb-1">Documentation Status</p>
                        {cost.attachments.length > 0 ? (
                          <div className="flex items-center space-x-2">
                            <Upload className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-700 font-medium">
                              {cost.attachments.length} document(s) attached
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-700 font-medium">
                              No documents attached
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end space-x-2">
                        {canResolve ? (
                          <Button size="sm" onClick={() => handleOpenResolution(cost)} icon={<Edit className="w-3 h-3" />}>
                            Resolve Flag
                          </Button>
                        ) : (
                          <div className="flex items-center space-x-2 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Resolved on {cost.resolvedAt ? formatDate(cost.resolvedAt) : 'Unknown'}</span>
                            {cost.resolvedBy && <span>by {cost.resolvedBy}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Flag Resolution Modal */}
      <FlagResolutionModal
        isOpen={showResolutionModal}
        cost={selectedCost}
        onClose={() => {
          setShowResolutionModal(false);
          setSelectedCost(null);
        }}
        onResolve={handleResolveFlag}
      />
    </div>
  );
};

export default FlagsInvestigations;
