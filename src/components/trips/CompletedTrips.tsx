import React, { useState } from 'react';
import { Trip, TripDeletionRecord } from '../../types';
import { useAppContext } from '../../context/AppContext';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { Input, Select } from '../ui/FormElements';
import CompletedTripEditModal from './CompletedTripEditModal';
import TripDeletionModal from './TripDeletionModal';
import SyncIndicator from '../ui/SyncIndicator';
import { 
  Eye, 
  Download, 
  FileSpreadsheet, 
  Filter, 
  Calendar, 
  User, 
  Edit, 
  Trash2,
  History,
  AlertTriangle
} from 'lucide-react';
import { 
  formatCurrency, 
  calculateTotalCosts, 
  formatDate, 
  downloadTripPDF, 
  downloadTripExcel,
  formatDateTime
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

  // Mock user role - in real app, get from auth context
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
    alert('Trip updated successfully. Edit has been logged for audit purposes.');
  };

  const handleDelete = (trip: Trip, deletionRecord: Omit<TripDeletionRecord, 'id'>) => {
    // In real app, save deletion record to audit log before deleting
    console.log('Deletion Record:', deletionRecord);
    deleteTrip(trip.id);
    setDeletingTrip(null);
    alert('Trip deleted successfully. Deletion has been logged for governance purposes.');
  };

  const uniqueClients = [...new Set(trips.map(trip => trip.clientName))];
  const uniqueDrivers = [...new Set(trips.map(trip => trip.driverName))];

  if (trips.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No completed trips found</h3>
        <p className="text-gray-500">
          Complete some trips to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Completed Trips</h2>
          <div className="flex items-center mt-1">
            <p className="text-gray-500 mr-3">{filteredTrips.length} completed trip{filteredTrips.length !== 1 ? 's' : ''}</p>
            <SyncIndicator />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter className="w-4 h-4" />}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader title="Filter Completed Trips" />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
              <Select
                label="Client"
                value={filters.client}
                onChange={(e) => handleFilterChange('client', e.target.value)}
                options={[
                  { label: 'All Clients', value: '' },
                  ...uniqueClients.map(c => ({ label: c, value: c }))
                ]}
              />
              <Select
                label="Driver"
                value={filters.driver}
                onChange={(e) => handleFilterChange('driver', e.target.value)}
                options={[
                  { label: 'All Drivers', value: '' },
                  ...uniqueDrivers.map(d => ({ label: d, value: d }))
                ]}
              />
              <Select
                label="Currency"
                value={filters.currency}
                onChange={(e) => handleFilterChange('currency', e.target.value)}
                options={[
                  { label: 'All Currencies', value: '' },
                  { label: 'ZAR (R)', value: 'ZAR' },
                  { label: 'USD ($)', value: 'USD' }
                ]}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Offline warning */}
      {connectionStatus !== 'connected' && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">Working Offline</h4>
              <p className="text-sm text-amber-700 mt-1">
                You're currently working offline. Changes to completed trips will be synced when your connection is restored.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {filteredTrips.map((trip) => {
          const currency = trip.revenueCurrency;
          const totalCosts = calculateTotalCosts(trip.costs);
          const profit = (trip.baseRevenue || 0) - totalCosts;
          const hasEditHistory = trip.editHistory && trip.editHistory.length > 0;

          return (
            <Card key={trip.id} className="hover:shadow-md transition-shadow">
              <CardHeader 
              title={`Fleet ${trip.fleetNumber} - ${trip.route}`}
              subtitle={
                <div className="flex items-center space-x-4 text-sm">
                <span>{trip.clientName} • Completed {formatDate(trip.completedAt || trip.endDate)}</span>
                {hasEditHistory && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                  <History className="w-3 h-3 mr-1" />
                  Edited
                  </span>
                )}
                </div>
              }
              />
              <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Driver</p>
                  <p className="font-medium">{trip.driverName}</p>
                </div>
                </div>
                <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</p>
                </div>
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

              {/* Edit History Preview */}
              {hasEditHistory && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    This trip has been edited {trip.editHistory!.length} time{trip.editHistory!.length !== 1 ? 's' : ''} after completion
                  </span>
                  </div>
                  <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEditHistory(showEditHistory === trip.id ? null : trip.id)}
                  icon={<History className="w-3 h-3" />}
                  >
                  {showEditHistory === trip.id ? 'Hide' : 'View'} History
                  </Button>
                </div>
                
                {showEditHistory === trip.id && (
                  <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                  {trip.editHistory!.map((edit, index) => (
                    <div key={index} className="text-sm bg-white p-2 rounded border">
                    <div className="flex justify-between items-start">
                      <div>
                      <p className="font-medium">{edit.fieldChanged}: {edit.oldValue} → {edit.newValue}</p>
                      <p className="text-gray-600">Reason: {edit.reason}</p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                      <p>{edit.editedBy}</p>
                      <p>{formatDateTime(edit.editedAt)}</p>
                      </div>
                    </div>
                    </div>
                  ))}
                  </div>
                )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                {trip.costs.length} cost entries
                {trip.distanceKm && ` • ${trip.distanceKm} km`}
                {trip.completedBy && ` • Completed by ${trip.completedBy}`}
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
                  onClick={() => downloadTripExcel(trip)}
                  icon={<FileSpreadsheet className="w-3 h-3" />}
                >
                  Excel
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => downloadTripPDF(trip)}
                  icon={<Download className="w-3 h-3" />}
                >
                  PDF
                </Button>
                
                {/* Edit Button - Available for all users */}
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setEditingTrip(trip)}
                  icon={<Edit className="w-3 h-3" />}
                >
                  Edit
                </Button>
                
                {/* Delete Button - Admin Only */}
                {userRole === 'admin' && (
                  <Button 
                  size="sm" 
                  variant="danger"
                  onClick={() => setDeletingTrip(trip)}
                  icon={<Trash2 className="w-3 h-3" />}
                  >
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

      {/* Edit Modal */}
      {editingTrip && (
        <CompletedTripEditModal
          isOpen={!!editingTrip}
          trip={editingTrip}
          onClose={() => setEditingTrip(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Deletion Modal */}
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