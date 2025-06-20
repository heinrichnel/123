import { Trip, CostEntry, FlaggedCost } from '../types/index';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

// -------------------- ID Generation --------------------

export const generateTripId = (): string => {
  return uuidv4();
};

// -------------------- Date Formatting --------------------

export const formatDate = (date: string | Date): string => {
  if (!date) return 'N/A';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid Date';
  }
};

export const formatDateTime = (date: string | Date): string => {
  if (!date) return 'N/A';
  try {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('DateTime formatting error:', error);
    return 'Invalid Date';
  }
};

// -------------------- Currency Formatting --------------------

export const formatCurrency = (
  amount: number,
  currency: 'USD' | 'ZAR' = 'ZAR'
): string => {
  if (amount === undefined || amount === null) return currency === 'USD' ? '$0.00' : 'R0.00';
  try {
    const symbol = currency === 'USD' ? '$' : 'R';
    return `${symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } catch (error) {
    console.error('Currency formatting error:', error);
    return currency === 'USD' ? '$0.00' : 'R0.00';
  }
};

// -------------------- Core Trip Calculations --------------------

export const calculateTotalCosts = (costs: CostEntry[]): number => {
  if (!costs || !Array.isArray(costs)) return 0;
  return costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);
};

export const calculateKPIs = (trip: Trip) => {
  try {
    const totalRevenue = trip.baseRevenue || 0;
    const totalExpenses = calculateTotalCosts(trip.costs || []);
    const additionalCosts = trip.additionalCosts?.reduce((sum, cost) => sum + cost.amount, 0) || 0;
    const total = totalExpenses + additionalCosts;
    const netProfit = totalRevenue - total;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const costPerKm = trip.distanceKm && trip.distanceKm > 0 ? total / trip.distanceKm : 0;

    return {
      totalRevenue,
      totalExpenses: total,
      netProfit,
      profitMargin,
      costPerKm,
      currency: trip.revenueCurrency,
    };
  } catch (error) {
    console.error('Error calculating KPIs:', error);
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      profitMargin: 0,
      costPerKm: 0,
      currency: trip.revenueCurrency || 'ZAR',
    };
  }
};

// -------------------- Flag & Compliance Logic --------------------

export const getFlaggedCostsCount = (costs: CostEntry[]): number =>
  costs?.filter((cost) => cost.isFlagged).length || 0;

export const getUnresolvedFlagsCount = (costs: CostEntry[]): number =>
  costs?.filter((cost) => cost.isFlagged && cost.investigationStatus !== 'resolved').length || 0;

export const canCompleteTrip = (trip: Trip): boolean =>
  getUnresolvedFlagsCount(trip.costs || []) === 0;

export const shouldAutoCompleteTrip = (trip: Trip): boolean =>
  trip.status === 'active' &&
  trip.costs.some((c) => c.isFlagged) &&
  getUnresolvedFlagsCount(trip.costs || []) === 0;

// -------------------- Filtering Functions --------------------

export const filterTripsByDateRange = (
  trips: Trip[],
  startDate?: string,
  endDate?: string
): Trip[] => {
  if (!trips) return [];
  return trips.filter((trip) => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    if (startDate && start < new Date(startDate)) return false;
    if (endDate && end > new Date(endDate)) return false;
    return true;
  });
};

export const filterTripsByClient = (trips: Trip[], client: string): Trip[] =>
  !client ? trips : trips.filter((trip) => trip.clientName === client);

export const filterTripsByCurrency = (trips: Trip[], currency: string): Trip[] =>
  !currency ? trips : trips.filter((trip) => trip.revenueCurrency === currency);

export const filterTripsByDriver = (trips: Trip[], driver: string): Trip[] =>
  !driver ? trips : trips.filter((trip) => trip.driverName === driver);

// -------------------- Utility Functions --------------------

export const isOnline = (): boolean => navigator.onLine;

export const retryOperation = async (
  operation: () => Promise<any>,
  maxRetries = 3,
  delay = 1000
): Promise<any> => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (err) {
      console.warn(`Retry ${i + 1}/${maxRetries} failed`, err);
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw lastError;
};

export const getFileIcon = (fileType: string): string => {
  if (!fileType) return 'Paperclip';
  if (fileType.includes('pdf')) return 'FileText';
  if (fileType.includes('image')) return 'Image';
  return 'Paperclip';
};

// -------------------- Helper to clean objects for Firestore --------------------

export const cleanObjectForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanObjectForFirestore);
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanObjectForFirestore(value);
      }
    }
    return cleaned;
  }
  
  return obj;
};

// -------------------- Download Placeholders --------------------

export const downloadTripPDF = async (trip: Trip) => {
  try {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Trip Report', 10, 10);
    doc.setFontSize(10);
    const fields = [
      ['Fleet Number', trip.fleetNumber],
      ['Client', trip.clientName],
      ['Driver', trip.driverName],
      ['Route', trip.route],
      ['Start Date', trip.startDate],
      ['End Date', trip.endDate],
      ['Distance (KM)', String(trip.distanceKm)],
      ['Base Revenue', String(trip.baseRevenue)],
      ['Revenue Currency', trip.revenueCurrency],
      ['Trip Description', trip.tripDescription || ''],
      ['Trip Notes', trip.tripNotes || '']
    ];
    let y = 20;
    fields.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 10, y);
      y += 7;
    });
    doc.save(`Trip_${trip.fleetNumber}_${trip.startDate}.pdf`);
  } catch (error) {
    console.error('Error exporting trip to PDF:', error);
    alert('Failed to export trip to PDF.');
  }
};

export const downloadTripExcel = async (trip: Trip) => {
  try {
    const wsData = [
      [
        'Fleet Number', 'Client', 'Driver', 'Route', 'Start Date', 'End Date', 'Distance (KM)', 'Base Revenue', 'Revenue Currency', 'Trip Description', 'Trip Notes'
      ],
      [
        trip.fleetNumber,
        trip.clientName,
        trip.driverName,
        trip.route,
        trip.startDate,
        trip.endDate,
        trip.distanceKm,
        trip.baseRevenue,
        trip.revenueCurrency,
        trip.tripDescription || '',
        trip.tripNotes || ''
      ]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trip');
    XLSX.writeFile(wb, `Trip_${trip.fleetNumber}_${trip.startDate}.xlsx`);
  } catch (error) {
    console.error('Error exporting trip to Excel:', error);
    alert('Failed to export trip to Excel.');
  }
};

// -------------------- Report Generation --------------------

// Generate report for a single trip (used by TripReport component)
export const generateReport = (trip: Trip) => {
  try {
    const costs = trip.costs || [];
    
    // Calculate cost breakdown by category
    const categoryTotals: Record<string, number> = {};
    costs.forEach(cost => {
      const category = cost.category || 'Other';
      categoryTotals[category] = (categoryTotals[category] || 0) + cost.amount;
    });

    const totalCosts = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    
    const costBreakdown = Object.entries(categoryTotals).map(([category, total]) => ({
      category,
      total,
      percentage: totalCosts > 0 ? (total / totalCosts) * 100 : 0
    })).sort((a, b) => b.total - a.total);

    // Find missing receipts
    const missingReceipts = costs.filter(cost => 
      !cost.attachments || cost.attachments.length === 0
    );

    return {
      costBreakdown,
      missingReceipts,
      totalCosts,
      totalEntries: costs.length
    };
  } catch (error) {
    console.error('Error generating report:', error);
    return {
      costBreakdown: [],
      missingReceipts: [],
      totalCosts: 0,
      totalEntries: 0
    };
  }
};

// Placeholder for multiple trips report generation
export const generatePlaceholderReportForMultipleTrips = async (trips: Trip[]) => {
  try {
    alert(`Generating report for ${trips.length} trip(s)...`);
    // TODO: Implement real export
  } catch (error) {
    console.error('Error generating report:', error);
  }
};

export const generateCurrencyFleetReport = (trips: Trip[], currency: 'USD' | 'ZAR') => {
  try {
    // Calculate basic metrics
    const totalTrips = trips.length;
    const activeTrips = trips.filter(t => t.status === 'active').length;
    const completedTrips = trips.filter(t => t.status === 'completed' || t.status === 'invoiced' || t.status === 'paid').length;
    
    const totalRevenue = trips.reduce((sum, trip) => sum + (trip.baseRevenue || 0), 0);
    const totalExpenses = trips.reduce((sum, trip) => sum + calculateTotalCosts(trip.costs || []), 0);
    const netProfit = totalRevenue - totalExpenses;
    
    const avgRevenuePerTrip = totalTrips > 0 ? totalRevenue / totalTrips : 0;
    const avgCostPerTrip = totalTrips > 0 ? totalExpenses / totalTrips : 0;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    // Client type breakdown
    const internalTrips = trips.filter(t => t.clientType === 'internal').length;
    const externalTrips = trips.filter(t => t.clientType === 'external').length;
    
    const internalRevenue = trips
      .filter(t => t.clientType === 'internal')
      .reduce((sum, trip) => sum + (trip.baseRevenue || 0), 0);
    
    const externalRevenue = trips
      .filter(t => t.clientType === 'external')
      .reduce((sum, trip) => sum + (trip.baseRevenue || 0), 0);
    
    const internalExpenses = trips
      .filter(t => t.clientType === 'internal')
      .reduce((sum, trip) => sum + calculateTotalCosts(trip.costs || []), 0);
    
    const externalExpenses = trips
      .filter(t => t.clientType === 'external')
      .reduce((sum, trip) => sum + calculateTotalCosts(trip.costs || []), 0);
    
    const internalProfit = internalRevenue - internalExpenses;
    const externalProfit = externalRevenue - externalExpenses;
    
    const internalProfitMargin = internalRevenue > 0 ? (internalProfit / internalRevenue) * 100 : 0;
    const externalProfitMargin = externalRevenue > 0 ? (externalProfit / externalRevenue) * 100 : 0;
    
    // Investigation metrics
    const tripsWithInvestigations = trips.filter(t => t.costs && t.costs.some(c => c.isFlagged)).length;
    const totalFlags = trips.reduce((sum, trip) => sum + getFlaggedCostsCount(trip.costs || []), 0);
    const unresolvedFlags = trips.reduce((sum, trip) => sum + getUnresolvedFlagsCount(trip.costs || []), 0);
    
    const investigationRate = totalTrips > 0 ? (tripsWithInvestigations / totalTrips) * 100 : 0;
    const avgFlagsPerTrip = totalTrips > 0 ? totalFlags / totalTrips : 0;
    
    // Calculate average resolution time
    let totalResolutionTime = 0;
    let resolvedFlagsCount = 0;
    
    trips.forEach(trip => {
      if (!trip.costs) return;
      
      trip.costs.forEach(cost => {
        if (cost.isFlagged && cost.flaggedAt && cost.resolvedAt && cost.investigationStatus === 'resolved') {
          const flaggedDate = new Date(cost.flaggedAt);
          const resolvedDate = new Date(cost.resolvedAt);
          const resolutionTime = (resolvedDate.getTime() - flaggedDate.getTime()) / (1000 * 60 * 60 * 24); // in days
          totalResolutionTime += resolutionTime;
          resolvedFlagsCount++;
        }
      });
    });
    
    const avgResolutionTime = resolvedFlagsCount > 0 ? totalResolutionTime / resolvedFlagsCount : 0;
    
    // Driver statistics
    const driverStats: Record<string, any> = {};
    
    trips.forEach(trip => {
      const driver = trip.driverName;
      if (!driverStats[driver]) {
        driverStats[driver] = {
          trips: 0,
          revenue: 0,
          expenses: 0,
          flags: 0,
          internalTrips: 0,
          externalTrips: 0
        };
      }
      
      driverStats[driver].trips++;
      driverStats[driver].revenue += trip.baseRevenue || 0;
      driverStats[driver].expenses += calculateTotalCosts(trip.costs || []);
      driverStats[driver].flags += getFlaggedCostsCount(trip.costs || []);
      
      if (trip.clientType === 'internal') {
        driverStats[driver].internalTrips++;
      } else {
        driverStats[driver].externalTrips++;
      }
    });
    
    return {
      currency,
      totalTrips,
      activeTrips,
      completedTrips,
      totalRevenue,
      totalExpenses,
      netProfit,
      avgRevenuePerTrip,
      avgCostPerTrip,
      profitMargin,
      internalTrips,
      externalTrips,
      internalRevenue,
      externalRevenue,
      internalProfitMargin,
      externalProfitMargin,
      tripsWithInvestigations,
      totalFlags,
      unresolvedFlags,
      investigationRate,
      avgFlagsPerTrip,
      avgResolutionTime,
      driverStats
    };
  } catch (error) {
    console.error('Error generating currency fleet report:', error);
    return {
      currency,
      totalTrips: 0,
      activeTrips: 0,
      completedTrips: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      avgRevenuePerTrip: 0,
      avgCostPerTrip: 0,
      profitMargin: 0,
      internalTrips: 0,
      externalTrips: 0,
      internalRevenue: 0,
      externalRevenue: 0,
      internalProfitMargin: 0,
      externalProfitMargin: 0,
      tripsWithInvestigations: 0,
      totalFlags: 0,
      unresolvedFlags: 0,
      investigationRate: 0,
      avgFlagsPerTrip: 0,
      avgResolutionTime: 0,
      driverStats: {}
    };
  }
};

export const downloadCurrencyFleetReport = async (trips: Trip[], currency: 'USD' | 'ZAR') => {
  try {
    const report = generateCurrencyFleetReport(trips, currency);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['CURRENCY FLEET REPORT', ''],
      ['Currency', currency],
      ['Generated On', new Date().toLocaleDateString()],
      [''],
      ['SUMMARY METRICS', ''],
      ['Total Trips', report.totalTrips],
      ['Active Trips', report.activeTrips],
      ['Completed Trips', report.completedTrips],
      ['Total Revenue', report.totalRevenue],
      ['Total Expenses', report.totalExpenses],
      ['Net Profit', report.netProfit],
      ['Profit Margin', `${report.profitMargin.toFixed(2)}%`],
      [''],
      ['CLIENT BREAKDOWN', ''],
      ['Internal Trips', report.internalTrips],
      ['External Trips', report.externalTrips],
      ['Internal Revenue', report.internalRevenue],
      ['External Revenue', report.externalRevenue],
      ['Internal Profit Margin', `${report.internalProfitMargin.toFixed(2)}%`],
      ['External Profit Margin', `${report.externalProfitMargin.toFixed(2)}%`],
      [''],
      ['INVESTIGATION METRICS', ''],
      ['Trips With Flags', report.tripsWithInvestigations],
      ['Total Flags', report.totalFlags],
      ['Unresolved Flags', report.unresolvedFlags],
      ['Investigation Rate', `${report.investigationRate.toFixed(2)}%`],
      ['Avg Flags Per Trip', report.avgFlagsPerTrip.toFixed(2)],
      ['Avg Resolution Time (days)', report.avgResolutionTime.toFixed(2)]
    ];
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    
    // Driver stats sheet
    const driverHeaders = ['Driver', 'Trips', 'Revenue', 'Expenses', 'Net Profit', 'Profit Margin', 'Flags', 'Internal Trips', 'External Trips'];
    const driverRows = Object.entries(report.driverStats).map(([driver, stats]) => {
      const netProfit = stats.revenue - stats.expenses;
      const profitMargin = stats.revenue > 0 ? (netProfit / stats.revenue) * 100 : 0;
      
      return [
        driver,
        stats.trips,
        stats.revenue,
        stats.expenses,
        netProfit,
        `${profitMargin.toFixed(2)}%`,
        stats.flags,
        stats.internalTrips,
        stats.externalTrips
      ];
    });
    
    const driverData = [driverHeaders, ...driverRows];
    const driverWs = XLSX.utils.aoa_to_sheet(driverData);
    XLSX.utils.book_append_sheet(wb, driverWs, 'Driver Performance');
    
    // Trips detail sheet
    const tripHeaders = ['Fleet', 'Driver', 'Client', 'Route', 'Start Date', 'End Date', 'Status', 'Revenue', 'Costs', 'Profit', 'Margin', 'Flags'];
    const tripRows = trips.map(trip => {
      const costs = calculateTotalCosts(trip.costs || []);
      const profit = (trip.baseRevenue || 0) - costs;
      const margin = trip.baseRevenue ? (profit / trip.baseRevenue) * 100 : 0;
      
      return [
        trip.fleetNumber,
        trip.driverName,
        trip.clientName,
        trip.route,
        trip.startDate,
        trip.endDate,
        trip.status,
        trip.baseRevenue,
        costs,
        profit,
        `${margin.toFixed(2)}%`,
        getFlaggedCostsCount(trip.costs || [])
      ];
    });
    
    const tripData = [tripHeaders, ...tripRows];
    const tripWs = XLSX.utils.aoa_to_sheet(tripData);
    XLSX.utils.book_append_sheet(wb, tripWs, 'Trip Details');
    
    // Write file
    XLSX.writeFile(wb, `${currency}_Fleet_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error downloading report:', error);
    alert('Failed to download report. Please try again.');
  }
};

// -------------------- Flagged Costs Extraction --------------------

export const getAllFlaggedCosts = (trips: Trip[]): FlaggedCost[] => {
  try {
    const flaggedCosts: FlaggedCost[] = [];

    trips?.forEach(trip => {
      if (!trip.costs) return;
      
      trip.costs?.forEach(cost => {
        if (cost.isFlagged) {
          flaggedCosts.push({
            ...cost,
            tripFleetNumber: trip.fleetNumber,
            tripRoute: trip.route,
            tripDriverName: trip.driverName,
          });
        }
      });
    });

    return flaggedCosts.sort((a, b) => {
      if (a.investigationStatus === 'pending' && b.investigationStatus !== 'pending') return -1;
      if (a.investigationStatus !== 'pending' && b.investigationStatus === 'pending') return 1;
      return new Date(b.flaggedAt || b.date).getTime() - new Date(a.flaggedAt || a.date).getTime();
    });
  } catch (error) {
    console.error('Error getting all flagged costs:', error);
    return [];
  }
};

// -------------------- Trip Sorting by Date --------------------

export const sortTripsByLoadingDate = (trips: Trip[]): Record<string, Trip[]> => {
  // Group trips by loading date (start date)
  const tripsByDate: Record<string, Trip[]> = {};
  
  trips.forEach(trip => {
    const loadDate = trip.startDate;
    if (!tripsByDate[loadDate]) {
      tripsByDate[loadDate] = [];
    }
    tripsByDate[loadDate].push(trip);
  });
  
  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(tripsByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
  
  // Create a new object with sorted dates
  const sortedTripsByDate: Record<string, Trip[]> = {};
  sortedDates.forEach(date => {
    sortedTripsByDate[date] = tripsByDate[date];
  });
  
  return sortedTripsByDate;
};

// Format date for display in headers
export const formatDateForHeader = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};