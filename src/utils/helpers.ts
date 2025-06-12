import { Trip, CostEntry, FlaggedCost, Driver, SystemCostRates, InvoiceAging, AGING_THRESHOLDS } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Date formatting
export const formatDate = (date: string | Date): string => {
  if (!date) return 'N/A';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
      minute: '2-digit'
    });
  } catch (error) {
    console.error('DateTime formatting error:', error);
    return 'Invalid Date';
  }
};

// Currency formatting
export const formatCurrency = (amount: number, currency: 'USD' | 'ZAR' = 'ZAR'): string => {
  if (amount === undefined || amount === null) return currency === 'USD' ? '$0.00' : 'R0.00';
  
  try {
    const symbol = currency === 'USD' ? '$' : 'R';
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } catch (error) {
    console.error('Currency formatting error:', error);
    return currency === 'USD' ? '$0.00' : 'R0.00';
  }
};

// Trip ID generation with timestamp and random component for uniqueness
export const generateTripId = (): string => {
  const timestamp = new Date().getTime().toString(36);
  const randomComponent = Math.random().toString(36).substring(2, 10);
  return `trip_${timestamp}_${randomComponent}`;
};

// Cost calculations with error handling
export const calculateTotalCosts = (costs: CostEntry[]): number => {
  if (!costs || !Array.isArray(costs)) return 0;
  
  try {
    return costs.reduce((sum, cost) => {
      const amount = typeof cost.amount === 'number' ? cost.amount : 0;
      return sum + amount;
    }, 0);
  } catch (error) {
    console.error('Error calculating total costs:', error);
    return 0;
  }
};

export const calculateKPIs = (trip: Trip) => {
  try {
    const totalRevenue = trip.baseRevenue || 0;
    const totalExpenses = calculateTotalCosts(trip.costs);
    const additionalCostsTotal = trip.additionalCosts?.reduce((sum, cost) => sum + cost.amount, 0) || 0;
    const totalCosts = totalExpenses + additionalCostsTotal;
    const netProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const costPerKm = trip.distanceKm && trip.distanceKm > 0 ? totalCosts / trip.distanceKm : 0;
    const currency = trip.revenueCurrency;

    return {
      totalRevenue,
      totalExpenses: totalCosts,
      netProfit,
      profitMargin,
      costPerKm,
      currency
    };
  } catch (error) {
    console.error('Error calculating KPIs:', error);
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      profitMargin: 0,
      costPerKm: 0,
      currency: trip.revenueCurrency || 'ZAR'
    };
  }
};

// Flag and investigation helpers with error handling
export const getFlaggedCostsCount = (costs: CostEntry[]): number => {
  if (!costs || !Array.isArray(costs)) return 0;
  
  try {
    return costs.filter(cost => cost.isFlagged).length;
  } catch (error) {
    console.error('Error counting flagged costs:', error);
    return 0;
  }
};

export const getUnresolvedFlagsCount = (costs: CostEntry[]): number => {
  if (!costs || !Array.isArray(costs)) return 0;
  
  try {
    return costs.filter(cost => cost.isFlagged && cost.investigationStatus !== 'resolved').length;
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
    console.error('Error checking if trip can be completed:', error);
    return false;
  }
};

// Auto-completion logic for trips when all flags are resolved
export const shouldAutoCompleteTrip = (trip: Trip): boolean => {
  try {
    if (trip.status !== 'active') return false;
    
    const flaggedCosts = trip.costs.filter(cost => cost.isFlagged);
    if (flaggedCosts.length === 0) return false;
    
    const unresolvedFlags = getUnresolvedFlagsCount(trip.costs);
    return unresolvedFlags === 0;
  } catch (error) {
    console.error('Error checking if trip should auto-complete:', error);
    return false;
  }
};

export const getAllFlaggedCosts = (trips: Trip[]): FlaggedCost[] => {
  if (!trips || !Array.isArray(trips)) return [];
  
  try {
    const flaggedCosts: FlaggedCost[] = [];
    
    trips.forEach(trip => {
      if (!trip.costs || !Array.isArray(trip.costs)) return;
      
      trip.costs.forEach(cost => {
        if (cost.isFlagged) {
          flaggedCosts.push({
            ...cost,
            tripFleetNumber: trip.fleetNumber,
            tripRoute: trip.route,
            tripDriverName: trip.driverName
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

// Filtering helpers with error handling
export const filterTripsByDateRange = (trips: Trip[], startDate?: string, endDate?: string): Trip[] => {
  if (!trips || !Array.isArray(trips)) return [];
  if (!startDate && !endDate) return trips;
  
  try {
    return trips.filter(trip => {
      if (!trip.startDate || !trip.endDate) return false;
      
      const tripStart = new Date(trip.startDate);
      const tripEnd = new Date(trip.endDate);
      
      if (startDate && tripStart < new Date(startDate)) return false;
      if (endDate && tripEnd > new Date(endDate)) return false;
      
      return true;
    });
  } catch (error) {
    console.error('Error filtering trips by date range:', error);
    return trips;
  }
};

export const filterTripsByClient = (trips: Trip[], client: string): Trip[] => {
  if (!trips || !Array.isArray(trips)) return [];
  if (!client) return trips;
  
  try {
    return trips.filter(trip => trip.clientName === client);
  } catch (error) {
    console.error('Error filtering trips by client:', error);
    return trips;
  }
};

export const filterTripsByCurrency = (trips: Trip[], currency: string): Trip[] => {
  if (!trips || !Array.isArray(trips)) return [];
  if (!currency) return trips;
  
  try {
    return trips.filter(trip => trip.revenueCurrency === currency);
  } catch (error) {
    console.error('Error filtering trips by currency:', error);
    return trips;
  }
};

export const filterTripsByDriver = (trips: Trip[], driver: string): Trip[] => {
  if (!trips || !Array.isArray(trips)) return [];
  if (!driver) return trips;
  
  try {
    return trips.filter(trip => trip.driverName === driver);
  } catch (error) {
    console.error('Error filtering trips by driver:', error);
    return trips;
  }
};

// Currency-specific fleet reporting
export const generateCurrencyFleetReport = (trips: Trip[], currency: 'USD' | 'ZAR') => {
  if (!trips || !Array.isArray(trips)) {
    return {
      currency,
      totalTrips: 0,
      activeTrips: 0,
      completedTrips: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      profitMargin: 0,
      avgRevenuePerTrip: 0,
      avgCostPerTrip: 0,
      internalTrips: 0,
      externalTrips: 0,
      internalRevenue: 0,
      internalProfitMargin: 0,
      externalRevenue: 0,
      externalProfitMargin: 0,
      totalFlags: 0,
      unresolvedFlags: 0,
      tripsWithInvestigations: 0,
      investigationRate: 0,
      avgFlagsPerTrip: 0,
      avgResolutionTime: 0,
      driverStats: {}
    };
  }
  
  try {
    const currencyTrips = trips.filter(trip => trip.revenueCurrency === currency);
    
    const totalTrips = currencyTrips.length;
    const activeTrips = currencyTrips.filter(t => t.status === 'active').length;
    const completedTrips = currencyTrips.filter(t => t.status === 'completed').length;
    
    const totalRevenue = currencyTrips.reduce((sum, trip) => sum + (trip.baseRevenue || 0), 0);
    const totalExpenses = currencyTrips.reduce((sum, trip) => {
      const tripCosts = calculateTotalCosts(trip.costs);
      const additionalCosts = trip.additionalCosts?.reduce((sum, cost) => sum + cost.amount, 0) || 0;
      return sum + tripCosts + additionalCosts;
    }, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    const avgRevenuePerTrip = totalTrips > 0 ? totalRevenue / totalTrips : 0;
    const avgCostPerTrip = totalTrips > 0 ? totalExpenses / totalTrips : 0;

    // Client type breakdown
    const internalTrips = currencyTrips.filter(t => t.clientType === 'internal');
    const externalTrips = currencyTrips.filter(t => t.clientType === 'external');
    
    const internalRevenue = internalTrips.reduce((sum, trip) => sum + (trip.baseRevenue || 0), 0);
    const internalExpenses = internalTrips.reduce((sum, trip) => {
      const tripCosts = calculateTotalCosts(trip.costs);
      const additionalCosts = trip.additionalCosts?.reduce((sum, cost) => sum + cost.amount, 0) || 0;
      return sum + tripCosts + additionalCosts;
    }, 0);
    const internalProfit = internalRevenue - internalExpenses;
    const internalProfitMargin = internalRevenue > 0 ? (internalProfit / internalRevenue) * 100 : 0;
    
    const externalRevenue = externalTrips.reduce((sum, trip) => sum + (trip.baseRevenue || 0), 0);
    const externalExpenses = externalTrips.reduce((sum, trip) => {
      const tripCosts = calculateTotalCosts(trip.costs);
      const additionalCosts = trip.additionalCosts?.reduce((sum, cost) => sum + cost.amount, 0) || 0;
      return sum + tripCosts + additionalCosts;
    }, 0);
    const externalProfit = externalRevenue - externalExpenses;
    const externalProfitMargin = externalRevenue > 0 ? (externalProfit / externalRevenue) * 100 : 0;

    // Investigation metrics
    const allFlags = currencyTrips.flatMap(trip => trip.costs.filter(cost => cost.isFlagged));
    const totalFlags = allFlags.length;
    const unresolvedFlags = allFlags.filter(cost => cost.investigationStatus !== 'resolved').length;
    const tripsWithInvestigations = currencyTrips.filter(t => t.costs.some(c => c.isFlagged)).length;
    const investigationRate = totalTrips > 0 ? (tripsWithInvestigations / totalTrips) * 100 : 0;
    const avgFlagsPerTrip = totalTrips > 0 ? totalFlags / totalTrips : 0;
    
    const resolvedFlags = allFlags.filter(cost => cost.investigationStatus === 'resolved');
    const avgResolutionTime = resolvedFlags.length > 0 ? 
      resolvedFlags.reduce((sum, flag) => {
        if (flag.flaggedAt && flag.resolvedAt) {
          const flaggedDate = new Date(flag.flaggedAt);
          const resolvedDate = new Date(flag.resolvedAt);
          return sum + (resolvedDate.getTime() - flaggedDate.getTime()) / (1000 * 60 * 60 * 24);
        }
        return sum + 3;
      }, 0) / resolvedFlags.length : 0;

    // Driver performance for this currency
    const driverStats = currencyTrips.reduce((acc, trip) => {
      if (!acc[trip.driverName]) {
        acc[trip.driverName] = {
          trips: 0,
          revenue: 0,
          expenses: 0,
          flags: 0,
          internalTrips: 0,
          externalTrips: 0
        };
      }
      
      acc[trip.driverName].trips++;
      acc[trip.driverName].revenue += trip.baseRevenue || 0;
      
      const tripCosts = calculateTotalCosts(trip.costs);
      const additionalCosts = trip.additionalCosts?.reduce((sum, cost) => sum + cost.amount, 0) || 0;
      acc[trip.driverName].expenses += tripCosts + additionalCosts;
      
      acc[trip.driverName].flags += getFlaggedCostsCount(trip.costs);
      
      if (trip.clientType === 'internal') {
        acc[trip.driverName].internalTrips++;
      } else {
        acc[trip.driverName].externalTrips++;
      }
      
      return acc;
    }, {} as Record<string, any>);

    return {
      currency,
      totalTrips,
      activeTrips,
      completedTrips,
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      avgRevenuePerTrip,
      avgCostPerTrip,
      internalTrips: internalTrips.length,
      externalTrips: externalTrips.length,
      internalRevenue,
      internalProfitMargin,
      externalRevenue,
      externalProfitMargin,
      totalFlags,
      unresolvedFlags,
      tripsWithInvestigations,
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
      profitMargin: 0,
      avgRevenuePerTrip: 0,
      avgCostPerTrip: 0,
      internalTrips: 0,
      externalTrips: 0,
      internalRevenue: 0,
      internalProfitMargin: 0,
      externalRevenue: 0,
      externalProfitMargin: 0,
      totalFlags: 0,
      unresolvedFlags: 0,
      tripsWithInvestigations: 0,
      investigationRate: 0,
      avgFlagsPerTrip: 0,
      avgResolutionTime: 0,
      driverStats: {}
    };
  }
};

// Download currency fleet report
export const downloadCurrencyFleetReport = async (trips: Trip[], currency: 'USD' | 'ZAR') => {
  try {
    const report = generateCurrencyFleetReport(trips, currency);
    
    // Create CSV content
    const csvContent = [
      // Header
      `${currency} Fleet Performance Report`,
      `Generated on: ${formatDate(new Date())}`,
      '',
      'Summary',
      `Total Trips,${report.totalTrips}`,
      `Active Trips,${report.activeTrips}`,
      `Completed Trips,${report.completedTrips}`,
      `Total Revenue,${formatCurrency(report.totalRevenue, currency)}`,
      `Total Expenses,${formatCurrency(report.totalExpenses, currency)}`,
      `Net Profit,${formatCurrency(report.netProfit, currency)}`,
      `Profit Margin,${report.profitMargin.toFixed(2)}%`,
      '',
      'Client Type Breakdown',
      `Internal Trips,${report.internalTrips}`,
      `Internal Revenue,${formatCurrency(report.internalRevenue, currency)}`,
      `Internal Profit Margin,${report.internalProfitMargin.toFixed(2)}%`,
      `External Trips,${report.externalTrips}`,
      `External Revenue,${formatCurrency(report.externalRevenue, currency)}`,
      `External Profit Margin,${report.externalProfitMargin.toFixed(2)}%`,
      '',
      'Investigation Metrics',
      `Total Flags,${report.totalFlags}`,
      `Unresolved Flags,${report.unresolvedFlags}`,
      `Trips with Investigations,${report.tripsWithInvestigations}`,
      `Investigation Rate,${report.investigationRate.toFixed(2)}%`,
      `Average Resolution Time,${report.avgResolutionTime.toFixed(1)} days`,
      '',
      'Driver Performance',
      'Driver,Trips,Revenue,Expenses,Net Profit,Margin %,Flags,Internal Trips,External Trips'
    ];

    // Add driver data
    Object.entries(report.driverStats).forEach(([driver, stats]: [string, any]) => {
      const netProfit = stats.revenue - stats.expenses;
      const profitMargin = stats.revenue > 0 ? (netProfit / stats.revenue) * 100 : 0;
      csvContent.push(
        `${driver},${stats.trips},${formatCurrency(stats.revenue, currency)},${formatCurrency(stats.expenses, currency)},${formatCurrency(netProfit, currency)},${profitMargin.toFixed(2)}%,${stats.flags},${stats.internalTrips},${stats.externalTrips}`
      );
    });

    // Create and download file
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currency}_Fleet_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading currency fleet report:', error);
    alert('Failed to download report. Please try again.');
  }
};

// Report generation with error handling
export const generateReport = (trip: Trip) => {
  try {
    const kpis = calculateKPIs(trip);
    
    // Cost breakdown by category
    const costBreakdown = trip.costs.reduce((acc, cost) => {
      const existing = acc.find(item => item.category === cost.category);
      if (existing) {
        existing.total += cost.amount;
        existing.count++;
      } else {
        acc.push({
          category: cost.category,
          total: cost.amount,
          count: 1,
          percentage: 0
        });
      }
      return acc;
    }, [] as Array<{category: string, total: number, count: number, percentage: number}>);

    // Add additional costs to breakdown
    if (trip.additionalCosts) {
      trip.additionalCosts.forEach(cost => {
        const existing = costBreakdown.find(item => item.category === 'Additional Costs');
        if (existing) {
          existing.total += cost.amount;
          existing.count++;
        } else {
          costBreakdown.push({
            category: 'Additional Costs',
            total: cost.amount,
            count: 1,
            percentage: 0
          });
        }
      });
    }

    // Calculate percentages
    costBreakdown.forEach(item => {
      item.percentage = kpis.totalExpenses > 0 ? (item.total / kpis.totalExpenses) * 100 : 0;
    });

    // Sort by total amount
    costBreakdown.sort((a, b) => b.total - a.total);

    return {
      ...kpis,
      costBreakdown,
      totalCosts: kpis.totalExpenses,
      hasAttachments: trip.costs.some(cost => cost.attachments && cost.attachments.length > 0),
      missingReceipts: trip.costs.filter(cost => !cost.attachments || cost.attachments.length === 0),
      flaggedCosts: trip.costs.filter(cost => cost.isFlagged),
      investigationDetails: trip.investigationNotes || null,
      complianceScore: calculateTripCompliance(trip)
    };
  } catch (error) {
    console.error('Error generating report:', error);
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      profitMargin: 0,
      costPerKm: 0,
      currency: trip.revenueCurrency || 'ZAR',
      costBreakdown: [],
      totalCosts: 0,
      hasAttachments: false,
      missingReceipts: [],
      flaggedCosts: [],
      investigationDetails: null,
      complianceScore: 0
    };
  }
};

// Calculate trip compliance score with error handling
const calculateTripCompliance = (trip: Trip): number => {
  try {
    let complianceScore = 100;
    
    // Check planned vs actual times
    if (trip.plannedArrivalDateTime && trip.actualArrivalDateTime) {
      const planned = new Date(trip.plannedArrivalDateTime);
      const actual = new Date(trip.actualArrivalDateTime);
      const diffHours = Math.abs((actual.getTime() - planned.getTime()) / (1000 * 60 * 60));
      
      if (diffHours > 4) complianceScore -= 20;
      else if (diffHours > 2) complianceScore -= 10;
      else if (diffHours > 1) complianceScore -= 5;
    }
    
    // Check for delays
    if (trip.delayReasons && trip.delayReasons.length > 0) {
      const totalDelayHours = trip.delayReasons.reduce((sum, delay) => sum + delay.delayDuration, 0);
      complianceScore -= Math.min(30, totalDelayHours * 2);
    }
    
    // Check for missing documentation
    const costsWithoutDocs = trip.costs.filter(cost => !cost.attachments || cost.attachments.length === 0);
    if (costsWithoutDocs.length > 0) {
      complianceScore -= Math.min(20, costsWithoutDocs.length * 5);
    }
    
    return Math.max(0, complianceScore);
  } catch (error) {
    console.error('Error calculating trip compliance:', error);
    return 0;
  }
};

// File icon helper
export const getFileIcon = (fileType: string) => {
  if (!fileType) return 'Paperclip';
  
  try {
    if (fileType.includes('pdf')) return 'FileText';
    if (fileType.includes('image')) return 'Image';
    return 'Paperclip';
  } catch (error) {
    console.error('Error getting file icon:', error);
    return 'Paperclip';
  }
};

// Export functions with error handling
export const downloadTripPDF = async (tripId: string) => {
  try {
    alert(`Generating PDF for trip ${tripId}. This would download a PDF report in a production environment.`);
  } catch (error) {
    console.error('Error downloading trip PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};

export const downloadTripExcel = async (tripId: string) => {
  try {
    alert(`Generating Excel report for trip ${tripId}. This would download an Excel report in a production environment.`);
  } catch (error) {
    console.error('Error downloading trip Excel:', error);
    alert('Failed to generate Excel report. Please try again.');
  }
};

// Network status helpers
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Retry operation with exponential backoff
export const retryOperation = async (
  operation: () => Promise<any>,
  maxRetries = 3,
  delay = 1000
): Promise<any> => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Operation failed, retrying (${i + 1}/${maxRetries})...`, error);
      lastError = error;
      
      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  
  throw lastError;
};