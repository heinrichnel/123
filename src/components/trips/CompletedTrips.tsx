// ─── React & Context ─────────────────────────────────────────────
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

// ─── Types ───────────────────────────────────────────────────────
import { Trip, TripDeletionRecord } from '../../types';

// ─── UI Components ───────────────────────────────────────────────
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { Input, Select } from '../ui/FormElements';
import SyncIndicator from '../ui/SyncIndicator';

// ─── Feature Components ──────────────────────────────────────────
import CompletedTripEditModal from './CompletedTripEditModal';
import TripDeletionModal from './TripDeletionModal';

// ─── Icons ───────────────────────────────────────────────────────
import {
  Edit,
  Trash2,
  FileSpreadsheet,
  Eye,
  History,
  AlertTriangle,
  User,
  Calendar,
  Download
} from 'lucide-react';

// ─── Helper Functions ────────────────────────────────────────────
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  calculateTotalCosts,
  downloadTripExcel,
  downloadTripPDF
} from '../../utils/helpers';


interface CompletedTripsProps {
  trips: Trip[];
  onView: (trip: Trip) => void;
}

const CompletedTrips: React.FC<CompletedTripsProps> = ({ trips, onView }) => {
  const { updateTrip, deleteTrip, connectionStatus } = useAppContext();
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    client: '',
    driver: '',
    currency: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [deletingTrip, setDeletingTrip] = useState<Trip | null>(null);
  const [showEditHistory, setShowEditHistory] = useState<string | null>(null);

  const userRole: 'admin' | 'manager' | 'operator' = 'admin';

  const filteredTrips = trips.filter(trip => {
    if (filters.startDate && trip.startDate < filters.startDate) return false;
    if (filters.endDate && trip.endDate > filters.endDate) return false;
    if (filters.client && trip.clientName !== filters.client) return false;
    if (filters.driver && trip.driverName !== filters.driver) return false;
    if (filters.currency && trip.revenueCurrency !== filters.currency) return false;
    return true;
  });

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      client: '',
      driver: '',
      currency: ''
    });
  };

  const handleEditSave = (updatedTrip: Trip) => {
    updateTrip(updatedTrip);
    setEditingTrip(null);
    alert('Trip updated successfully. Edit logged.');
  };

  const handleDelete = (trip: Trip, deletionRecord: Omit<TripDeletionRecord, 'id'>) => {
    deleteTrip(trip.id);
    setDeletingTrip(null);
    alert('Trip deleted successfully. Deletion logged.');
  };

  const uniqueClients = [...new Set(trips.map(t => t.clientName))];
  const uniqueDrivers = [...new Set(trips.map(t => t.driverName))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Completed Trips</h2>
          <div className="flex items-center mt-1">
            <p className="text-gray-500 mr-3">
              {filteredTrips.length} trip{filteredTrips.length !== 1 ? 's' : ''}
            </p>
            <SyncIndicator />
          </div>
        </div>
        <div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            icon={<History className="w-4 h-4" />}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardHeader title="Filter Completed Trips" />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={e => handleFilterChange('startDate', e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={e => handleFilterChange('endDate', e.target.value)}
              />
              <Select
                label="Client"
                value={filters.client}
                onChange={e => handleFilterChange('client', e.target.value)}
                options={[
                  { label: 'All Clients', value: '' },
                  ...uniqueClients.map(c => ({ label: c, value: c }))
                ]}
              />
              <Select
                label="Driver"
                value={filters.driver}
                onChange={e => handleFilterChange('driver', e.target.value)}
                options={[
                  { label: 'All Drivers', value: '' },
                  ...uniqueDrivers.map(d => ({ label: d, value: d }))
                ]}
              />
              <Select
                label="Currency"
                value={filters.currency}
                onChange={e => handleFilterChange('currency', e.target.value)}
                options={[
                  { label: 'All Currencies', value: '' },
                  { label: 'ZAR (R)', value: 'ZAR' },
                  { label: 'USD ($)', value: 'USD' }
                ]}
              />
            </div>
            <div className="mt-4 text-right">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {connectionStatus !== 'connected' && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">Offline Mode</h4>
              <p className="text-sm text-amber-700">
                You are currently offline. Changes will sync when back online.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {filteredTrips.map(trip => {
          const currency = trip.revenueCurrency;
          const totalCosts = calculateTotalCosts(trip.costs);
          const profit = (trip.baseRevenue || 0) - totalCosts;
          const hasEdits = trip.editHistory && trip.editHistory.length > 0;

          return (
            <Card key={trip.id}>
              <CardHeader
                title={`Fleet ${trip.fleetNumber} - ${trip.route}`}
                subtitle={
                  <div className="text-sm text-gray-500 flex space-x-2">
                    <span>{trip.clientName}</span>
                    <span>• {formatDate(trip.completedAt || trip.endDate)}</span>
                    {hasEdits && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs">
                        <History className="w-3 h-3 mr-1" />
                        Edited
                      </span>
                    )}
                  </div>
                }
              />
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-500">Driver</p>
                    <p className="font-medium">{trip.driverName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Dates</p>
                    <p className="font-medium">
                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                    </p>
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
                    <p className="text-sm text-gray-500">Profit</p>
                    <p className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(profit, currency)}
                    </p>
                  </div>
                </div>

                {hasEdits && showEditHistory === trip.id && (
                  <div className="mb-3 space-y-2 max-h-40 overflow-y-auto bg-amber-50 border border-amber-200 p-3 rounded">
                    {trip.editHistory.map((edit, index) => (
                      <div key={index} className="text-sm bg-white p-2 rounded border">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">
                              {edit.fieldChanged}: {edit.oldValue} → {edit.newValue}
                            </p>
                            <p className="text-gray-600">Reason: {edit.reason}</p>
                          </div>
                          <div className="text-xs text-gray-500 text-right">
                            <p>{edit.editedBy}</p>
                            <p>{formatDateTime(edit.editedAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {hasEdits && (
                  <Button
                    size="xs"
                    variant="outline"
                    icon={<History className="w-3 h-3" />}
                    onClick={() =>
                      setShowEditHistory(prev => (prev === trip.id ? null : trip.id))
                    }
                  >
                    {showEditHistory === trip.id ? 'Hide History' : 'View History'}
                  </Button>
                )}

                <div className="mt-4 flex justify-between">
                  <div className="text-sm text-gray-500">
                    {trip.costs.length} cost entries
                    {trip.distanceKm && ` • ${trip.distanceKm} km`}
                    {trip.completedBy && ` • Completed by ${trip.completedBy}`}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" icon={<Eye />} onClick={() => onView(trip)}>
                      View
                    </Button>
                    <Button size="sm" variant="outline" icon={<FileSpreadsheet />} onClick={() => downloadTripExcel(trip)}>
                      Excel
                    </Button>
                    <Button size="sm" variant="outline" icon={<Download />} onClick={() => downloadTripPDF(trip)}>
                      PDF
                    </Button>
                    <Button size="sm" variant="outline" icon={<Edit />} onClick={() => setEditingTrip(trip)}>
                      Edit
                    </Button>
                    {userRole === 'admin' && (
                      <Button size="sm" variant="danger" icon={<Trash2 />} onClick={() => setDeletingTrip(trip)}>
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editingTrip && (
        <CompletedTripEditModal
          isOpen={!!editingTrip}
          trip={editingTrip}
          onClose={() => setEditingTrip(null)}
          onSave={handleEditSave}
        />
      )}

      {deletingTrip && (
        <TripDeletionModal
          isOpen={!!deletingTrip}
          trip={deletingTrip}
          onClose={() => setDeletingTrip(null)}
          onDelete={handleDelete}
          userRole={userRole}
        />
      )}
    </div>
  );
};

export default CompletedTrips;
