import { Trip, CostEntry, FlaggedCost } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

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

export const formatCurrency = (amount: number, currency: 'USD' | 'ZAR' = 'ZAR'): string => {
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
  try {
    return costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);
  } catch (error) {
    console.error('Error calculating total costs:', error);
    return 0;
  }
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

export const getFlaggedCostsCount = (costs: CostEntry[]): number => {
  try {
    return costs.filter((cost) => cost.isFlagged).length;
  } catch (error) {
    console.error('Error counting flagged costs:', error);
    return 0;
  }
};

export const getUnresolvedFlagsCount = (costs: CostEntry[]): number => {
  try {
    return costs.filter((cost) => cost.isFlagged && cost.investigationStatus !== 'resolved').length;
  } catch (error) {
    console.error('Error counting unresolved flags:', error);
    return 0;
  }
};

export const canCompleteTrip = (trip: Trip): boolean => {
  try {
    const unresolvedFlags = getUnresolvedFlagsCount(trip.costs);
    return unresolvedFlags === 0;
  } catch (error) {
    console.error('Error checking trip completion:', error);
    return false;
  }
};

export const shouldAutoCompleteTrip = (trip: Trip): boolean => {
  try {
    if (trip.status !== 'active') return false;
    const flagged = trip.costs.filter((c) => c.isFlagged);
    if (flagged.length === 0) return false;
    const unresolved = getUnresolvedFlagsCount(trip.costs);
    return unresolved === 0;
  } catch (error) {
    console.error('Error auto-completing trip:', error);
    return false;
  }
};

// -------------------- Filtering Functions --------------------

export const filterTripsByDateRange = (trips: Trip[], startDate?: string, endDate?: string): Trip[] => {
  if (!trips) return [];
  return trips.filter((trip) => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    if (startDate && start < new Date(startDate)) return false;
    if (endDate && end > new Date(endDate)) return false;
    return true;
  });
};

export const filterTripsByClient = (trips: Trip[], client: string): Trip[] => {
  if (!trips || !client) return trips;
  return trips.filter((trip) => trip.clientName === client);
};

export const filterTripsByCurrency = (trips: Trip[], currency: string): Trip[] => {
  if (!trips || !currency) return trips;
  return trips.filter((trip) => trip.revenueCurrency === currency);
};

export const filterTripsByDriver = (trips: Trip[], driver: string): Trip[] => {
  if (!trips || !driver) return trips;
  return trips.filter((trip) => trip.driverName === driver);
};

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

export const getFileIcon = (fileType: string) => {
  if (!fileType) return 'Paperclip';
  if (fileType.includes('pdf')) return 'FileText';
  if (fileType.includes('image')) return 'Image';
  return 'Paperclip';
};

// -------------------- Download Stubs --------------------

export const downloadTripPDF = async (tripId: string) => {
  try {
    alert(`Generating PDF for trip ${tripId}`);
  } catch (error) {
    console.error('Error downloading trip PDF:', error);
  }
};

export const downloadTripExcel = async (tripId: string) => {
  try {
    alert(`Generating Excel report for trip ${tripId}`);
  } catch (error) {
    console.error('Error downloading trip Excel:', error);
  }
};
