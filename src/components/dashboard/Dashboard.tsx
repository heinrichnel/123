import React, { useState, useMemo } from 'react';
import { Trip, CLIENTS, DRIVERS } from '../../types';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { Input, Select } from '../ui/FormElements';
import { 
  TrendingUp, 
  Truck, 
  FileText, 
  Calendar, 
  DollarSign, 
  TrendingDown,
  Navigation,
  Filter,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  Flag,
  Clock,
  CheckCircle,
  Users,
  Eye,
  BarChart3,
  User
} from 'lucide-react';
import { 
  formatCurrency, 
  calculateTotalCosts, 
  calculateKPIs,
  filterTripsByDateRange,
  filterTripsByClient,
  filterTripsByCurrency,
  filterTripsByDriver,
  getAllFlaggedCosts,
  getUnresolvedFlagsCount,
  canCompleteTrip,
  formatDate
} from '../../utils/helpers';

interface DashboardProps {
  trips: Trip[];
}

const Dashboard: React.FC<DashboardProps> = ({ trips }) => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    client: '',
    currency: '',
    driver: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  const filteredTrips = useMemo(() => {
    let filtered = trips;
    
    if (filters.startDate || filters.endDate) {
      filtered = filterTripsByDateRange(filtered, filters.startDate, filters.endDate);
    }
    if (filters.client) {
      filtered = filterTripsByClient(filtered, filters.client);
    }
    if (filters.currency) {
      filtered = filterTripsByCurrency(filtered, filters.currency);
    }
    if (filters.driver) {
      filtered = filterTripsByDriver(filtered, filters.driver);
    }
    
    return filtered;
  }, [trips, filters]);

  const stats = useMemo(() => {
    const totalTrips = filteredTrips.length;
    
    // Separate by currency
    const zarTrips = filteredTrips.filter(trip => trip.revenueCurrency === 'ZAR');
    const usdTrips = filteredTrips.filter(trip => trip.revenueCurrency === 'USD');
    
    const zarRevenue = zarTrips.reduce((sum, trip) => sum + (trip.baseRevenue || 0), 0);
    const zarCosts = zarTrips.reduce((sum, trip) => sum + calculateTotalCosts(trip.costs), 0);
    const zarProfit = zarRevenue - zarCosts;
    
    const usdRevenue = usdTrips.reduce((sum, trip) => sum + (trip.baseRevenue || 0), 0);
    const usdCosts = usdTrips.reduce((sum, trip) => sum + calculateTotalCosts(trip.costs), 0);
    const usdProfit = usdRevenue - usdCosts;
    
    const totalEntries = filteredTrips.reduce((sum, trip) => sum + trip.costs.length, 0);
    
    // Compliance & Investigation Analytics
    const allFlaggedCosts = getAllFlaggedCosts(filteredTrips);
    const unresolvedFlags = allFlaggedCosts.filter(cost => cost.investigationStatus !== 'resolved');
    const resolvedFlags = allFlaggedCosts.filter(cost => cost.investigationStatus === 'resolved');
    
    // Calculate average resolution time (mock calculation for demo)
    const avgResolutionTime = resolvedFlags.length > 0 ? 
      resolvedFlags.reduce((sum, flag) => {
        if (flag.flaggedAt && flag.resolvedAt) {
          const flaggedDate = new Date(flag.flaggedAt);
          const resolvedDate = new Date(flag.resolvedAt);
          return sum + (resolvedDate.getTime() - flaggedDate.getTime()) / (1000 * 60 * 60 * 24);
        }
        return sum + 3; // Default 3 days for demo
      }, 0) / resolvedFlags.length : 0;

    // Driver Performance Analytics
    const driverStats = filteredTrips.reduce((acc, trip) => {
      if (!acc[trip.driverName]) {
        acc[trip.driverName] = {
          trips: 0,
          flags: 0,
          unresolvedFlags: 0,
          investigations: 0,
          revenue: 0,
          expenses: 0,
          tripsWithFlags: 0
        };
      }
      
      const tripFlags = trip.costs.filter(c => c.isFlagged);
      const tripUnresolvedFlags = getUnresolvedFlagsCount(trip.costs);
      
      acc[trip.driverName].trips++;
      acc[trip.driverName].flags += tripFlags.length;
      acc[trip.driverName].unresolvedFlags += tripUnresolvedFlags;
      acc[trip.driverName].investigations += tripFlags.length;
      acc[trip.driverName].revenue += trip.baseRevenue || 0;
      acc[trip.driverName].expenses += calculateTotalCosts(trip.costs);
      
      if (tripFlags.length > 0) {
        acc[trip.driverName].tripsWithFlags++;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate percentages and performance scores
    Object.keys(driverStats).forEach(driver => {
      const stats = driverStats[driver];
      stats.flagPercentage = stats.trips > 0 ? (stats.tripsWithFlags / stats.trips) * 100 : 0;
      stats.avgFlagsPerTrip = stats.trips > 0 ? stats.flags / stats.trips : 0;
      stats.netProfit = stats.revenue - stats.expenses;
      stats.profitPerTrip = stats.trips > 0 ? stats.netProfit / stats.trips : 0;
    });

    // Top 5 drivers with highest flags
    const topDriversByFlags = Object.entries(driverStats)
      .sort(([,a], [,b]) => (b as any).flags - (a as any).flags)
      .slice(0, 5);

    // Most flagged cost categories
    const categoryFlags = allFlaggedCosts.reduce((acc, cost) => {
      acc[cost.category] = (acc[cost.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topFlaggedCategories = Object.entries(categoryFlags)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    // Trips ready for completion
    const tripsReadyForCompletion = filteredTrips.filter(trip => 
      trip.status === 'active' && canCompleteTrip(trip)
    );

    // Trips with unresolved flags
    const tripsWithUnresolvedFlags = filteredTrips.filter(trip => 
      trip.status === 'active' && getUnresolvedFlagsCount(trip.costs) > 0
    );

    return {
      totalTrips,
      zarRevenue,
      zarCosts,
      zarProfit,
      usdRevenue,
      usdCosts,
      usdProfit,
      totalEntries,
      allFlaggedCosts,
      unresolvedFlags,
      resolvedFlags,
      avgResolutionTime,
      driverStats,
      topDriversByFlags,
      topFlaggedCategories,
      tripsReadyForCompletion,
      tripsWithUnresolvedFlags
    };
  }, [filteredTrips]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      client: '',
      currency: '',
      driver: ''
    });
  };

  const exportDashboard = (format: 'pdf' | 'excel') => {
    const message = format === 'pdf' 
      ? 'Dashboard PDF report is being generated...'
      : 'Dashboard Excel report is being generated...';
    alert(message);
  };

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <Card>
        <CardHeader 
          title="Dashboard Overview & Analytics" 
          action={
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                icon={<Filter className="w-4 h-4" />}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportDashboard('excel')}
                icon={<FileSpreadsheet className="w-4 h-4" />}
              >
                Export Excel
              </Button>
              <Button
                size="sm"
                onClick={() => exportDashboard('pdf')}
                icon={<Download className="w-4 h-4" />}
              >
                Export PDF
              </Button>
            </div>
          }
        />
        {showFilters && (
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
                  ...CLIENTS.map(c => ({ label: c, value: c }))
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
              <Select
                label="Driver"
                value={filters.driver}
                onChange={(e) => handleFilterChange('driver', e.target.value)}
                options={[
                  { label: 'All Drivers', value: '' },
                  ...DRIVERS.map(d => ({ label: d, value: d }))
                ]}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Total Trips</div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalTrips}</div>
                <div className="text-xs text-gray-400">
                  {filteredTrips.filter(t => t.status === 'active').length} active • {filteredTrips.filter(t => t.status === 'completed').length} completed
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Revenue</div>
                <div className="text-lg font-bold text-gray-900">
                  {stats.zarRevenue > 0 && (
                    <div>{formatCurrency(stats.zarRevenue, 'ZAR')}</div>
                  )}
                  {stats.usdRevenue > 0 && (
                    <div>{formatCurrency(stats.usdRevenue, 'USD')}</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Total Costs</div>
                <div className="text-lg font-bold text-gray-900">
                  {stats.zarCosts > 0 && (
                    <div>{formatCurrency(stats.zarCosts, 'ZAR')}</div>
                  )}
                  {stats.usdCosts > 0 && (
                    <div>{formatCurrency(stats.usdCosts, 'USD')}</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className={`h-8 w-8 ${(stats.zarProfit + stats.usdProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Net Profit</div>
                <div className="text-lg font-bold text-gray-900">
                  {stats.zarProfit !== 0 && (
                    <div className={stats.zarProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(stats.zarProfit, 'ZAR')}
                    </div>
                  )}
                  {stats.usdProfit !== 0 && (
                    <div className={stats.usdProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(stats.usdProfit, 'USD')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance & Investigation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">Unresolved Flags</div>
                <div className="text-2xl font-bold text-red-600">{stats.unresolvedFlags.length}</div>
                <div className="text-xs text-gray-400">Require attention</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">Avg Resolution Time</div>
                <div className="text-2xl font-bold text-blue-600">{stats.avgResolutionTime.toFixed(1)}</div>
                <div className="text-xs text-gray-400">days</div>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">Ready for Completion</div>
                <div className="text-2xl font-bold text-green-600">{stats.tripsReadyForCompletion.length}</div>
                <div className="text-xs text-gray-400">trips</div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">Active Drivers</div>
                <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.driverStats).length}</div>
                <div className="text-xs text-gray-400">in fleet</div>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader 
            title="Quick Actions" 
            icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
          />
          <CardContent>
            <div className="space-y-3">
              <Button
                variant="outline"
                fullWidth
                icon={<Flag className="w-4 h-4" />}
                onClick={() => window.location.hash = '#flags'}
              >
                View Trips with Unresolved Flags ({stats.tripsWithUnresolvedFlags.length})
              </Button>
              <Button
                variant="outline"
                fullWidth
                icon={<CheckCircle className="w-4 h-4" />}
                onClick={() => window.location.hash = '#ready-completion'}
              >
                View Trips Ready for Completion ({stats.tripsReadyForCompletion.length})
              </Button>
              <Button
                variant="outline"
                fullWidth
                icon={<User className="w-4 h-4" />}
                onClick={() => window.location.hash = '#driver-kpis'}
              >
                View Driver KPI Summary
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader 
            title="Trips with Unresolved Flags" 
            icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          />
          <CardContent>
            {stats.tripsWithUnresolvedFlags.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stats.tripsWithUnresolvedFlags.slice(0, 5).map((trip) => {
                  const unresolvedCount = getUnresolvedFlagsCount(trip.costs);
                  return (
                    <div key={trip.id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <div>
                        <p className="font-medium text-sm">Fleet {trip.fleetNumber}</p>
                        <p className="text-xs text-gray-600">{trip.driverName}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-red-600">{unresolvedCount}</span>
                        <p className="text-xs text-gray-500">flags</p>
                      </div>
                    </div>
                  );
                })}
                {stats.tripsWithUnresolvedFlags.length > 5 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{stats.tripsWithUnresolvedFlags.length - 5} more trips
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4 text-sm">No unresolved flags</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader 
            title="Trips Ready for Completion" 
            icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          />
          <CardContent>
            {stats.tripsReadyForCompletion.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stats.tripsReadyForCompletion.slice(0, 5).map((trip) => {
                  const kpis = calculateKPIs(trip);
                  return (
                    <div key={trip.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <div>
                        <p className="font-medium text-sm">Fleet {trip.fleetNumber}</p>
                        <p className="text-xs text-gray-600">{trip.driverName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">
                          {formatCurrency(kpis.netProfit, kpis.currency)}
                        </p>
                        <p className="text-xs text-gray-500">profit</p>
                      </div>
                    </div>
                  );
                })}
                {stats.tripsReadyForCompletion.length > 5 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{stats.tripsReadyForCompletion.length - 5} more trips
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4 text-sm">No trips ready</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Driver Performance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader 
            title="Top 5 Drivers with Highest Flags" 
            icon={<Flag className="w-5 h-5 text-red-600" />}
          />
          <CardContent>
            {stats.topDriversByFlags.length > 0 ? (
              <div className="space-y-3">
                {stats.topDriversByFlags.map(([driverName, driverStats]: [string, any], index) => (
                  <div key={driverName} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                        <span className="text-sm font-bold text-red-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{driverName}</p>
                        <p className="text-sm text-gray-500">
                          {driverStats.trips} trips • {driverStats.flagPercentage.toFixed(1)}% flag rate
                        </p>
                        <p className="text-xs text-gray-400">
                          {driverStats.unresolvedFlags} unresolved • Last 30 days: {driverStats.flags}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">{driverStats.flags}</p>
                      <p className="text-xs text-gray-500">total flags</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No flagged entries recorded</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader 
            title="Most Flagged Cost Categories" 
            icon={<BarChart3 className="w-5 h-5 text-orange-600" />}
          />
          <CardContent>
            {stats.topFlaggedCategories.length > 0 ? (
              <div className="space-y-3">
                {stats.topFlaggedCategories.map(([category, count], index) => (
                  <div key={category} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-orange-600 rounded-full mr-3" 
                           style={{ backgroundColor: `hsl(${index * 72}, 70%, 50%)` }} />
                      <span className="font-medium text-gray-900">{category}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-orange-600">{count}</span>
                      <p className="text-xs text-gray-500">flags</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No flagged categories</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Driver Performance Summary Table */}
      <Card>
        <CardHeader 
          title="Driver Performance Summary" 
          icon={<Users className="w-5 h-5 text-blue-600" />}
        />
        <CardContent>
          {Object.keys(stats.driverStats).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Driver</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Trips</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Total Flags</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Unresolved</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Flag Rate %</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Avg Profit/Trip</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.driverStats)
                    .sort(([,a], [,b]) => (a as any).flagPercentage - (b as any).flagPercentage)
                    .map(([driver, driverStats]: [string, any]) => {
                      const performanceScore = Math.max(0, 100 - (driverStats.flagPercentage * 2));
                      const performanceColor = performanceScore >= 80 ? 'text-green-600' : 
                                             performanceScore >= 60 ? 'text-yellow-600' : 'text-red-600';
                      
                      return (
                        <tr key={driver} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 text-sm font-medium text-gray-900">{driver}</td>
                          <td className="py-3 text-sm text-gray-900 text-right">{driverStats.trips}</td>
                          <td className="py-3 text-sm text-gray-900 text-right">
                            {driverStats.flags > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                {driverStats.flags}
                              </span>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </td>
                          <td className="py-3 text-sm text-gray-900 text-right">
                            {driverStats.unresolvedFlags > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                                {driverStats.unresolvedFlags}
                              </span>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </td>
                          <td className="py-3 text-sm text-gray-900 text-right">
                            <span className={driverStats.flagPercentage > 20 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                              {driverStats.flagPercentage.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3 text-sm text-gray-900 text-right">
                            <span className={driverStats.profitPerTrip >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(driverStats.profitPerTrip)}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-right">
                            <span className={`font-medium ${performanceColor}`}>
                              {performanceScore.toFixed(0)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No driver data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;