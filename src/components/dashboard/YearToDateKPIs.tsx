import React, { useState, useMemo } from 'react';
import { Trip } from '../../types';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { Input } from '../ui/FormElements';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Navigation, 
  BarChart3, 
  Calendar,
  Edit,
  Save,
  X,
  AlertTriangle,
  Target,
  Award,
  Activity,
  Download
} from 'lucide-react';
import { formatCurrency, calculateTotalCosts } from '../../utils/helpers';
import Modal from '../ui/Modal';

interface YTDMetrics {
  year: number;
  totalKms: number;
  ipk: number; // Income per KM
  operationalCpk: number; // Operational Cost per KM
  revenue: number;
  ebit: number;
  ebitMargin: number;
  netProfit: number;
  netProfitMargin: number;
  roe: number; // Return on Equity
  roic: number; // Return on Invested Capital
  lastUpdated: string;
  updatedBy: string;
}

interface WeeklyMetrics {
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  totalRevenue: number;
  totalCosts: number;
  grossProfit: number;
  totalKilometers: number;
  ipk: number;
  cpk: number;
  tripCount: number;
  profitMargin: number;
}

interface YearToDateKPIsProps {
  trips: Trip[];
}

const YearToDateKPIs: React.FC<YearToDateKPIsProps> = ({ trips }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingYear, setEditingYear] = useState<2024 | 2025 | null>(null);
  const [formData, setFormData] = useState<Partial<YTDMetrics>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Current YTD data - will be updated monthly on 15th
  const [ytdData, setYtdData] = useState<Record<number, YTDMetrics>>({
    2025: {
      year: 2025,
      totalKms: 358013,
      ipk: 2.03,
      operationalCpk: 1.80,
      revenue: 726150.00,
      ebit: 114342.00,
      ebitMargin: 15.70,
      netProfit: 79552.00,
      netProfitMargin: 11.0,
      roe: 19.0,
      roic: 32.0,
      lastUpdated: '2025-01-15T00:00:00Z',
      updatedBy: 'Fleet Manager'
    },
    2024: {
      year: 2024,
      totalKms: 279360,
      ipk: 2.06,
      operationalCpk: 2.11,
      revenue: 611387.00,
      ebit: 46998.00,
      ebitMargin: 7.70,
      netProfit: 4780.00,
      netProfitMargin: 1.0,
      roe: 1.0,
      roic: 9.0,
      lastUpdated: '2024-12-31T00:00:00Z',
      updatedBy: 'Operations Manager'
    }
  });

  // Calculate weekly metrics from completed trips
  const weeklyMetrics = useMemo(() => {
    const completedTrips = trips.filter(trip => 
      trip.status === 'completed' || trip.status === 'invoiced' || trip.status === 'paid'
    );

    // Group trips by week based on offloading date (or end date if no offloading date)
    const weeklyData: Record<string, WeeklyMetrics> = {};

    completedTrips.forEach(trip => {
      // Use finalOffloadDateTime, actualOffloadDateTime, or endDate as trigger
      const offloadDate = trip.finalOffloadDateTime || trip.actualOffloadDateTime || trip.endDate;
      const date = new Date(offloadDate);
      
      // Get Monday of the week
      const monday = new Date(date);
      monday.setDate(date.getDate() - date.getDay() + 1);
      
      // Get Sunday of the week
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      const weekKey = `${monday.getFullYear()}-W${getWeekNumber(monday)}`;
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          weekNumber: getWeekNumber(monday),
          weekStart: monday.toISOString().split('T')[0],
          weekEnd: sunday.toISOString().split('T')[0],
          totalRevenue: 0,
          totalCosts: 0,
          grossProfit: 0,
          totalKilometers: 0,
          ipk: 0,
          cpk: 0,
          tripCount: 0,
          profitMargin: 0
        };
      }

      const week = weeklyData[weekKey];
      const tripCosts = calculateTotalCosts(trip.costs);
      const additionalCosts = trip.additionalCosts?.reduce((sum, cost) => sum + cost.amount, 0) || 0;
      const totalTripCosts = tripCosts + additionalCosts;

      week.totalRevenue += trip.baseRevenue;
      week.totalCosts += totalTripCosts;
      week.grossProfit += (trip.baseRevenue - totalTripCosts);
      week.totalKilometers += trip.distanceKm || 0;
      week.tripCount += 1;
    });

    // Calculate IPK, CPK, and profit margin for each week
    Object.values(weeklyData).forEach(week => {
      week.ipk = week.totalKilometers > 0 ? week.totalRevenue / week.totalKilometers : 0;
      week.cpk = week.totalKilometers > 0 ? week.totalCosts / week.totalKilometers : 0;
      week.profitMargin = week.totalRevenue > 0 ? (week.grossProfit / week.totalRevenue) * 100 : 0;
    });

    return Object.values(weeklyData).sort((a, b) => 
      new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
    );
  }, [trips]);

  // Helper function to get week number
  function getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  const current2025 = ytdData[2025];
  const previous2024 = ytdData[2024];

  // Calculate year-over-year changes
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, percentage: 0 };
    const change = current - previous;
    const percentage = (change / previous) * 100;
    return { value: change, percentage };
  };

  const kmsChange = calculateChange(current2025.totalKms, previous2024.totalKms);
  const ipkChange = calculateChange(current2025.ipk, previous2024.ipk);
  const cpkChange = calculateChange(current2025.operationalCpk, previous2024.operationalCpk);
  const revenueChange = calculateChange(current2025.revenue, previous2024.revenue);
  const ebitChange = calculateChange(current2025.ebit, previous2024.ebit);
  const netProfitChange = calculateChange(current2025.netProfit, previous2024.netProfit);
  const roeChange = calculateChange(current2025.roe, previous2024.roe);
  const roicChange = calculateChange(current2025.roic, previous2024.roic);

  const handleEdit = (year: 2024 | 2025) => {
    setEditingYear(year);
    setFormData({ ...ytdData[year] });
    setShowEditModal(true);
  };

  const handleChange = (field: string, value: string) => {
    const numValue = parseFloat(value);
    setFormData(prev => ({ ...prev, [field]: numValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.totalKms || formData.totalKms <= 0) {
      newErrors.totalKms = 'Total KMs must be greater than 0';
    }
    if (!formData.revenue || formData.revenue <= 0) {
      newErrors.revenue = 'Revenue must be greater than 0';
    }
    if (!formData.ipk || formData.ipk <= 0) {
      newErrors.ipk = 'IPK must be greater than 0';
    }
    if (!formData.operationalCpk || formData.operationalCpk <= 0) {
      newErrors.operationalCpk = 'Operational CPK must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!editingYear || !validateForm()) return;

    const updatedData = {
      ...formData,
      year: editingYear,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'Current User'
    } as YTDMetrics;

    setYtdData(prev => ({
      ...prev,
      [editingYear]: updatedData
    }));

    setShowEditModal(false);
    setEditingYear(null);
    setFormData({});
    setErrors({});

    alert(`${editingYear} YTD metrics updated successfully!\n\nData will be used for monthly performance tracking and year-over-year comparisons.`);
  };

  const handleClose = () => {
    setShowEditModal(false);
    setEditingYear(null);
    setFormData({});
    setErrors({});
  };

  const exportWeeklyReport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "WEEKLY REVENUE REPORTING - AUTOMATED CYCLE\n";
    csvContent += `Generated on,${new Date().toLocaleDateString()}\n`;
    csvContent += "Based on completed trips using offloading dates\n\n";
    
    csvContent += "Week Number,Week Start,Week End,Trip Count,Total Revenue,Total Costs,Gross Profit,Profit Margin %,Total KM,IPK,CPK\n";
    weeklyMetrics.forEach(week => {
      csvContent += `${week.weekNumber},"${week.weekStart}","${week.weekEnd}",${week.tripCount},${week.totalRevenue.toFixed(2)},${week.totalCosts.toFixed(2)},${week.grossProfit.toFixed(2)},${week.profitMargin.toFixed(2)},${week.totalKilometers},${week.ipk.toFixed(3)},${week.cpk.toFixed(3)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `weekly-revenue-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const MetricCard = ({ 
    title, 
    current, 
    previous, 
    change, 
    format = 'number',
    suffix = '',
    icon: Icon,
    colorClass = 'text-blue-600'
  }: {
    title: string;
    current: number;
    previous: number;
    change: { value: number; percentage: number };
    format?: 'number' | 'currency' | 'percentage';
    suffix?: string;
    icon: any;
    colorClass?: string;
  }) => {
    const formatValue = (value: number) => {
      switch (format) {
        case 'currency':
          return formatCurrency(value, 'USD');
        case 'percentage':
          return `${value.toFixed(1)}%`;
        default:
          return value.toLocaleString();
      }
    };

    const isPositive = change.percentage > 0;
    const isNegative = change.percentage < 0;
    
    // For operational costs, negative change is good (cost reduction)
    const isGoodChange = title.includes('Operational') ? isNegative : isPositive;

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-gray-50`}>
                <Icon className={`w-6 h-6 ${colorClass}`} />
              </div>
              <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            </div>
          </div>

          <div className="space-y-3">
            {/* 2025 Current */}
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-gray-900">
                  {formatValue(current)}{suffix}
                </span>
                <span className="text-sm text-gray-500">2025 YTD</span>
              </div>
            </div>

            {/* 2024 Previous */}
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-lg font-medium text-gray-600">
                  {formatValue(previous)}{suffix}
                </span>
                <span className="text-sm text-gray-500">2024 YTD</span>
              </div>
            </div>

            {/* Change Indicator */}
            <div className="flex items-center space-x-2">
              {change.percentage !== 0 && (
                <>
                  {isGoodChange ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${isGoodChange ? 'text-green-600' : 'text-red-600'}`}>
                    {change.percentage > 0 ? '+' : ''}{change.percentage.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">vs 2024</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">YTD KPIs</h1>
          <p className="text-lg text-gray-600 mt-2">Mtanauska Transport Performance Dashboard</p>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {new Date(current2025.lastUpdated).toLocaleDateString()} by {current2025.updatedBy}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => handleEdit(2024)}
            icon={<Edit className="w-4 h-4" />}
          >
            Edit 2024 Data
          </Button>
          <Button
            onClick={() => handleEdit(2025)}
            icon={<Edit className="w-4 h-4" />}
          >
            Edit 2025 Data
          </Button>
        </div>
      </div>

      {/* Update Schedule Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start space-x-3">
          <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-800">Monthly Update Schedule</h4>
            <p className="text-sm text-blue-700 mt-1">
              YTD metrics are updated manually on the 15th of every month. Data is independent of trip-based calculations and maintained separately for strategic reporting.
            </p>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Kilometers"
          current={current2025.totalKms}
          previous={previous2024.totalKms}
          change={kmsChange}
          icon={Navigation}
          colorClass="text-purple-600"
        />

        <MetricCard
          title="Income Per KM (IPK)"
          current={current2025.ipk}
          previous={previous2024.ipk}
          change={ipkChange}
          format="currency"
          icon={DollarSign}
          colorClass="text-green-600"
        />

        <MetricCard
          title="Operational Cost Per KM"
          current={current2025.operationalCpk}
          previous={previous2024.operationalCpk}
          change={cpkChange}
          format="currency"
          icon={TrendingDown}
          colorClass="text-red-600"
        />

        <MetricCard
          title="Total Revenue"
          current={current2025.revenue}
          previous={previous2024.revenue}
          change={revenueChange}
          format="currency"
          icon={DollarSign}
          colorClass="text-green-600"
        />

        <MetricCard
          title="EBIT"
          current={current2025.ebit}
          previous={previous2024.ebit}
          change={ebitChange}
          format="currency"
          icon={TrendingUp}
          colorClass="text-blue-600"
        />

        <MetricCard
          title="Net Profit"
          current={current2025.netProfit}
          previous={previous2024.netProfit}
          change={netProfitChange}
          format="currency"
          icon={Award}
          colorClass="text-green-600"
        />
      </div>

      {/* Margin & Return Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="EBIT Margin"
          current={current2025.ebitMargin}
          previous={previous2024.ebitMargin}
          change={calculateChange(current2025.ebitMargin, previous2024.ebitMargin)}
          format="percentage"
          icon={BarChart3}
          colorClass="text-blue-600"
        />

        <MetricCard
          title="Net Profit Margin"
          current={current2025.netProfitMargin}
          previous={previous2024.netProfitMargin}
          change={calculateChange(current2025.netProfitMargin, previous2024.netProfitMargin)}
          format="percentage"
          icon={Target}
          colorClass="text-green-600"
        />

        <MetricCard
          title="Return on Equity (ROE)"
          current={current2025.roe}
          previous={previous2024.roe}
          change={roeChange}
          format="percentage"
          icon={TrendingUp}
          colorClass="text-purple-600"
        />

        <MetricCard
          title="Return on Invested Capital (ROIC)"
          current={current2025.roic}
          previous={previous2024.roic}
          change={roicChange}
          format="percentage"
          icon={Activity}
          colorClass="text-orange-600"
        />
      </div>

      {/* Weekly Revenue Reporting */}
      <Card>
        <CardHeader 
          title="Automated Weekly Revenue Reporting" 
          subtitle="Fixed weekly cycle (Monday to Sunday) based on trip offloading dates"
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={exportWeeklyReport}
              icon={<Download className="w-4 h-4" />}
            >
              Export Weekly Report
            </Button>
          }
        />
        <CardContent>
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <h4 className="text-sm font-medium text-green-800 mb-2">Automated Calculation Logic</h4>
            <div className="text-sm text-green-700 space-y-1">
              <p>• <strong>Trigger:</strong> Offloading date marks trip completion and inclusion in weekly report</p>
              <p>• <strong>Revenue:</strong> Base revenue from completed trips</p>
              <p>• <strong>Costs:</strong> Fixed costs (per day) + Variable costs (per km) + Additional costs</p>
              <p>• <strong>IPK:</strong> Trip Revenue ÷ Total Kilometers</p>
              <p>• <strong>CPK:</strong> Total Trip Cost ÷ Total Kilometers</p>
              <p>• <strong>Cycle:</strong> Monday to Sunday, automatically rolls over at midnight</p>
            </div>
          </div>

          {weeklyMetrics.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Week</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Period</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Trips</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Revenue</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Costs</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Gross Profit</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Margin %</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">KM</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">IPK</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">CPK</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyMetrics.slice(0, 12).map((week, index) => (
                    <tr key={`${week.weekStart}-${week.weekNumber}`} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 text-sm font-medium text-gray-900">
                        Week {week.weekNumber}
                      </td>
                      <td className="py-3 text-sm text-gray-900">
                        {new Date(week.weekStart).toLocaleDateString()} - {new Date(week.weekEnd).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-sm text-gray-900 text-right">{week.tripCount}</td>
                      <td className="py-3 text-sm font-medium text-green-600 text-right">
                        {formatCurrency(week.totalRevenue, 'ZAR')}
                      </td>
                      <td className="py-3 text-sm font-medium text-red-600 text-right">
                        {formatCurrency(week.totalCosts, 'ZAR')}
                      </td>
                      <td className={`py-3 text-sm font-medium text-right ${week.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(week.grossProfit, 'ZAR')}
                      </td>
                      <td className={`py-3 text-sm font-medium text-right ${week.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {week.profitMargin.toFixed(1)}%
                      </td>
                      <td className="py-3 text-sm text-gray-900 text-right">
                        {week.totalKilometers.toLocaleString()}
                      </td>
                      <td className="py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(week.ipk, 'ZAR')}
                      </td>
                      <td className="py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(week.cpk, 'ZAR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No completed trips yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Weekly metrics will appear here once trips are completed and offloaded.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader title="Year-over-Year Performance Summary" />
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Operational Efficiency */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Operational Efficiency</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Distance Coverage</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-purple-600">
                      +{kmsChange.value.toLocaleString()} km
                    </span>
                    <p className="text-xs text-gray-500">
                      {kmsChange.percentage.toFixed(1)}% increase
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Cost Efficiency</span>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${cpkChange.percentage < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {cpkChange.percentage > 0 ? '+' : ''}{formatCurrency(cpkChange.value, 'USD')}
                    </span>
                    <p className="text-xs text-gray-500">
                      {cpkChange.percentage.toFixed(1)}% {cpkChange.percentage < 0 ? 'improvement' : 'increase'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Revenue per KM</span>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${ipkChange.percentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {ipkChange.percentage > 0 ? '+' : ''}{formatCurrency(ipkChange.value, 'USD')}
                    </span>
                    <p className="text-xs text-gray-500">
                      {ipkChange.percentage.toFixed(1)}% {ipkChange.percentage > 0 ? 'increase' : 'decrease'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Performance */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Revenue Growth</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-green-600">
                      +{formatCurrency(revenueChange.value, 'USD')}
                    </span>
                    <p className="text-xs text-gray-500">
                      {revenueChange.percentage.toFixed(1)}% increase
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">EBIT Improvement</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-600">
                      +{formatCurrency(ebitChange.value, 'USD')}
                    </span>
                    <p className="text-xs text-gray-500">
                      {ebitChange.percentage.toFixed(1)}% increase
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Net Profit Growth</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-purple-600">
                      +{formatCurrency(netProfitChange.value, 'USD')}
                    </span>
                    <p className="text-xs text-gray-500">
                      {netProfitChange.percentage.toFixed(0)}% increase
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Key Performance Insights</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• <strong>Exceptional Growth:</strong> Net profit increased by {netProfitChange.percentage.toFixed(0)}% year-over-year, demonstrating strong operational improvements</p>
              <p>• <strong>Efficiency Gains:</strong> {cpkChange.percentage < 0 ? 'Operational costs per KM decreased' : 'Operational costs per KM increased'} by {Math.abs(cpkChange.percentage).toFixed(1)}%</p>
              <p>• <strong>Scale Expansion:</strong> Total distance coverage increased by {kmsChange.percentage.toFixed(1)}%, showing business growth</p>
              <p>• <strong>Return Performance:</strong> ROE improved from {previous2024.roe}% to {current2025.roe}%, ROIC from {previous2024.roic}% to {current2025.roic}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleClose}
        title={`Edit ${editingYear} YTD Metrics`}
        maxWidth="lg"
      >
        {formData && editingYear && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800">Monthly Update - {editingYear}</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Update YTD metrics for strategic reporting. These values are independent of trip-based calculations 
                    and should be updated monthly on the 15th based on comprehensive financial analysis.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Total Kilometers"
                type="number"
                step="1"
                value={formData.totalKms?.toString() || ''}
                onChange={(e) => handleChange('totalKms', e.target.value)}
                error={errors.totalKms}
              />

              <Input
                label="Income Per KM (IPK) - USD"
                type="number"
                step="0.01"
                value={formData.ipk?.toString() || ''}
                onChange={(e) => handleChange('ipk', e.target.value)}
                error={errors.ipk}
              />

              <Input
                label="Operational Cost Per KM - USD"
                type="number"
                step="0.01"
                value={formData.operationalCpk?.toString() || ''}
                onChange={(e) => handleChange('operationalCpk', e.target.value)}
                error={errors.operationalCpk}
              />

              <Input
                label="Total Revenue - USD"
                type="number"
                step="0.01"
                value={formData.revenue?.toString() || ''}
                onChange={(e) => handleChange('revenue', e.target.value)}
                error={errors.revenue}
              />

              <Input
                label="EBIT - USD"
                type="number"
                step="0.01"
                value={formData.ebit?.toString() || ''}
                onChange={(e) => handleChange('ebit', e.target.value)}
              />

              <Input
                label="EBIT Margin (%)"
                type="number"
                step="0.01"
                value={formData.ebitMargin?.toString() || ''}
                onChange={(e) => handleChange('ebitMargin', e.target.value)}
              />

              <Input
                label="Net Profit - USD"
                type="number"
                step="0.01"
                value={formData.netProfit?.toString() || ''}
                onChange={(e) => handleChange('netProfit', e.target.value)}
              />

              <Input
                label="Net Profit Margin (%)"
                type="number"
                step="0.01"
                value={formData.netProfitMargin?.toString() || ''}
                onChange={(e) => handleChange('netProfitMargin', e.target.value)}
              />

              <Input
                label="Return on Equity (ROE) (%)"
                type="number"
                step="0.01"
                value={formData.roe?.toString() || ''}
                onChange={(e) => handleChange('roe', e.target.value)}
              />

              <Input
                label="Return on Invested Capital (ROIC) (%)"
                type="number"
                step="0.01"
                value={formData.roic?.toString() || ''}
                onChange={(e) => handleChange('roic', e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleClose}
                icon={<X className="w-4 h-4" />}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                icon={<Save className="w-4 h-4" />}
              >
                Save {editingYear} Metrics
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default YearToDateKPIs;