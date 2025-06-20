// ─── React ───────────────────────────────────────────────────────
import React, { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────
import { Trip } from '../../types';

// ─── UI Components ───────────────────────────────────────────────
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { Input, Select } from '../ui/FormElements';

// ─── Icons ───────────────────────────────────────────────────────
import {
  AlertTriangle,
  Building,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  Filter,
  TrendingDown,
  TrendingUp,
  Users
} from 'lucide-react';

// ─── Helper Functions ────────────────────────────────────────────
import {
  formatDate,
  formatCurrency,
  calculateTotalCosts,
  generateCurrencyFleetReport,
  downloadCurrencyFleetReport
} from '../../utils/helpers';


interface CurrencyFleetReportProps {
  trips: Trip[];
}

const CurrencyFleetReport: React.FC<CurrencyFleetReportProps> = ({ trips }) => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    clientType: '',
    driver: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const filteredTrips = trips.filter(trip => {
    if (filters.startDate && trip.startDate < filters.startDate) return false;
    if (filters.endDate && trip.endDate > filters.endDate) return false;
    if (filters.clientType && trip.clientType !== filters.clientType) return false;
    if (filters.driver && trip.driverName !== filters.driver) return false;
    return true;
  });

  // Separate trips by currency
  const usdTrips = filteredTrips.filter(trip => trip.revenueCurrency === 'USD');
  const zarTrips = filteredTrips.filter(trip => trip.revenueCurrency === 'ZAR');

  // Generate reports for each currency
  const usdReport = generateCurrencyFleetReport(usdTrips, 'USD');
  const zarReport = generateCurrencyFleetReport(zarTrips, 'ZAR');

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      clientType: '',
      driver: ''
    });
  };

  const uniqueDrivers = [...new Set(trips.map(trip => trip.driverName))];

  const CurrencyReportSection = ({ 
    report, 
    currency, 
    trips: currencyTrips 
  }: { 
    report: any, 
    currency: 'USD' | 'ZAR', 
    trips: Trip[] 
  }) => (
    <div className="space-y-6">
      {/* Currency Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {currency} Fleet Performance Report
        </h2>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadCurrencyFleetReport(currencyTrips, currency)}
            icon={<FileSpreadsheet className="w-4 h-4" />}
          >
            Export {currency}
          </Button>
        </div>
      </div>

      {currencyTrips.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {currency} trips found
            </h3>
            <p className="text-gray-500">
              No trips conducted in {currency} match your current filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Fleet Summary */}
          <Card>
            <CardHeader title={`${currency} Fleet Summary`} />
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Total Trips</p>
                  <p className="text-2xl font-bold text-blue-600">{report.totalTrips}</p>
                  <p className="text-xs text-gray-400">
                    {report.activeTrips} active • {report.completedTrips} completed
                  </p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(report.totalRevenue, currency)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Avg: {formatCurrency(report.avgRevenuePerTrip, currency)}/trip
                  </p>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(report.totalExpenses, currency)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Avg: {formatCurrency(report.avgCostPerTrip, currency)}/trip
                  </p>
                </div>
                
                <div className={`text-center p-4 rounded-lg ${report.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-sm text-gray-500 mb-1">Net Profit/Loss</p>
                  <p className={`text-2xl font-bold ${report.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(report.netProfit, currency)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {typeof report.profitMargin === 'number' ? report.profitMargin.toFixed(1) : '0.0'}% margin
                  </p>
                </div>
              </div>

              {/* Client Type Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Building className="w-4 h-4 text-purple-600" />
                    <p className="text-sm text-gray-500">Internal Clients</p>
                  </div>
                  <p className="text-xl font-bold text-purple-600">
                    {report.internalTrips} trips
                  </p>
                  <p className="text-sm text-purple-700">
                    {formatCurrency(report.internalRevenue, currency)} revenue
                  </p>
                  <p className="text-xs text-gray-400">
                    {typeof report.internalProfitMargin === 'number' ? report.internalProfitMargin.toFixed(1) : '0.0'}% margin
                  </p>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Users className="w-4 h-4 text-orange-600" />
                    <p className="text-sm text-gray-500">External Clients</p>
                  </div>
                  <p className="text-xl font-bold text-orange-600">
                    {report.externalTrips} trips
                  </p>
                  <p className="text-sm text-orange-700">
                    {formatCurrency(report.externalRevenue, currency)} revenue
                  </p>
                  <p className="text-xs text-gray-400">
                    {typeof report.externalProfitMargin === 'number' ? report.externalProfitMargin.toFixed(1) : '0.0'}% margin
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investigation & Compliance */}
          <Card>
            <CardHeader title={`${currency} Investigation & Compliance Overview`} />
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Trips with Flags</p>
                  <p className="text-2xl font-bold text-yellow-600">{report.tripsWithInvestigations}</p>
                  <p className="text-xs text-gray-400">
                    {typeof report.investigationRate === 'number' ? report.investigationRate.toFixed(1) : '0.0'}% of trips
                  </p>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Total Flags</p>
                  <p className="text-2xl font-bold text-red-600">{report.totalFlags}</p>
                  <p className="text-xs text-gray-400">
                    Avg: {report.avgFlagsPerTrip !== undefined ? report.avgFlagsPerTrip.toFixed(1) : '0.0'}/trip
                  </p>
                </div>
                
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Unresolved</p>
                  <p className="text-2xl font-bold text-amber-600">{report.unresolvedFlags}</p>
                  <p className="text-xs text-gray-400">
                    Require attention
                  </p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Avg Resolution</p>
                  <p className="text-2xl font-bold text-green-600">{typeof report.avgResolutionTime === 'number' ? report.avgResolutionTime.toFixed(1) : '0.0'}</p>
                  <p className="text-xs text-gray-400">days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driver Performance for this currency */}
          <Card>
            <CardHeader title={`${currency} Driver Performance`} />
            <CardContent>
              {report.driverStats && Object.keys(report.driverStats).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 text-sm font-medium text-gray-500">Driver</th>
                        <th className="text-right py-3 text-sm font-medium text-gray-500">Trips</th>
                        <th className="text-right py-3 text-sm font-medium text-gray-500">Revenue</th>
                        <th className="text-right py-3 text-sm font-medium text-gray-500">Expenses</th>
                        <th className="text-right py-3 text-sm font-medium text-gray-500">Net Profit</th>
                        <th className="text-right py-3 text-sm font-medium text-gray-500">Margin %</th>
                        <th className="text-right py-3 text-sm font-medium text-gray-500">Flags</th>
                        <th className="text-right py-3 text-sm font-medium text-gray-500">Client Mix</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(report.driverStats)
                        .sort(([,a], [,b]) => (b as any).revenue - (a as any).revenue)
                        .map(([driver, stats]: [string, any]) => {
                          const netProfit = stats.revenue - stats.expenses;
                          const profitMargin = stats.revenue > 0 ? (netProfit / stats.revenue) * 100 : 0;
                          return (
                            <tr key={driver} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 text-sm font-medium text-gray-900">{driver}</td>
                              <td className="py-3 text-sm text-gray-900 text-right">{stats.trips}</td>
                              <td className="py-3 text-sm text-gray-900 text-right">
                                {formatCurrency(stats.revenue, currency)}
                              </td>
                              <td className="py-3 text-sm text-gray-900 text-right">
                                {formatCurrency(stats.expenses, currency)}
                              </td>
                              <td className={`py-3 text-sm font-medium text-right ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(netProfit, currency)}
                              </td>
                              <td className={`py-3 text-sm text-right ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}> 
                                {typeof profitMargin === 'number' ? profitMargin.toFixed(1) : '0.0'}%
                              </td>
                              <td className="py-3 text-sm text-right">
                                {stats.flags > 0 ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                    {stats.flags}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">0</span>
                                )}
                              </td>
                              <td className="py-3 text-sm text-right">
                                <div className="text-xs">
                                  <div>Int: {stats.internalTrips}</div>
                                  <div>Ext: {stats.externalTrips}</div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No driver data available for {currency} trips</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Filters */}
      <Card>
        <CardHeader 
          title="Fleet Performance Reports by Currency" 
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              icon={<Filter className="w-4 h-4" />}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          }
        />
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(value) => handleFilterChange('startDate', value)}
              />
              <Input
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(value) => handleFilterChange('endDate', value)}
              />
              <Select
                label="Client Type"
                value={filters.clientType}
                onChange={(value) => handleFilterChange('clientType', value)}
                options={[
                  { label: 'All Client Types', value: '' },
                  { label: 'Internal Clients', value: 'internal' },
                  { label: 'External Clients', value: 'external' }
                ]}
              />
              <Select
                label="Driver"
                value={filters.driver}
                onChange={(value) => handleFilterChange('driver', value)}
                options={[
                  { label: 'All Drivers', value: '' },
                  ...uniqueDrivers.map(d => ({ label: d, value: d }))
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

      {/* Combined Fleet Overview */}
      <Card>
        <CardHeader title="Combined Fleet Overview" />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Total Trips</p>
              <p className="text-2xl font-bold text-gray-900">{filteredTrips.length}</p>
              <p className="text-xs text-gray-400">
                USD: {usdTrips.length} • ZAR: {zarTrips.length}
              </p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Building className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-gray-500">Internal Clients</p>
              </div>
              <p className="text-xl font-bold text-blue-600">
                {filteredTrips.filter(t => t.clientType === 'internal').length}
              </p>
              <p className="text-xs text-gray-400">
                {((filteredTrips.filter(t => t.clientType === 'internal').length / (filteredTrips.length || 1)) * 100).toFixed(1)}% of trips
              </p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Users className="w-4 h-4 text-purple-600" />
                <p className="text-sm text-gray-500">External Clients</p>
              </div>
              <p className="text-xl font-bold text-purple-600">
                {filteredTrips.filter(t => t.clientType === 'external').length}
              </p>
              <p className="text-xs text-gray-400">
                {((filteredTrips.filter(t => t.clientType === 'external').length / (filteredTrips.length || 1)) * 100).toFixed(1)}% of trips
              </p>
            </div>
            
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <p className="text-sm text-gray-500">Flagged Trips</p>
              </div>
              <p className="text-xl font-bold text-amber-600">
                {filteredTrips.filter(t => t.costs && t.costs.some(c => c.isFlagged)).length}
              </p>
              <p className="text-xs text-gray-400">
                {((filteredTrips.filter(t => t.costs && t.costs.some(c => c.isFlagged)).length / (filteredTrips.length || 1)) * 100).toFixed(1)}% of trips
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* USD Fleet Report */}
      <CurrencyReportSection 
        report={usdReport} 
        currency="USD" 
        trips={usdTrips} 
      />

      {/* ZAR Fleet Report */}
      <CurrencyReportSection 
        report={zarReport} 
        currency="ZAR" 
        trips={zarTrips} 
      />
    </div>
  );
};

export default CurrencyFleetReport;