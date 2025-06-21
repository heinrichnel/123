// ─── React & State ───────────────────────────────────────────────
import React, { useState, useMemo } from 'react';

// ─── Types ───────────────────────────────────────────────────────
import { Trip, CLIENTS, DRIVERS, MissedLoad } from '../../types';

// ─── UI Components ───────────────────────────────────────────────
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { Input, Select } from '../ui/FormElements';

// ─── Icons ───────────────────────────────────────────────────────
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
  User,
  Activity,
  Target,
  Award
} from 'lucide-react';

// ─── Utils ───────────────────────────────────────────────────────
import {
  formatCurrency,
  formatDate,
  calculateTotalCosts,
  calculateKPIs,
  filterTripsByDateRange,
  filterTripsByClient,
  filterTripsByCurrency,
  filterTripsByDriver,
  getAllFlaggedCosts,
  getUnresolvedFlagsCount,
  canCompleteTrip
} from '../../utils/helpers';

// ─── Context ─────────────────────────────────────────────────────
import { useAppContext } from '../../context/AppContext';

interface DashboardProps {
  trips: Trip[];
}

const Dashboard: React.FC<DashboardProps> = ({ trips }) => {
  const { missedLoads = [] } = useAppContext();
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
    const zarTrips = filteredTrips.filter(trip => trip.revenueCurrency === 'ZAR');
    const usdTrips = filteredTrips.filter(trip => trip.revenueCurrency === 'USD');

    const zarRevenue = zarTrips.reduce((sum, trip) => sum + (trip.baseRevenue || 0), 0);
    const zarCosts = zarTrips.reduce((sum, trip) => sum + calculateTotalCosts(trip.costs || []), 0);
    const zarProfit = zarRevenue - zarCosts;

    const usdRevenue = usdTrips.reduce((sum, trip) => sum + (trip.baseRevenue || 0), 0);
    const usdCosts = usdTrips.reduce((sum, trip) => sum + calculateTotalCosts(trip.costs || []), 0);
    const usdProfit = usdRevenue - usdCosts;

    const totalEntries = filteredTrips.reduce((sum, trip) => sum + (trip.costs?.length || 0), 0);

    const allFlaggedCosts = getAllFlaggedCosts(filteredTrips);
    const unresolvedFlags = allFlaggedCosts.filter(cost => cost.investigationStatus !== 'resolved');
    const resolvedFlags = allFlaggedCosts.filter(cost => cost.investigationStatus === 'resolved');

    const avgResolutionTime = resolvedFlags.length > 0
      ? resolvedFlags.reduce((sum, flag) => {
          if (flag.flaggedAt && flag.resolvedAt) {
            const flaggedDate = new Date(flag.flaggedAt);
            const resolvedDate = new Date(flag.resolvedAt);
            return sum + (resolvedDate.getTime() - flaggedDate.getTime()) / (1000 * 60 * 60 * 24);
          }
          return sum + 3;
        }, 0) / resolvedFlags.length
      : 0;

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

      const tripFlags = (trip.costs || []).filter(c => c.isFlagged);
      const tripUnresolvedFlags = getUnresolvedFlagsCount(trip.costs || []);

      acc[trip.driverName].trips++;
      acc[trip.driverName].flags += tripFlags.length;
      acc[trip.driverName].unresolvedFlags += tripUnresolvedFlags;
      acc[trip.driverName].investigations += tripFlags.length;
      acc[trip.driverName].revenue += trip.baseRevenue || 0;
      acc[trip.driverName].expenses += calculateTotalCosts(trip.costs || []);

      if (tripFlags.length > 0) {
        acc[trip.driverName].tripsWithFlags++;
      }

      return acc;
    }, {} as Record<string, any>);

    Object.keys(driverStats).forEach(driver => {
      const stats = driverStats[driver];
      stats.flagPercentage = stats.trips > 0 ? (stats.tripsWithFlags / stats.trips) * 100 : 0;
      stats.avgFlagsPerTrip = stats.trips > 0 ? stats.flags / stats.trips : 0;
      stats.netProfit = stats.revenue - stats.expenses;
      stats.profitPerTrip = stats.trips > 0 ? stats.netProfit / stats.trips : 0;
    });

    const topDriversByFlags = Object.entries(driverStats)
      .sort(([, a], [, b]) => (b as any).flags - (a as any).flags)
      .slice(0, 5);

    const categoryFlags = allFlaggedCosts.reduce((acc, cost) => {
      acc[cost.category] = (acc[cost.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topFlaggedCategories = Object.entries(categoryFlags)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const tripsReadyForCompletion = filteredTrips.filter(trip =>
      trip.status === 'active' && canCompleteTrip(trip)
    );

    const tripsWithUnresolvedFlags = filteredTrips.filter(trip =>
      trip.status === 'active' && getUnresolvedFlagsCount(trip.costs || []) > 0
    );

    // Calculate missed loads metrics
    const missedLoadsZAR = missedLoads.filter(load => load.currency === 'ZAR');
    const missedLoadsUSD = missedLoads.filter(load => load.currency === 'USD');
    
    const missedRevenueZAR = missedLoadsZAR.reduce((sum, load) => sum + load.estimatedRevenue, 0);
    const missedRevenueUSD = missedLoadsUSD.reduce((sum, load) => sum + load.estimatedRevenue, 0);
    
    const missedOpportunities = missedLoads.length;
    const competitorWins = missedLoads.filter(load => load.competitorWon).length;
    const highImpactMissed = missedLoads.filter(load => load.impact === 'high').length;

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
      tripsWithUnresolvedFlags,
      missedRevenueZAR,
      missedRevenueUSD,
      missedOpportunities,
      competitorWins,
      highImpactMissed
    };
  }, [filteredTrips, missedLoads]);

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
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-lg text-gray-600 mt-2">Matanuska Transport Operational Overview</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter className="w-4 h-4" />}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button
            variant="outline"
            onClick={() => exportDashboard('excel')}
            icon={<FileSpreadsheet className="w-4 h-4" />}
          >
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader title="Filter Dashboard Data" />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={value => handleFilterChange('startDate', value)}
              />
              <Input
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={value => handleFilterChange('endDate', value)}
              />
              <Select
                label="Client"
                value={filters.client}
                onChange={value => handleFilterChange('client', value)}
                options={[
                  { label: 'All Clients', value: '' },
                  ...CLIENTS.map(c => ({ label: c, value: c }))
                ]}
              />
              <Select
                label="Driver"
                value={filters.driver}
                onChange={value => handleFilterChange('driver', value)}
                options={[
                  { label: 'All Drivers', value: '' },
                  ...DRIVERS.map(d => ({ label: d, value: d }))
                ]}
              />
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

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gray-50">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Total Trips</h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalTrips}</p>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <Activity className="w-4 h-4 mr-1" />
              <span>Active fleet operations</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gray-50">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.zarRevenue, 'ZAR')}</p>
              {stats.usdRevenue > 0 && (
                <p className="text-xl font-bold text-green-600">{formatCurrency(stats.usdRevenue, 'USD')}</p>
              )}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
              <span>From {stats.totalTrips} trips</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gray-50">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Net Profit</h3>
              </div>
            </div>
            <div className="space-y-1">
              <p className={`text-2xl font-bold ${stats.zarProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.zarProfit, 'ZAR')}
              </p>
              {stats.usdProfit !== 0 && (
                <p className={`text-xl font-bold ${stats.usdProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.usdProfit, 'USD')}
                </p>
              )}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <Award className="w-4 h-4 mr-1 text-purple-500" />
              <span>Overall profitability</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gray-50">
                  <Flag className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Flagged Items</h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.unresolvedFlags.length}</p>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <AlertTriangle className="w-4 h-4 mr-1 text-amber-500" />
              <span>Unresolved flags requiring attention</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Missed Loads Impact */}
      <Card>
        <CardHeader 
          title={
            <span className="flex items-center">
              <TrendingDown className="w-5 h-5 text-red-600 mr-2" />
              Missed Loads Financial Impact
            </span>
          }
          subtitle="Potential revenue and profit loss from missed business opportunities"
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Missed Revenue (ZAR)</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.missedRevenueZAR, 'ZAR')}
              </p>
              <p className="text-xs text-gray-400">
                Potential lost income
              </p>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Missed Revenue (USD)</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.missedRevenueUSD, 'USD')}
              </p>
              <p className="text-xs text-gray-400">
                Potential lost income
              </p>
            </div>
            
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Missed Opportunities</p>
              <p className="text-2xl font-bold text-amber-600">
                {stats.missedOpportunities}
              </p>
              <p className="text-xs text-gray-400">
                Total missed loads
              </p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Competitor Wins</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.competitorWins}
              </p>
              <p className="text-xs text-gray-400">
                Lost to competitors
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Missed Loads Impact Analysis</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• <strong>Revenue Gap:</strong> {formatCurrency(stats.missedRevenueZAR, 'ZAR')} + {formatCurrency(stats.missedRevenueUSD, 'USD')} potential revenue not captured</p>
              <p>• <strong>Opportunity Cost:</strong> Based on current profit margins, this represents approximately {formatCurrency(stats.missedRevenueZAR * 0.15, 'ZAR')} + {formatCurrency(stats.missedRevenueUSD * 0.15, 'USD')} in missed profit</p>
              <p>• <strong>Market Share Impact:</strong> {stats.competitorWins} loads ({((stats.competitorWins / Math.max(stats.missedOpportunities, 1)) * 100).toFixed(1)}% of missed loads) were captured by competitors</p>
              <p>• <strong>High Impact Losses:</strong> {stats.highImpactMissed} high-impact opportunities were missed, potentially affecting key client relationships</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operational Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trips Ready for Completion */}
        <Card>
          <CardHeader 
            title={
              <span className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                Trips Ready for Completion
              </span>
            }
          />
          <CardContent>
            {stats.tripsReadyForCompletion.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No trips ready for completion</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {stats.tripsReadyForCompletion.slice(0, 5).map(trip => (
                  <div key={trip.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">Fleet {trip.fleetNumber}</p>
                        <p className="text-sm text-gray-600">{trip.route}</p>
                        <p className="text-xs text-gray-500">{trip.driverName} • {formatDate(trip.endDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">{formatCurrency(trip.baseRevenue || 0, trip.revenueCurrency)}</p>
                        <Button size="sm" variant="outline" icon={<Eye className="w-3 h-3" />}>View</Button>
                      </div>
                    </div>
                  </div>
                ))}
                {stats.tripsReadyForCompletion.length > 5 && (
                  <p className="text-center text-sm text-gray-500">
                    +{stats.tripsReadyForCompletion.length - 5} more trips ready for completion
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trips with Unresolved Flags */}
        <Card>
          <CardHeader 
            title="Trips with Unresolved Flags" 
            icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          />
          <CardContent>
            {stats.tripsWithUnresolvedFlags.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No trips with unresolved flags</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {stats.tripsWithUnresolvedFlags.slice(0, 5).map(trip => {
                  const unresolvedCount = getUnresolvedFlagsCount(trip.costs || []);
                  return (
                    <div key={trip.id} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">Fleet {trip.fleetNumber}</p>
                          <p className="text-sm text-gray-600">{trip.route}</p>
                          <p className="text-xs text-gray-500">{trip.driverName} • {formatDate(trip.endDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-amber-600">{unresolvedCount} unresolved</p>
                          <Button size="sm" variant="outline" icon={<Eye className="w-3 h-3" />}>View</Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {stats.tripsWithUnresolvedFlags.length > 5 && (
                  <p className="text-center text-sm text-gray-500">
                    +{stats.tripsWithUnresolvedFlags.length - 5} more trips with unresolved flags
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Driver Performance */}
      <Card>
        <CardHeader title="Driver Performance Overview" />
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trips</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Trip</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Flags</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Flag Rate</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(stats.driverStats)
                  .sort(([, a], [, b]) => (b as any).trips - (a as any).trips)
                  .slice(0, 8)
                  .map(([driver, data]) => (
                    <tr key={driver} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm font-medium text-gray-900">{driver}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900">{data.trips}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-green-600 font-medium">
                        {formatCurrency(data.revenue, 'ZAR')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <span className={`font-medium ${data.profitPerTrip >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(data.profitPerTrip, 'ZAR')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                          {data.flags}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        {data.flagPercentage.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          data.flagPercentage > 20 ? 'bg-red-100 text-red-800' :
                          data.flagPercentage > 10 ? 'bg-amber-100 text-amber-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {data.flagPercentage > 20 ? 'High Risk' :
                           data.flagPercentage > 10 ? 'Medium Risk' :
                           'Low Risk'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Flag Categories & Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Top Flagged Cost Categories" />
          <CardContent>
            {stats.topFlaggedCategories.length === 0 ? (
              <div className="text-center py-6">
                <Flag className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No flagged categories</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.topFlaggedCategories.map(([category, count], index) => (
                  <div key={category} className="flex items-center">
                    <div className="w-full">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{category}</span>
                        <span className="text-sm font-medium text-gray-700">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${Math.min(100, (count / Math.max(1, stats.allFlaggedCosts.length)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Flag Resolution Metrics" />
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Total Flags</p>
                <p className="text-2xl font-bold text-gray-900">{stats.allFlaggedCosts.length}</p>
                <div className="flex justify-center items-center mt-1">
                  <span className="text-xs text-green-600 mr-2">{stats.resolvedFlags.length} resolved</span>
                  <span className="text-xs text-red-600">{stats.unresolvedFlags.length} pending</span>
                </div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Avg Resolution Time</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgResolutionTime.toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-1">days per flag</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg col-span-2">
                <p className="text-sm text-gray-500 mb-1">Resolution Rate</p>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div 
                    className="bg-green-600 h-4 rounded-full" 
                    style={{ width: `${stats.allFlaggedCosts.length > 0 ? (stats.resolvedFlags.length / stats.allFlaggedCosts.length) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  {stats.allFlaggedCosts.length > 0 ? ((stats.resolvedFlags.length / stats.allFlaggedCosts.length) * 100).toFixed(1) : 0}% of flags resolved
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;