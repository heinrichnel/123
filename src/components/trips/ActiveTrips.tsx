// ─── React & State ───────────────────────────────────────────────
import React, { useState, useMemo } from 'react';

// ─── Types & Constants ───────────────────────────────────────────
import { Trip, CLIENTS, DRIVERS, FLEET_NUMBERS } from '../../types';

// ─── UI Components ───────────────────────────────────────────────
import { Input, Select, TextArea } from '../ui/FormElements';
import Button from '../ui/Button';
import Card, { CardContent, CardHeader } from '../ui/Card';
import { Edit, Trash2, Eye, AlertTriangle, Upload, Filter, Calendar } from 'lucide-react';
import { formatCurrency, calculateTotalCosts, getFlaggedCostsCount, formatDateForHeader, sortTripsByLoadingDate } from '../../utils/helpers';
import LoadImportModal from './LoadImportModal';


interface ActiveTripsProps {
  trips: Trip[];
  onView: (trip: Trip) => void;
  onEdit: (trip: Trip) => void;
  onDelete: (id: string) => void;
  onCompleteTrip: (tripId: string) => void;
}

const ActiveTrips: React.FC<ActiveTripsProps> = ({ trips, onEdit, onDelete, onView, onCompleteTrip }) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [filterFleet, setFilterFleet] = useState<string>('');
  const [filterDriver, setFilterDriver] = useState<string>('');
  const [filterClient, setFilterClient] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const openImportModal = () => setIsImportModalOpen(true);
  const closeImportModal = () => setIsImportModalOpen(false);

  const handleEdit = (trip: Trip) => {
    onEdit(trip);
  };

  const handleDelete = (id: string) => {
    const trip = trips.find(t => t.id === id);
    if (trip && confirm(`Delete trip for fleet ${trip.fleetNumber}? This cannot be undone.`)) {
      onDelete(id);
    }
  };

  // Apply filters
  const filteredTrips = trips.filter(trip => {
    if (filterFleet && trip.fleetNumber !== filterFleet) return false;
    if (filterDriver && trip.driverName !== filterDriver) return false;
    if (filterClient && trip.clientName !== filterClient) return false;
    return true;
  });

  // Get unique values for filters
  const uniqueFleets = [...new Set(trips.map(t => t.fleetNumber))].sort();
  const uniqueDrivers = [...new Set(trips.map(t => t.driverName))].sort();
  const uniqueClients = [...new Set(trips.map(t => t.clientName))].sort();

  // Clear filters
  const clearFilters = () => {
    setFilterFleet('');
    setFilterDriver('');
    setFilterClient('');
  };

  // Group trips by loading date (start date)
  const tripsByDate = useMemo(() => {
    return sortTripsByLoadingDate(filteredTrips);
  }, [filteredTrips]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Active Trips</h2>
          <p className="text-gray-500">{trips.length} active trip{trips.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter className="w-4 h-4" />}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button icon={<Upload className="w-4 h-4" />} onClick={openImportModal}>
            Import Trips
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader title="Filter Trips" />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Fleet"
                value={filterFleet}
                onChange={(value) => setFilterFleet(value)}
                options={[
                  { label: 'All Fleets', value: '' },
                  ...uniqueFleets.map(fleet => ({ label: fleet, value: fleet }))
                ]}
              />
              <Select
                label="Driver"
                value={filterDriver}
                onChange={(value) => setFilterDriver(value)}
                options={[
                  { label: 'All Drivers', value: '' },
                  ...uniqueDrivers.map(driver => ({ label: driver, value: driver }))
                ]}
              />
              <Select
                label="Client"
                value={filterClient}
                onChange={(value) => setFilterClient(value)}
                options={[
                  { label: 'All Clients', value: '' },
                  ...uniqueClients.map(client => ({ label: client, value: client }))
                ]}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredTrips.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No active trips found</h3>
          <p className="text-gray-500">
            {trips.length > 0 
              ? 'No trips match your current filter criteria.' 
              : 'Create your first trip or import data to start tracking.'}
          </p>
          {trips.length === 0 && (
            <div className="mt-4">
              <Button icon={<Upload className="w-4 h-4" />} onClick={openImportModal}>
                Import Trips
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Display trips grouped by date */}
      <div className="space-y-8">
        {Object.entries(tripsByDate).map(([date, dateTrips]) => (
          <div key={date} className="space-y-4">
            <div className="flex items-center space-x-3 border-b pb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-800">{formatDateForHeader(date)}</h3>
              <span className="text-sm text-gray-500">({dateTrips.length} trips)</span>
            </div>
            
            <div className="grid gap-4">
              {dateTrips.map((trip) => {
                const currency = trip.revenueCurrency;
                const totalCosts = calculateTotalCosts(trip.costs || []);
                const profit = (trip.baseRevenue || 0) - totalCosts;
                const flaggedCount = getFlaggedCostsCount(trip.costs || []);
                const unresolvedFlags = trip.costs?.some(
                  (cost) => cost.isFlagged && cost.investigationStatus !== 'resolved'
                );
                const canComplete = !unresolvedFlags;

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
                          <p className="font-medium text-green-600">{formatCurrency(trip.baseRevenue || 0, currency)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Costs</p>
                          <p className="font-medium text-red-600">{formatCurrency(totalCosts, currency)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Net Profit</p>
                          <p className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(profit, currency)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-gray-500">
                            {trip.costs?.length || 0} cost entries
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
                          <Button size="sm" variant="outline" onClick={() => onView(trip)} icon={<Eye className="w-3 h-3" />}>View</Button>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(trip)} icon={<Edit className="w-3 h-3" />}>Edit</Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(trip.id)} icon={<Trash2 className="w-3 h-3" />}>Delete</Button>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => {
                              if (canComplete) {
                                onCompleteTrip(trip.id);
                              } else {
                                alert('Cannot complete trip: Resolve all flagged costs first.');
                              }
                            }}
                            disabled={!canComplete}
                          >
                            Complete Trip
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <LoadImportModal isOpen={isImportModalOpen} onClose={closeImportModal} />
    </div>
  );
};

export default ActiveTrips;