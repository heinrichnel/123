// ─── React & State ───────────────────────────────────────────────
import React, { useState, useMemo } from 'react';

// ─── Types ───────────────────────────────────────────────────────
import { Trip, CLIENTS, DRIVERS } from '../../types';

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
  User
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
  const [tripList, setTripList] = useState<Trip[]>(trips);

  const filteredTrips = useMemo(() => {
    let filtered = tripList;

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
  }, [tripList, filters]);

  const stats = useMemo(() => {
    const totalTrips = filteredTrips.length;
    const zarTrips = filteredTrips.filter(trip => trip.revenueCurrency === 'ZAR');
    const usdTrips = filteredTrips.filter(trip => trip.revenueCurrency === 'USD');

    const zarRevenue = zarTrips.reduce((sum, trip) => sum + (trip.baseRevenue || 0), 0);
    const zarCosts = zarTrips.reduce((sum, trip) => sum + calculateTotalCosts(trip.costs), 0);
    const zarProfit = zarRevenue - zarCosts;

    const usdRevenue = usdTrips.reduce((sum, trip) => sum + (trip.baseRevenue || 0), 0);
    const usdCosts = usdTrips.reduce((sum, trip) => sum + calculateTotalCosts(trip.costs), 0);
    const usdProfit = usdRevenue - usdCosts;

    const totalEntries = filteredTrips.reduce((sum, trip) => sum + trip.costs.length, 0);

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
      {/* Dashboard Overview & Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>Total Trips</CardHeader>
          <CardContent>{stats.totalTrips}</CardContent>
        </Card>
        <Card>
          <CardHeader>Revenue</CardHeader>
          <CardContent>{formatCurrency(stats.zarRevenue, 'ZAR')}</CardContent>
        </Card>
        <Card>
          <CardHeader>Total Costs</CardHeader>
          <CardContent>{formatCurrency(stats.zarCosts, 'ZAR')}</CardContent>
        </Card>
        <Card>
          <CardHeader>Net Profit</CardHeader>
          <CardContent>{formatCurrency(stats.zarProfit, 'ZAR')}</CardContent>
        </Card>
        <Card>
          <CardHeader>Unresolved Flags</CardHeader>
          <CardContent>{stats.unresolvedFlags.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>Avg Resolution Time</CardHeader>
          <CardContent>{stats.avgResolutionTime.toFixed(1)} days</CardContent>
        </Card>
        <Card>
          <CardHeader>Ready for Completion</CardHeader>
          <CardContent>{stats.tripsReadyForCompletion.length} trips</CardContent>
        </Card>
        <Card>
          <CardHeader>Active Drivers</CardHeader>
          <CardContent>{Object.keys(stats.driverStats).length}</CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>Quick Actions</CardHeader>
          <CardContent>
            <Button onClick={() => alert('View Trips with Unresolved Flags')}>View Trips with Unresolved Flags ({stats.tripsWithUnresolvedFlags.length})</Button>
            <Button onClick={() => alert('View Trips Ready for Completion')}>View Trips Ready for Completion ({stats.tripsReadyForCompletion.length})</Button>
            <Button onClick={() => alert('View Driver KPI Summary')}>View Driver KPI Summary</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Trips with Unresolved Flags</CardHeader>
          <CardContent>
            {stats.tripsWithUnresolvedFlags.length === 0 ? 'No unresolved flags' : stats.tripsWithUnresolvedFlags.map(trip => (
              <div key={trip.id}>{trip.fleetNumber} - {trip.driverName}</div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Trips Ready for Completion</CardHeader>
          <CardContent>
            {stats.tripsReadyForCompletion.length === 0 ? 'None' : stats.tripsReadyForCompletion.map(trip => (
              <div key={trip.id} className="flex justify-between items-center">
                <span>Fleet {trip.fleetNumber}<br />{trip.driverName}</span>
                <span className="text-green-600 font-bold">{formatCurrency(trip.baseRevenue, trip.revenueCurrency)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top Drivers & Most Flagged Cost Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>Top 5 Drivers with Highest Flags</CardHeader>
          <CardContent>
            {stats.topDriversByFlags.length === 0 ? 'No flagged drivers' : stats.topDriversByFlags.map(([driver, d], idx) => (
              <div key={driver} className="mb-2 p-2 rounded bg-red-50">
                <span className="font-bold">{idx + 1}</span> {driver}<br />
                <span className="text-xs">{d.trips} trips • {d.flagPercentage.toFixed(1)}% flag rate</span><br />
                <span className="text-xs">{d.unresolvedFlags} unresolved - last 30 days: {d.flags}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Most Flagged Cost Categories</CardHeader>
          <CardContent>
            {stats.topFlaggedCategories.length === 0 ? 'No flagged categories' : stats.topFlaggedCategories.map(([cat, count]) => (
              <div key={cat}>{cat}: {count}</div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Driver Performance Summary */}
      <Card>
        <CardHeader>Driver Performance Summary</CardHeader>
        <CardContent>
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left">Driver</th>
                <th>Trips</th>
                <th>Total Flags</th>
                <th>Unresolved</th>
                <th>Flag Rate %</th>
                <th>Avg Profit/Trip</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.driverStats).map(([driver, d]) => (
                <tr key={driver}>
                  <td>{driver}</td>
                  <td>{d.trips}</td>
                  <td>{d.flags}</td>
                  <td>{d.unresolvedFlags}</td>
                  <td>{d.flagPercentage.toFixed(1)}%</td>
                  <td>{formatCurrency(d.profitPerTrip, 'ZAR')}</td>
                  <td>{Math.round(100 - d.flagPercentage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
