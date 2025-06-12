import React, { useState } from 'react';
import { Trip } from '../../types';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import SyncIndicator from '../ui/SyncIndicator';
import {
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { formatCurrency, calculateTotalCosts, getFlaggedCostsCount } from '../../utils/helpers';
import LoadImportModal from '../trips/LoadImportModal';

interface ActiveTripsProps {
  trips: Trip[];
  onEdit: (trip: Trip) => void;
  onDelete: (id: string) => void;
  onView: (trip: Trip) => void;
}

const ActiveTrips: React.FC<ActiveTripsProps> = ({ trips, onEdit, onDelete, onView }) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const openImportModal = () => setIsImportModalOpen(true);
  const closeImportModal = () => setIsImportModalOpen(false);

  const handleEdit = (trip: Trip) => {
    console.log('Editing trip:', trip);
    onEdit(trip);
  };

  const handleDelete = (id: string) => {
    const trip = trips.find(t => t.id === id);
    if (trip && confirm(`Delete trip for fleet ${trip.fleetNumber}? This cannot be undone.`)) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Active Trips</h2>
          <div className="flex items-center mt-1">
            <p className="text-gray-500 mr-3">{trips.length} active trip{trips.length !== 1 ? 's' : ''}</p>
            <SyncIndicator />
          </div>
        </div>
        <Button
          icon={<Upload className="w-4 h-4" />}
          onClick={openImportModal}
        >
          Import Trips
        </Button>
      </div>

      {trips.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No active trips found</h3>
          <p className="text-gray-500">
            Create your first trip or import data to start tracking.
          </p>
          <Button
            icon={<Upload className="w-4 h-4" />}
            onClick={openImportModal}
            className="mt-4"
          >
            Import Trips
          </Button>
        </div>
      )}

      <div className="grid gap-4">
        {trips.map((trip) => {
          const currency = trip.revenueCurrency;
          const totalCosts = calculateTotalCosts(trip.costs);
          const profit = (trip.baseRevenue || 0) - totalCosts;
          const flaggedCount = getFlaggedCostsCount(trip.costs);

          return (
            <Card key={trip.id} className="hover:shadow-md transition-shadow">
              <CardHeader
                title={`Fleet ${trip.fleetNumber} - ${trip.route}`}
                subtitle={`${trip.clientName} • ${trip.startDate} to ${trip.endDate}`}
              />
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Driver</p>
                    <p className="font-medium">{trip.driverName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Revenue</p>
                    <p className="font-medium text-green-600">
                      {formatCurrency(trip.baseRevenue || 0, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Costs</p>
                    <p className="font-medium text-red-600">
                      {formatCurrency(totalCosts, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Net Profit</p>
                    <p className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(profit, currency)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">
                      {trip.costs.length} cost entries
                      {trip.distanceKm && ` • ${trip.distanceKm} km`}
                    </div>
                    {flaggedCount > 0 && (
                      <div className="flex items-center space-x-1 text-amber-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">{flaggedCount} flagged</span>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onView(trip)}
                      icon={<Eye className="w-3 h-3" />}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(trip)}
                      icon={<Edit className="w-3 h-3" />}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(trip.id)}
                      icon={<Trash2 className="w-3 h-3" />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <LoadImportModal isOpen={isImportModalOpen} onClose={closeImportModal} />
    </div>
  );
};

export default ActiveTrips;