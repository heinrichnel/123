// ─── React ───────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';

// ─── Types ───────────────────────────────────────────────────────
import { Trip, CustomerPerformance } from '../../types';

// ─── UI Components ───────────────────────────────────────────────
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { Input, Select } from '../ui/FormElements';

// ─── Icons ───────────────────────────────────────────────────────
import {
  AlertTriangle,
  Award,
  Calendar,
  Clock,
  DollarSign,
  Download,
  Filter,
  TrendingDown,
  TrendingUp,
  Users
} from 'lucide-react';

// ─── Helper Functions ────────────────────────────────────────────
import { formatCurrency, formatDate } from '../../utils/helpers';


interface CustomerRetentionDashboardProps {
  trips: Trip[];
}

const CustomerRetentionDashboard: React.FC<CustomerRetentionDashboardProps> = ({ trips }) => {
  const [filters, setFilters] = useState({
    riskLevel: '',
    currency: '',
    clientType: ''
  });

  const customerPerformance = useMemo(() => {
    const customerStats = trips.reduce((acc, trip) => {
      if (!acc[trip.clientName]) {
        acc[trip.clientName] = {
          trips: [],
          totalRevenue: 0,
          totalPaymentDays: 0,
          paidTrips: 0,
          clientType: trip.clientType
        };
      }
      
      acc[trip.clientName].trips.push(trip);
      acc[trip.clientName].totalRevenue += trip.baseRevenue;
      
      if (trip.paymentReceivedDate && trip.invoiceDueDate) {
        const dueDate = new Date(trip.invoiceDueDate);
        const paidDate = new Date(trip.paymentReceivedDate);
        const paymentDays = Math.floor((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        acc[trip.clientName].totalPaymentDays += paymentDays;
        acc[trip.clientName].paidTrips++;
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(customerStats).map(([customerName, stats]: [string, any]) => {
      // Fix: Check if trips array is not empty before calculating lastTripDate
      const lastTripDateTimestamp = stats.trips.length > 0 
        ? Math.max(...stats.trips.map((t: Trip) => new Date(t.endDate).getTime()))
        : undefined;
      
      const daysSinceLastTrip = lastTripDateTimestamp 
        ? Math.floor((Date.now() - lastTripDateTimestamp) / (1000 * 60 * 60 * 24))
        : 999; // Set high value for customers with no trips
      
      const averagePaymentDays = stats.paidTrips > 0 ? stats.totalPaymentDays / stats.paidTrips : 0;
      
      // Calculate payment score (0-100, where 100 is best)
      const paymentScore = Math.max(0, 100 - Math.abs(averagePaymentDays) * 2);
      
      // Determine risk level
      const isAtRisk = daysSinceLastTrip > 60 || averagePaymentDays > 30;
      const riskLevel = daysSinceLastTrip > 90 || averagePaymentDays > 45 ? 'high' :
                       daysSinceLastTrip > 60 || averagePaymentDays > 20 ? 'medium' : 'low';
      
      // Determine if profitable (top 20% by revenue)
      const isProfitable = stats.totalRevenue > 50000; // Simplified threshold
      
      // Determine if top client (top 10% by trip frequency)
      const isTopClient = stats.trips.length >= 5; // Simplified threshold

      const currency = stats.trips[0]?.revenueCurrency || 'ZAR';

      return {
        customerName,
        totalTrips: stats.trips.length,
        totalRevenue: stats.totalRevenue,
        currency,
        averagePaymentDays,
        paymentScore,
        lastTripDate: lastTripDateTimestamp ? new Date(lastTripDateTimestamp).toISOString().split('T')[0] : '',
        riskLevel,
        isAtRisk,
        isProfitable,
        isTopClient,
        daysSinceLastTrip,
        clientType: stats.clientType
      } as CustomerPerformance & { daysSinceLastTrip: number; clientType: string };
    });
  }, [trips]);

  const filteredCustomers = useMemo(() => {
    return customerPerformance.filter(customer => {
      if (filters.riskLevel && customer.riskLevel !== filters.riskLevel) return false;
      if (filters.currency && customer.currency !== filters.currency) return false;
      if (filters.clientType && customer.clientType !== filters.clientType) return false;
      return true;
    });
  }, [customerPerformance, filters]);

  const summary = useMemo(() => {
    const total = filteredCustomers.length;
    const atRisk = filteredCustomers.filter(c => c.isAtRisk).length;
    const profitable = filteredCustomers.filter(c => c.isProfitable).length;
    const topClients = filteredCustomers.filter(c => c.isTopClient).length;
    const inactive = filteredCustomers.filter(c => c.daysSinceLastTrip > 60).length;
    
    const totalRevenue = filteredCustomers.reduce((sum, c) => sum + c.totalRevenue, 0);
    const avgPaymentDays = filteredCustomers.length > 0 ? 
      filteredCustomers.reduce((sum, c) => sum + c.averagePaymentDays, 0) / filteredCustomers.length : 0;

    return {
      total,
      atRisk,
      profitable,
      topClients,
      inactive,
      totalRevenue,
      avgPaymentDays
    };
  }, [filteredCustomers]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({ riskLevel: '', currency: '', clientType: '' });
  };

  const exportCustomerData = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "CUSTOMER RETENTION & SERVICE DASHBOARD\n";
    csvContent += `Generated on,${formatDate(new Date())}\n\n`;
    
    csvContent += "Customer Name,Total Trips,Total Revenue,Currency,Average Payment Days,Payment Score,Last Trip Date,Days Since Last Trip,Risk Level,Client Type,Is At Risk,Is Profitable,Is Top Client\n";
    filteredCustomers.forEach(customer => {
      const lastTripDisplay = customer.lastTripDate ? formatDate(customer.lastTripDate) : 'No trips';
      csvContent += `"${customer.customerName}",${customer.totalTrips},${customer.totalRevenue},${customer.currency},${customer.averagePaymentDays.toFixed(1)},${customer.paymentScore.toFixed(1)},${lastTripDisplay},${customer.daysSinceLastTrip},${customer.riskLevel.toUpperCase()},${customer.clientType === 'internal' ? 'Internal' : 'External'},${customer.isAtRisk ? 'Yes' : 'No'},${customer.isProfitable ? 'Yes' : 'No'},${customer.isTopClient ? 'Yes' : 'No'}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customer-retention-analysis-${formatDate(new Date()).replace(/\s/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Retention & Service Dashboard</h2>
          <p className="text-gray-600">Monitor customer relationships, payment patterns, and service frequency</p>
        </div>
        <Button
          variant="outline"
          onClick={exportCustomerData}
          icon={<Download className="w-4 h-4" />}
        >
          Export Analysis
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">At Risk Customers</p>
                <p className="text-2xl font-bold text-red-600">{summary.atRisk}</p>
                <p className="text-xs text-gray-400">
                  {summary.total > 0 ? ((summary.atRisk / summary.total) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Top Clients</p>
                <p className="text-2xl font-bold text-green-600">{summary.topClients}</p>
                <p className="text-xs text-gray-400">High frequency</p>
              </div>
              <Award className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Payment Days</p>
                <p className="text-2xl font-bold text-blue-600">{summary.avgPaymentDays.toFixed(1)}</p>
                <p className="text-xs text-gray-400">days after due</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader 
          title="Filter Customers" 
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={clearFilters}
              icon={<Filter className="w-4 h-4" />}
            >
              Clear Filters
            </Button>
          }
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Risk Level"
              value={filters.riskLevel}
              onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
              options={[
                { label: 'All Risk Levels', value: '' },
                { label: 'Low Risk', value: 'low' },
                { label: 'Medium Risk', value: 'medium' },
                { label: 'High Risk', value: 'high' }
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
              label="Client Type"
              value={filters.clientType}
              onChange={(e) => handleFilterChange('clientType', e.target.value)}
              options={[
                { label: 'All Client Types', value: '' },
                { label: 'Internal', value: 'internal' },
                { label: 'External', value: 'external' }
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Profitable Clients */}
        <Card>
          <CardHeader 
            title="Most Profitable Clients" 
            icon={<DollarSign className="w-5 h-5 text-green-600" />}
          />
          <CardContent>
            <div className="space-y-3">
              {filteredCustomers
                .filter(c => c.isProfitable)
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .slice(0, 5)
                .map((customer) => (
                  <div key={customer.customerName} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{customer.customerName}</p>
                      <p className="text-sm text-gray-600">{customer.totalTrips} trips</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatCurrency(customer.totalRevenue, customer.currency)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Score: {customer.paymentScore.toFixed(0)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Repeat Clients */}
        <Card>
          <CardHeader 
            title="Top Repeat Clients" 
            icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
          />
          <CardContent>
            <div className="space-y-3">
              {filteredCustomers
                .filter(c => c.isTopClient)
                .sort((a, b) => b.totalTrips - a.totalTrips)
                .slice(0, 5)
                .map((customer) => (
                  <div key={customer.customerName} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{customer.customerName}</p>
                      <p className="text-sm text-gray-600">
                        Last trip: {customer.lastTripDate ? formatDate(customer.lastTripDate) : 'No trips'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{customer.totalTrips}</p>
                      <p className="text-xs text-gray-500">trips</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* At-Risk Clients */}
        <Card>
          <CardHeader 
            title="At-Risk Clients" 
            icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          />
          <CardContent>
            <div className="space-y-3">
              {filteredCustomers
                .filter(c => c.isAtRisk)
                .sort((a, b) => b.daysSinceLastTrip - a.daysSinceLastTrip)
                .slice(0, 5)
                .map((customer) => (
                  <div key={customer.customerName} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{customer.customerName}</p>
                      <p className="text-sm text-gray-600">
                        {customer.daysSinceLastTrip} days since last trip
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(customer.riskLevel)}`}>
                        {customer.riskLevel.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Customer List */}
      <Card>
        <CardHeader title={`Customer Details (${filteredCustomers.length})`} />
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No customers match your current filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Customer</th>
                    <th className="text-center py-3 text-sm font-medium text-gray-500">Type</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Trips</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Revenue</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Payment Score</th>
                    <th className="text-center py-3 text-sm font-medium text-gray-500">Last Trip</th>
                    <th className="text-center py-3 text-sm font-medium text-gray-500">Risk Level</th>
                    <th className="text-center py-3 text-sm font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .map((customer) => (
                      <tr key={customer.customerName} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 text-sm font-medium text-gray-900">
                          {customer.customerName}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            customer.clientType === 'internal' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {customer.clientType === 'internal' ? 'Internal' : 'External'}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-gray-900 text-right">
                          {customer.totalTrips}
                        </td>
                        <td className="py-3 text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(customer.totalRevenue, customer.currency)}
                        </td>
                        <td className="py-3 text-sm text-gray-900 text-right">
                          <span className={`font-medium ${
                            customer.paymentScore >= 80 ? 'text-green-600' :
                            customer.paymentScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {customer.paymentScore.toFixed(0)}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-gray-900 text-center">
                          {customer.lastTripDate ? formatDate(customer.lastTripDate) : 'No trips'}
                          <div className="text-xs text-gray-500">
                            ({customer.daysSinceLastTrip} days ago)
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(customer.riskLevel)}`}>
                            {customer.riskLevel.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex justify-center space-x-1">
                            {customer.isProfitable && (
                              <span className="inline-flex items-center px-1 py-1 rounded text-xs bg-green-100 text-green-800" title="Profitable">
                                <DollarSign className="w-3 h-3" />
                              </span>
                            )}
                            {customer.isTopClient && (
                              <span className="inline-flex items-center px-1 py-1 rounded text-xs bg-blue-100 text-blue-800" title="Top Client">
                                <Award className="w-3 h-3" />
                              </span>
                            )}
                            {customer.isAtRisk && (
                              <span className="inline-flex items-center px-1 py-1 rounded text-xs bg-red-100 text-red-800" title="At Risk">
                                <AlertTriangle className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerRetentionDashboard;