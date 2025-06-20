// ─── React ───────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';

// ─── Types ───────────────────────────────────────────────────────
import { Trip, SystemCostRates, DEFAULT_SYSTEM_COST_RATES, CostEntry } from '../../types';

// ─── Icons ───────────────────────────────────────────────────────
import { Calculator, Clock, Navigation, AlertTriangle } from 'lucide-react';

// ─── Utilities ───────────────────────────────────────────────────
import { formatCurrency } from '../../utils/helpers';

// ─── Context ─────────────────────────────────────────────────────
import { useAppContext } from '../../context/AppContext';


interface SystemCostGeneratorProps {
  trip: Trip;
  onGenerateSystemCosts: (systemCosts: Omit<CostEntry, 'id' | 'attachments'>[]) => void;
}

const SystemCostGenerator: React.FC<SystemCostGeneratorProps> = ({ 
  trip, 
  onGenerateSystemCosts 
}) => {
  const [systemRates, setSystemRates] = useState<Record<'USD' | 'ZAR', SystemCostRates>>(DEFAULT_SYSTEM_COST_RATES);
  
  // Get the latest system cost rates from the admin configuration
  const { systemCostRates } = useAppContext();
  
  useEffect(() => {
    if (systemCostRates) {
      setSystemRates(systemCostRates);
    }
    
    // Also check localStorage for saved rates
    const savedRates = localStorage.getItem('systemCostRates');
    if (savedRates) {
      try {
        const parsedRates = JSON.parse(savedRates);
        if (parsedRates.USD && parsedRates.ZAR) {
          setSystemRates(parsedRates);
        }
      } catch (error) {
        console.error("Error parsing saved system cost rates:", error);
      }
    }
  }, [systemCostRates]);
  
  // Use effective date logic to determine which rates to apply
  const getApplicableRates = (currency: 'USD' | 'ZAR'): SystemCostRates => {
    const rates = systemRates[currency];
    const tripStartDate = new Date(trip.startDate);
    const rateEffectiveDate = new Date(rates.effectiveDate);
    
    if (tripStartDate >= rateEffectiveDate) {
      return rates;
    }
    
    return rates; // Simplified fallback
  };
  
  const rates = getApplicableRates(trip.revenueCurrency);
  
  // Calculate trip duration in days
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const tripDurationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Calculate per-KM costs
  const perKmCosts = trip.distanceKm ? [
    {
      category: 'System Costs',
      subCategory: 'Repair & Maintenance per KM',
      amount: trip.distanceKm * rates.perKmCosts.repairMaintenance,
      rate: rates.perKmCosts.repairMaintenance,
      calculation: `${trip.distanceKm} km × ${formatCurrency(rates.perKmCosts.repairMaintenance, trip.revenueCurrency)}/km`
    },
    {
      category: 'System Costs',
      subCategory: 'Tyre Cost per KM',
      amount: trip.distanceKm * rates.perKmCosts.tyreCost,
      rate: rates.perKmCosts.tyreCost,
      calculation: `${trip.distanceKm} km × ${formatCurrency(rates.perKmCosts.tyreCost, trip.revenueCurrency)}/km`
    }
  ] : [];

  // Calculate per-day costs
  const perDayCosts = [
    {
      category: 'System Costs',
      subCategory: 'GIT Insurance',
      amount: tripDurationDays * rates.perDayCosts.gitInsurance,
      rate: rates.perDayCosts.gitInsurance,
      calculation: `${tripDurationDays} days × ${formatCurrency(rates.perDayCosts.gitInsurance, trip.revenueCurrency)}/day`
    },
    {
      category: 'System Costs',
      subCategory: 'Short-Term Insurance',
      amount: tripDurationDays * rates.perDayCosts.shortTermInsurance,
      rate: rates.perDayCosts.shortTermInsurance,
      calculation: `${tripDurationDays} days × ${formatCurrency(rates.perDayCosts.shortTermInsurance, trip.revenueCurrency)}/day`
    },
    {
      category: 'System Costs',
      subCategory: 'Tracking Cost',
      amount: tripDurationDays * rates.perDayCosts.trackingCost,
      rate: rates.perDayCosts.trackingCost,
      calculation: `${tripDurationDays} days × ${formatCurrency(rates.perDayCosts.trackingCost, trip.revenueCurrency)}/day`
    },
    {
      category: 'System Costs',
      subCategory: 'Fleet Management System',
      amount: tripDurationDays * rates.perDayCosts.fleetManagementSystem,
      rate: rates.perDayCosts.fleetManagementSystem,
      calculation: `${tripDurationDays} days × ${formatCurrency(rates.perDayCosts.fleetManagementSystem, trip.revenueCurrency)}/day`
    },
    {
      category: 'System Costs',
      subCategory: 'Licensing',
      amount: tripDurationDays * rates.perDayCosts.licensing,
      rate: rates.perDayCosts.licensing,
      calculation: `${tripDurationDays} days × ${formatCurrency(rates.perDayCosts.licensing, trip.revenueCurrency)}/day`
    },
    {
      category: 'System Costs',
      subCategory: 'VID / Roadworthy',
      amount: tripDurationDays * rates.perDayCosts.vidRoadworthy,
      rate: rates.perDayCosts.vidRoadworthy,
      calculation: `${tripDurationDays} days × ${formatCurrency(rates.perDayCosts.vidRoadworthy, trip.revenueCurrency)}/day`
    },
    {
      category: 'System Costs',
      subCategory: 'Wages',
      amount: tripDurationDays * rates.perDayCosts.wages,
      rate: rates.perDayCosts.wages,
      calculation: `${tripDurationDays} days × ${formatCurrency(rates.perDayCosts.wages, trip.revenueCurrency)}/day`
    },
    {
      category: 'System Costs',
      subCategory: 'Depreciation',
      amount: tripDurationDays * rates.perDayCosts.depreciation,
      rate: rates.perDayCosts.depreciation,
      calculation: `${tripDurationDays} days × ${formatCurrency(rates.perDayCosts.depreciation, trip.revenueCurrency)}/day`
    }
  ];

  const allSystemCosts = [...perKmCosts, ...perDayCosts];
  const totalSystemCosts = allSystemCosts.reduce((sum, cost) => sum + cost.amount, 0);

  const handleGenerateSystemCosts = () => {
    const systemCostEntries: Omit<CostEntry, 'id' | 'attachments'>[] = allSystemCosts.map((cost, index) => ({
      tripId: trip.id,
      category: cost.category,
      subCategory: cost.subCategory,
      amount: cost.amount,
      currency: trip.revenueCurrency,
      referenceNumber: `SYS-${trip.id.substring(0, 8)}-${String(index + 1).padStart(3, '0')}`,
      date: trip.startDate,
      notes: `System-generated operational overhead cost. ${cost.calculation}`,
      isFlagged: false,
      isSystemGenerated: true,
      systemCostType: cost.subCategory.includes('per KM') ? 'per-km' : 'per-day',
      calculationDetails: cost.calculation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    onGenerateSystemCosts(systemCostEntries);
  };

  return (
    <div className="space-y-6">
      {/* System Cost Overview */}
      <div className="bg-blue-50 border border-blue-400 rounded-md p-4">
        <div className="flex items-start space-x-3">
          <Calculator className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-800">Automatic Operational Cost Injection</h4>
            <p className="text-sm text-blue-700 mt-1">
              System will automatically apply predefined per-kilometer and per-day fixed cost factors to ensure true operational profitability assessment.
            </p>
          </div>
        </div>
      </div>

      {/* Rate Version Information */}
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-green-800 mb-2">Applied Rate Version</h4>
        <div className="text-sm text-green-700 space-y-1">
          <p><strong>Currency:</strong> {rates.currency}</p>
          <p><strong>Effective Date:</strong> {new Date(rates.effectiveDate).toLocaleDateString()}</p>
          <p><strong>Last Updated:</strong> {new Date(rates.lastUpdated).toLocaleDateString()}</p>
          <p><strong>Updated By:</strong> {rates.updatedBy}</p>
          <p className="text-xs mt-2 text-green-600">
            ✓ These rates are applicable to this trip based on the trip start date ({new Date(trip.startDate).toLocaleDateString()})
          </p>
        </div>
      </div>

      {/* Trip Calculation Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex items-center space-x-2 mb-2">
            <Navigation className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Distance</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {trip.distanceKm ? `${trip.distanceKm} km` : 'Not specified'}
          </p>
          {!trip.distanceKm && (
            <p className="text-xs text-amber-600 mt-1">Per-KM costs will not be applied</p>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Duration</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{tripDurationDays} days</p>
          <p className="text-xs text-gray-500">{trip.startDate} to {trip.endDate}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex items-center space-x-2 mb-2">
            <Calculator className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Currency</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{trip.revenueCurrency}</p>
          <p className="text-xs text-gray-500">Using {trip.revenueCurrency} rates</p>
        </div>
      </div>

      {/* Per-KM Costs */}
      {trip.distanceKm && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Per-Kilometer Costs</h3>
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cost Type</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Rate/km</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Distance</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {perKmCosts.map((cost, index) => (
                  <tr key={index} className="border-t border-gray-200">
                    <td className="px-4 py-3 text-sm text-gray-900">{cost.subCategory}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(cost.rate, trip.revenueCurrency)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{trip.distanceKm} km</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(cost.amount, trip.revenueCurrency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-Day Costs */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Per-Day Fixed Costs</h3>
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cost Type</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Rate/Day</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">No. of Days</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {perDayCosts.map((cost, index) => (
                <tr key={index} className="border-t border-gray-200">
                  <td className="px-4 py-3 text-sm text-gray-900">{cost.subCategory}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {formatCurrency(cost.rate, trip.revenueCurrency)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{tripDurationDays}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                    {formatCurrency(cost.amount, trip.revenueCurrency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total System Costs */}
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-green-800">Total System Costs</h3>
            <p className="text-sm text-green-700">
              {allSystemCosts.length} cost entries will be automatically generated
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-800">
              {formatCurrency(totalSystemCosts, trip.revenueCurrency)}
            </p>
            <p className="text-sm text-green-600">Operational overhead</p>
          </div>
        </div>
      </div>

      {/* Warning for Missing Distance */}
      {!trip.distanceKm && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">Distance Not Specified</h4>
              <p className="text-sm text-amber-700 mt-1">
                Per-kilometer costs (Repair & Maintenance, Tyre Cost) will not be applied. 
                Consider adding distance information to the trip for complete cost analysis.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleGenerateSystemCosts}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Calculator className="w-5 h-5 mr-2" />
          Generate System Costs ({allSystemCosts.length} entries)
        </button>
      </div>
    </div>
  );
};

export default SystemCostGenerator;