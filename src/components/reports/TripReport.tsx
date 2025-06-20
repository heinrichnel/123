// ─── React ───────────────────────────────────────────────────────
import React from 'react';

// ─── Types ───────────────────────────────────────────────────────
import { Trip } from '../../types';

// ─── UI Components ───────────────────────────────────────────────
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';

// ─── Icons ───────────────────────────────────────────────────────
import {
  AlertTriangle,
  Calendar,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileX,
  MapPin,
  Truck,
  TrendingUp,
  User
} from 'lucide-react';

// ─── Helper Functions ────────────────────────────────────────────
import {
  formatDate,
  formatCurrency,
  calculateKPIs,
  generateReport,
  downloadTripPDF,
  downloadTripExcel
} from '../../utils/helpers';


interface TripReportProps {
  trip: Trip;
}

const TripReport: React.FC<TripReportProps> = ({ trip }) => {
  // Ensure trip has costs array to prevent errors
  if (!trip.costs) {
    trip.costs = [];
  }
  
  const report = generateReport(trip);
  const kpis = calculateKPIs(trip);

  return (
    <div className="space-y-6">
      {/* Trip Summary */}
      <Card>
        <CardHeader 
          title={`Trip Report - Fleet ${trip.fleetNumber}`}
          action={
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadTripExcel(trip)}
                icon={<FileSpreadsheet className="w-4 h-4" />}
              >
                Excel
              </Button>
              <Button
                size="sm"
                onClick={() => downloadTripPDF(trip)}
                icon={<Download className="w-4 h-4" />}
              >
                PDF Report
              </Button>
            </div>
          }
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <Truck className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Fleet Number</p>
                <p className="font-medium">{trip.fleetNumber}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Driver</p>
                <p className="font-medium">{trip.driverName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">
                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Route</p>
                <p className="font-medium">{trip.route}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Client</p>
                <p className="font-medium">{trip.clientName}</p>
              </div>
            </div>
            
            {trip.distanceKm && (
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-500">Distance</p>
                  <p className="font-medium">{trip.distanceKm} km</p>
                </div>
              </div>
            )}
          </div>

          {trip.tripDescription && (
            <div className="mb-4">
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-gray-900">{trip.tripDescription}</p>
            </div>
          )}

          {/* Investigation Alert */}
          {trip.investigationNotes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Under Investigation</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    {trip.investigationNotes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Missing Receipts Alert */}
          {report?.missingReceipts?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <FileX className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Missing Documentation</h4>
                  <p className="text-sm text-red-700">
                    {report.missingReceipts.length} cost entries are missing receipts or documentation
                  </p>
                  <ul className="text-sm text-red-700 mt-2 space-y-1">
                    {report.missingReceipts.slice(0, 3).map((cost) => (
                      <li key={cost.id}>
                        • {cost.category} - {formatCurrency(cost.amount, kpis.currency)} ({formatDate(cost.date)})
                      </li>
                    ))}
                    {report.missingReceipts.length > 3 && (
                      <li className="font-medium">
                        ... and {report.missingReceipts.length - 3} more
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial KPIs */}
      <Card>
        <CardHeader title="Financial Performance" />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(kpis.totalRevenue, kpis.currency)}
              </p>
              <p className="text-xs text-gray-400">{kpis.currency}</p>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(kpis.totalExpenses, kpis.currency)}
              </p>
              <p className="text-xs text-gray-400">{trip.costs?.length || 0} entries</p>
            </div>
            
            <div className={`text-center p-4 rounded-lg ${kpis.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm text-gray-500 mb-1">Net Profit/Loss</p>
              <p className={`text-2xl font-bold ${kpis.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(kpis.netProfit, kpis.currency)}
              </p>
              <p className="text-xs text-gray-400">
                {typeof kpis.profitMargin === 'number' ? kpis.profitMargin.toFixed(1) : '0.0'}% margin
              </p>
            </div>
            
            {kpis.costPerKm > 0 && (
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Cost per KM</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(kpis.costPerKm, kpis.currency)}
                </p>
                <p className="text-xs text-gray-400">per kilometer</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader title="Cost Breakdown by Category" />
        <CardContent>
          {report?.costBreakdown?.length > 0 ? (
            <div className="space-y-3">
              {report.costBreakdown.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-gray-200">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: `hsl(${index * 45}, 70%, 50%)` }}
                    />
                    <div>
                      <span className="font-medium text-gray-900">{item.category}</span>
                      <span className="ml-2 text-sm text-gray-500">
                        ({typeof item.percentage === 'number' ? item.percentage.toFixed(1) : '0.0'}%)
                      </span>
                    </div>
                  </div>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(item.total, kpis.currency)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No cost data available</p>
          )}
        </CardContent>
      </Card>

      {/* Detailed Cost Entries */}
      {trip.costs && trip.costs.length > 0 && (
        <Card>
          <CardHeader title="Detailed Cost Entries" />
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Sub-Category</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Currency</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Attachments</th>
                    <th className="px-4 py-2">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {trip.costs.map(cost => (
                    <tr key={cost.id} className="border-b border-gray-200">
                      <td className="px-4 py-2">{cost.category}</td>
                      <td className="px-4 py-2">{cost.subCategory}</td>
                      <td className="px-4 py-2">{formatCurrency(cost.amount, cost.currency)}</td>
                      <td className="px-4 py-2">{cost.currency}</td>
                      <td className="px-4 py-2">{formatDate(cost.date)}</td>
                      <td className="px-4 py-2">
                        {cost.attachments?.length || 0}
                      </td>
                      <td className="px-4 py-2">
                        {cost.isSystemGenerated ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            System
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Manual
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TripReport;