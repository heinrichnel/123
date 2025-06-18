import { Trip, CostEntry, FlaggedCost } from '../types/index';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

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
    const totalExpenses = calculateTotalCosts(trip.costs);
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
  getUnresolvedFlagsCount(trip.costs) === 0;

export const shouldAutoCompleteTrip = (trip: Trip): boolean =>
  trip.status === 'active' &&
  trip.costs.some((c) => c.isFlagged) &&
  getUnresolvedFlagsCount(trip.costs) === 0;

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

export const generateTripId = (): string => {
  const timestamp = new Date().getTime().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `trip_${timestamp}_${randomPart}`;
};

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
      ['Trip Description', trip.tripDescription],
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
        trip.tripDescription,
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

export const generateCurrencyFleetReport = async (trips: Trip[]) => {
  try {
    alert(`Generating fleet/currency report for ${trips.length} trip(s)...`);
  } catch (error) {
    console.error('Error generating currency fleet report:', error);
  }
};

export const downloadCurrencyFleetReport = async (trips: Trip[]) => {
  try {
    alert(`Downloading fleet/currency Excel report for ${trips.length} trip(s)...`);
  } catch (error) {
    console.error('Error downloading report:', error);
  }
};

// -------------------- Flagged Costs Extraction --------------------

export const getAllFlaggedCosts = (trips: Trip[]): FlaggedCost[] => {
  try {
    const flaggedCosts: FlaggedCost[] = [];

    trips?.forEach(trip => {
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