import React from 'react';
import { Trip } from '../../types';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { Download, FileSpreadsheet, Calendar, User, Truck, MapPin, DollarSign, TrendingUp, AlertTriangle, FileX } from 'lucide-react';
import { 
  formatDate, 
  formatCurrency, 
  generateReport, 
  downloadTripPDF, 
  downloadTripExcel,
  calculateKPIs
} from '../../utils/helpers';

interface TripReportProps {
  trip: Trip;
}

const TripReport: React.FC<TripReportProps> = ({ trip }) => {
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
                onClick={() => downloadTripExcel(trip.id)}
                icon={<FileSpreadsheet className="w-4 h-4" />}
              >
                Excel
              </Button>
              <Button
                size="sm"
                onClick={() => downloadTripPDF(trip.id)}
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

          {trip.description && (
            <div className="mb-4">
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-gray-900">{trip.description}</p>
            </div>
          )}

          {/* Investigation Alert */}
          {trip.hasInvestigation && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Under Investigation</h4>
                  {trip.investigationDate && (
                    <p className="text-sm text-yellow-700">
                      Flagged on: {formatDate(trip.investigationDate)}
                    </p>
                  )}
                  {trip.investigationNotes && (
                    <p className="text-sm text-yellow-700 mt-1">
                      {trip.investigationNotes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Missing Receipts Alert */}
          {report.missingReceipts.length > 0 && (
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
              <p className="text-xs text-gray-400">{trip.costs.length} entries</p>
            </div>
            
            <div className={`text-center p-4 rounded-lg ${kpis.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm text-gray-500 mb-1">Net Profit/Loss</p>
              <p className={`text-2xl font-bold ${kpis.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(kpis.netProfit, kpis.currency)}
              </p>
              <p className="text-xs text-gray-400">
                {kpis.profitMargin.toFixed(1)}% margin
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
          {report.costBreakdown.length > 0 ? (
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
                        ({item.percentage.toFixed(1)}%)
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
      {trip.costs.length > 0 && (
        <Card>
          <CardHeader title="Detailed Cost Entries" />
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Category</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Reference</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Notes</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Attachments</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Amount ({kpis.currency})</th>
                  </tr>
                </thead>
                <tbody>
                  {trip.costs.map((cost) => (
                    <tr key={cost.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 text-sm text-gray-900">{formatDate(cost.date)}</td>
                      <td className="py-3 text-sm text-gray-900">{cost.category}</td>
                      <td className="py-3 text-sm text-gray-600">{cost.referenceNumber || '-'}</td>
                      <td className="py-3 text-sm text-gray-600 max-w-xs truncate">
                        {cost.notes || '-'}
                      </td>
                      <td className="py-3 text-sm">
                        {cost.attachments && cost.attachments.length > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            {cost.attachments.length} file(s)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                            Missing
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(cost.amount, kpis.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50">
                    <td colSpan={5} className="py-3 text-sm font-medium text-gray-900">
                      Total Expenses
                    </td>
                    <td className="py-3 text-sm font-bold text-gray-900 text-right">
                      {formatCurrency(report.totalCosts, kpis.currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TripReport;