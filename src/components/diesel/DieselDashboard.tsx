// ─── React & Context ─────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import DieselImportModal from './DieselImportModal';
import DieselDebriefModal from './DieselDebriefModal';
import DieselNormsModal from './DieselNormsModal';
import ManualDieselEntryModal from './ManualDieselEntryModal';
import TripLinkageModal from './TripLinkageModal';
import ProbeVerificationModal from './ProbeVerificationModal';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { Input, Select } from '../ui/FormElements';
import { 
  Upload, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp,
  Fuel,
  Calculator,
  FileSpreadsheet,
  Settings,
  Flag,
  CheckCircle,
  Plus,
  Link,
  FileText,
  Printer,
  Clock
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { FLEETS_WITH_PROBES } from '../../types';

interface DieselNorms {
  fleetNumber: string;
  expectedKmPerLitre: number;
  tolerancePercentage: number; // e.g., 10% = 10
  lastUpdated: string;
  updatedBy: string;
  isReeferUnit?: boolean;
  litresPerHour?: number; // For reefer units
}

const DEFAULT_NORMS: DieselNorms[] = [
  { fleetNumber: '4H', expectedKmPerLitre: 3.5, tolerancePercentage: 10, lastUpdated: new Date().toISOString(), updatedBy: 'System Default' },
  { fleetNumber: '6H', expectedKmPerLitre: 3.2, tolerancePercentage: 10, lastUpdated: new Date().toISOString(), updatedBy: 'System Default' },
  { fleetNumber: '21H', expectedKmPerLitre: 3.0, tolerancePercentage: 10, lastUpdated: new Date().toISOString(), updatedBy: 'System Default' },
  { fleetNumber: '22H', expectedKmPerLitre: 3.1, tolerancePercentage: 10, lastUpdated: new Date().toISOString(), updatedBy: 'System Default' },
  { fleetNumber: '23H', expectedKmPerLitre: 3.0, tolerancePercentage: 10, lastUpdated: new Date().toISOString(), updatedBy: 'System Default' },
  { fleetNumber: '24H', expectedKmPerLitre: 2.9, tolerancePercentage: 10, lastUpdated: new Date().toISOString(), updatedBy: 'System Default' },
  { fleetNumber: '26H', expectedKmPerLitre: 3.5, tolerancePercentage: 10, lastUpdated: new Date().toISOString(), updatedBy: 'System Default' },
  { fleetNumber: '28H', expectedKmPerLitre: 3.3, tolerancePercentage: 10, lastUpdated: new Date().toISOString(), updatedBy: 'System Default' },
  { fleetNumber: '29H', expectedKmPerLitre: 3.2, tolerancePercentage: 10, lastUpdated: new Date().toISOString(), updatedBy: 'System Default' },
  { fleetNumber: '30H', expectedKmPerLitre: 3.1, tolerancePercentage: 10, lastUpdated: new Date().toISOString(), updatedBy: 'System Default' },
  { fleetNumber: '31H', expectedKmPerLitre: 3.0, tolerancePercentage: 10, lastUpdated: new Date().toISOString(), updatedBy: 'System Default' },
  { fleetNumber: '32H', expectedKmPerLitre: 3.2, tolerancePercentage: 10, lastUpdated: new Date().toISOString(), updatedBy: 'System Default' },
  { fleetNumber: '33H', expectedKmPerLitre: 3.1, tolerancePercentage: 10, lastUpdated: new Date().toISOString(), updatedBy: 'System Default' },
  { fleetNumber: 'UD', expectedKmPerLitre: 2.8, tolerancePercentage: 15, lastUpdated: new Date().toISOString(), updatedBy: 'System Default' },
  // Add reefer units with litres per hour instead of km/l
  { fleetNumber: '4F', expectedKmPerLitre: 0, tolerancePercentage: 15, lastUpdated: new Date().toISOString(), updatedBy: 'System Default', isReeferUnit: true, litresPerHour: 3.5 },
  { fleetNumber: '5F', expectedKmPerLitre: 0, tolerancePercentage: 15, lastUpdated: new Date().toISOString(), updatedBy: 'System Default', isReeferUnit: true, litresPerHour: 3.5 },
  { fleetNumber: '6F', expectedKmPerLitre: 0, tolerancePercentage: 15, lastUpdated: new Date().toISOString(), updatedBy: 'System Default', isReeferUnit: true, litresPerHour: 3.5 },
  { fleetNumber: '7F', expectedKmPerLitre: 0, tolerancePercentage: 15, lastUpdated: new Date().toISOString(), updatedBy: 'System Default', isReeferUnit: true, litresPerHour: 3.5 },
  { fleetNumber: '8F', expectedKmPerLitre: 0, tolerancePercentage: 15, lastUpdated: new Date().toISOString(), updatedBy: 'System Default', isReeferUnit: true, litresPerHour: 3.5 }
];

const DieselDashboard: React.FC = () => {
  const {
    dieselRecords,
    updateDieselRecord,
    deleteDieselRecord,
    trips,
    connectionStatus
  } = useAppContext();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState(false);
  const [isDebriefModalOpen, setIsDebriefModalOpen] = useState(false);
  const [isNormsModalOpen, setIsNormsModalOpen] = useState(false);
  const [isTripLinkageModalOpen, setIsTripLinkageModalOpen] = useState(false);
  const [isProbeVerificationModalOpen, setIsProbeVerificationModalOpen] = useState(false);
  const [selectedDieselId, setSelectedDieselId] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    litresFilled: '',
    totalCost: '',
    kmReading: '',
    previousKmReading: '',
    tripId: '',
    currency: 'ZAR',
    probeReading: '',
    hoursOperated: ''
  });
  const [dieselNorms, setDieselNorms] = useState<DieselNorms[]>([]);
  const [filterFleet, setFilterFleet] = useState<string>('');
  const [filterDriver, setFilterDriver] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterCurrency, setFilterCurrency] = useState<string>('');
  const [filterProbeStatus, setFilterProbeStatus] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Load diesel norms from localStorage on component mount
  useEffect(() => {
    const savedNorms = localStorage.getItem('dieselNorms');
    if (savedNorms) {
      try {
        const parsedNorms = JSON.parse(savedNorms);
        setDieselNorms(parsedNorms);
      } catch (error) {
        console.error("Error parsing saved diesel norms:", error);
        setDieselNorms(DEFAULT_NORMS);
      }
    } else {
      setDieselNorms(DEFAULT_NORMS);
    }
  }, []);

  // Calculate enhanced metrics for each record
  const enhancedRecords = dieselRecords.map(record => {
    const isReeferUnit = ['4F', '5F', '6F', '7F', '8F'].includes(record.fleetNumber);
    const norm = dieselNorms.find(n => n.fleetNumber === record.fleetNumber);
    const expectedKmPerLitre = norm?.expectedKmPerLitre || 3.0;
    const expectedLitresPerHour = norm?.litresPerHour || 3.5; // For reefer units
    const tolerance = norm?.tolerancePercentage || 10;
    
    // Calculate distance travelled if not provided (skip for reefer units)
    let distanceTravelled = record.distanceTravelled || 0;
    if (!isReeferUnit && !distanceTravelled && record.previousKmReading && record.kmReading) {
      distanceTravelled = record.kmReading - record.previousKmReading;
    }
    
    // Calculate KM/L if not provided (skip for reefer units)
    let kmPerLitre = record.kmPerLitre || 0;
    if (!isReeferUnit && !kmPerLitre && distanceTravelled > 0 && record.litresFilled > 0) {
      kmPerLitre = distanceTravelled / record.litresFilled;
    }
    
    // Calculate litres per hour for reefer units
    let litresPerHour = 0;
    if (isReeferUnit && record.hoursOperated && record.hoursOperated > 0) {
      litresPerHour = record.litresFilled / record.hoursOperated;
    }
    
    // Calculate cost per KM (skip for reefer units)
    const costPerKm = !isReeferUnit && distanceTravelled > 0 ? record.totalCost / distanceTravelled : 0;
    
    // Calculate cost per hour (for reefer units)
    const costPerHour = isReeferUnit && record.hoursOperated && record.hoursOperated > 0 ? 
                        record.totalCost / record.hoursOperated : 0;
    
    // Calculate cost per litre if not provided
    const costPerLitre = record.costPerLitre || (record.litresFilled > 0 ? record.totalCost / record.litresFilled : 0);
    
    // Performance analysis
    let efficiencyVariance = 0;
    if (!isReeferUnit && kmPerLitre > 0) {
      // For regular units - compare km/l
      efficiencyVariance = ((kmPerLitre - expectedKmPerLitre) / expectedKmPerLitre) * 100;
    } else if (isReeferUnit && litresPerHour > 0) {
      // For reefer units - compare l/hr (inverse relationship - lower is better)
      efficiencyVariance = ((expectedLitresPerHour - litresPerHour) / expectedLitresPerHour) * 100;
    }
    
    const toleranceRange = tolerance;
    const isWithinTolerance = Math.abs(efficiencyVariance) <= toleranceRange;
    const performanceStatus = isReeferUnit ? 'normal' : 
                             isWithinTolerance ? 'normal' : 
                             efficiencyVariance < -toleranceRange ? 'poor' : 'excellent';
    
    // Flag for debrief if outside tolerance and not a reefer unit
    const requiresDebrief = !isReeferUnit && !isWithinTolerance;
    
    // Get linked trip info if available
    const linkedTrip = record.tripId ? trips.find(t => t.id === record.tripId) : undefined;
    
    // Check if truck has probe
    const hasProbe = FLEETS_WITH_PROBES.includes(record.fleetNumber);
    
    // Calculate probe discrepancy
    const probeDiscrepancy = record.probeDiscrepancy !== undefined ? record.probeDiscrepancy : 
                            (hasProbe && record.probeReading !== undefined ? record.litresFilled - record.probeReading : undefined);
    
    // Determine if probe verification is needed
    const needsProbeVerification = hasProbe && 
                                  (!record.probeVerified || 
                                   (probeDiscrepancy !== undefined && Math.abs(probeDiscrepancy) > 50));
    
    // Get linked horse info for reefer units
    const linkedHorse = isReeferUnit && record.linkedHorseId ? 
                        dieselRecords.find(r => r.id === record.linkedHorseId) : undefined;
    
    // Get linked horse's trip
    const linkedHorseTrip = linkedHorse?.tripId ? 
                           trips.find(t => t.id === linkedHorse.tripId) : undefined;
    
    return {
      ...record,
      distanceTravelled,
      kmPerLitre,
      costPerKm,
      costPerLitre,
      expectedKmPerLitre,
      efficiencyVariance,
      performanceStatus,
      requiresDebrief,
      toleranceRange,
      linkedTripInfo: linkedTrip ? {
        route: linkedTrip.route,
        startDate: linkedTrip.startDate,
        endDate: linkedTrip.endDate
      } : undefined,
      hasProbe,
      probeDiscrepancy,
      needsProbeVerification,
      currency: record.currency || 'ZAR', // Default to ZAR if not specified
      isReeferUnit,
      linkedHorseInfo: linkedHorse ? {
        fleetNumber: linkedHorse.fleetNumber,
        driverName: linkedHorse.driverName,
        tripInfo: linkedHorseTrip ? {
          route: linkedHorseTrip.route,
          startDate: linkedHorseTrip.startDate,
          endDate: linkedHorseTrip.endDate
        } : undefined
      } : undefined,
      litresPerHour,
      costPerHour,
      expectedLitresPerHour
    };
  });

  // Apply filters
  const filteredRecords = enhancedRecords.filter(record => {
    if (filterFleet && record.fleetNumber !== filterFleet) return false;
    if (filterDriver && record.driverName !== filterDriver) return false;
    if (filterDate && record.date !== filterDate) return false;
    if (filterCurrency && record.currency !== filterCurrency) return false;
    if (filterProbeStatus) {
      if (filterProbeStatus === 'has-probe' && !record.hasProbe) return false;
      if (filterProbeStatus === 'needs-verification' && !record.needsProbeVerification) return false;
      if (filterProbeStatus === 'verified' && (!record.hasProbe || !record.probeVerified)) return false;
      if (filterProbeStatus === 'large-discrepancy' && (!record.probeDiscrepancy || Math.abs(record.probeDiscrepancy) <= 50)) return false;
      if (filterProbeStatus === 'reefer-units' && !record.isReeferUnit) return false;
    }
    return true;
  });

  const handleEdit = (recordId: string) => {
    const record = dieselRecords.find(r => r.id === recordId);
    if (record) {
      setEditingId(recordId);
      setEditData({
        litresFilled: record.litresFilled !== undefined ? String(record.litresFilled) : '',
        totalCost: record.totalCost !== undefined ? String(record.totalCost) : '',
        kmReading: record.kmReading !== undefined ? String(record.kmReading) : '',
        previousKmReading: record.previousKmReading !== undefined ? String(record.previousKmReading) : '',
        tripId: record.tripId || '',
        currency: record.currency || 'ZAR',
        probeReading: record.probeReading !== undefined ? String(record.probeReading) : '',
        hoursOperated: record.hoursOperated !== undefined ? String(record.hoursOperated) : ''
      });
    }
  };

  const handleSave = (recordId: string) => {
    const record = dieselRecords.find(r => r.id === recordId);
    if (record) {
      // Always parse numbers safely, fallback to 0 if invalid
      const litresFilled = parseFloat(editData.litresFilled);
      const totalCost = parseFloat(editData.totalCost);
      const kmReading = parseFloat(editData.kmReading);
      const previousKmReading = editData.previousKmReading ? parseFloat(editData.previousKmReading) : undefined;
      const probeReading = editData.probeReading ? parseFloat(editData.probeReading) : undefined;
      const hoursOperated = editData.hoursOperated ? parseFloat(editData.hoursOperated) : undefined;
      
      // Validate number fields
      const isReeferUnit = ['4F', '5F', '6F', '7F', '8F'].includes(record.fleetNumber);
      if (isNaN(litresFilled) || isNaN(totalCost) || (isNaN(kmReading) && !isReeferUnit)) {
        alert('Please enter valid numbers for litres filled, total cost, and km reading.');
        return;
      }
      
      // Calculate derived values
      const distanceTravelled = !isReeferUnit && previousKmReading !== undefined ? kmReading - previousKmReading : record.distanceTravelled;
      const kmPerLitre = !isReeferUnit && distanceTravelled && litresFilled > 0 ? distanceTravelled / litresFilled : undefined;
      const costPerLitre = litresFilled > 0 ? totalCost / litresFilled : 0;
      
      // Calculate litres per hour for reefer units
      const litresPerHour = isReeferUnit && hoursOperated && hoursOperated > 0 ? litresFilled / hoursOperated : undefined;
      
      // Calculate probe discrepancy if applicable
      const probeDiscrepancy = probeReading !== undefined ? litresFilled - probeReading : undefined;
      
      updateDieselRecord({
        ...record,
        litresFilled,
        totalCost,
        kmReading: isReeferUnit ? 0 : kmReading,
        previousKmReading: isReeferUnit ? undefined : previousKmReading,
        distanceTravelled,
        kmPerLitre,
        costPerLitre,
        tripId: editData.tripId || undefined,
        currency: editData.currency as 'USD' | 'ZAR',
        probeReading,
        probeDiscrepancy,
        probeVerified: probeReading !== undefined,
        hoursOperated
      });
    }
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({
      litresFilled: '',
      totalCost: '',
      kmReading: '',
      previousKmReading: '',
      tripId: '',
      currency: 'ZAR',
      probeReading: '',
      hoursOperated: ''
    });
  };

  const handleDelete = async (recordId: string) => {
    const record = dieselRecords.find(r => r.id === recordId);
    if (record && confirm(`Are you sure you want to delete the diesel record for Fleet ${record.fleetNumber} on ${record.date}?`)) {
      try {
        setIsDeleting(true);
        await deleteDieselRecord(recordId);
        alert(`Diesel record for Fleet ${record.fleetNumber} deleted successfully`);
      } catch (error) {
        console.error("Error deleting diesel record:", error);
        alert(`Error deleting diesel record: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleLinkToTrip = (recordId: string) => {
    setSelectedDieselId(recordId);
    setIsTripLinkageModalOpen(true);
  };

  const handleVerifyProbe = (recordId: string) => {
    setSelectedDieselId(recordId);
    setIsProbeVerificationModalOpen(true);
  };

  const updateNorms = (updatedNorms: DieselNorms[]) => {
    setDieselNorms(updatedNorms);
    // Save to localStorage for persistence
    localStorage.setItem('dieselNorms', JSON.stringify(updatedNorms));
  };

  const exportCSVTemplate = () => {
    const csvContent = `data:text/csv;charset=utf-8,fleetNumber,date,kmReading,previousKmReading,litresFilled,costPerLitre,totalCost,fuelStation,driverName,notes,currency,probeReading,isReeferUnit,hoursOperated
6H,2025-01-15,125000,123560,450,18.50,8325,RAM Petroleum Harare,Enock Mukonyerwa,Full tank before long trip,ZAR,,false,
26H,2025-01-16,89000,87670,380,19.20,7296,Engen Beitbridge,Jonathan Bepete,Border crossing fill-up,ZAR,,false,
22H,2025-01-17,156000,154824,420,18.75,7875,Shell Mutare,Lovemore Qochiwe,Regular refuel,ZAR,415,false,
6F,2025-01-18,0,,250,19.50,4875,Engen Beitbridge,Peter Farai,Reefer unit refill,ZAR,,true,5.5`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "diesel-import-template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate fleet summary
  const fleetSummary = filteredRecords.reduce((acc, record) => {
    acc.totalRecords++;
    acc.totalLitres += record.litresFilled;
    acc.totalCost += record.totalCost;
    if (!record.isReeferUnit) {
      acc.totalDistance += record.distanceTravelled || 0;
    }
    if (record.requiresDebrief) acc.recordsRequiringDebrief++;
    if (record.performanceStatus === 'poor') acc.poorPerformanceRecords++;
    if (record.performanceStatus === 'excellent') acc.excellentPerformanceRecords++;
    if (record.tripId) acc.linkedToTrips++;
    if (record.hasProbe) acc.recordsWithProbe++;
    if (record.needsProbeVerification) acc.recordsNeedingProbeVerification++;
    if (record.probeVerified) acc.recordsWithVerifiedProbe++;
    if (record.isReeferUnit) acc.reeferUnits++;
    
    // Track by currency
    if (record.currency === 'USD') {
      acc.usdRecords++;
      acc.usdTotalCost += record.totalCost;
    } else {
      acc.zarRecords++;
      acc.zarTotalCost += record.totalCost;
    }
    
    // Track total hours for reefer units
    if (record.isReeferUnit && record.hoursOperated) {
      acc.totalReeferHours += record.hoursOperated;
    }
    
    return acc;
  }, {
    totalRecords: 0,
    totalLitres: 0,
    totalCost: 0,
    totalDistance: 0,
    recordsRequiringDebrief: 0,
    poorPerformanceRecords: 0,
    excellentPerformanceRecords: 0,
    linkedToTrips: 0,
    recordsWithProbe: 0,
    recordsNeedingProbeVerification: 0,
    recordsWithVerifiedProbe: 0,
    usdRecords: 0,
    zarRecords: 0,
    usdTotalCost: 0,
    zarTotalCost: 0,
    reeferUnits: 0,
    totalReeferHours: 0
  });

  const averageKmPerLitre = fleetSummary.totalLitres > 0 && fleetSummary.totalDistance > 0 ? 
    fleetSummary.totalDistance / fleetSummary.totalLitres : 0;
  const averageCostPerKm = fleetSummary.totalDistance > 0 ? 
    fleetSummary.totalCost / fleetSummary.totalDistance : 0;
  const averageLitresPerHour = fleetSummary.totalReeferHours > 0 ?
    fleetSummary.totalLitres / fleetSummary.totalReeferHours : 0;

  // Get unique drivers and fleets for filters
  const uniqueFleets = [...new Set(enhancedRecords.map(r => r.fleetNumber))].sort();
  const uniqueDrivers = [...new Set(enhancedRecords.map(r => r.driverName))].sort();
  const uniqueDates = [...new Set(enhancedRecords.map(r => r.date))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Diesel Dashboard</h2>
          <div className="flex items-center mt-1">
            <p className="text-gray-600 mr-3">Track fuel consumption, efficiency, and performance across the fleet</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={exportCSVTemplate}
            icon={<FileSpreadsheet className="w-4 h-4" />}
          >
            Download CSV Template
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsNormsModalOpen(true)}
            icon={<Settings className="w-4 h-4" />}
          >
            Configure Norms
          </Button>
          <Button 
            variant="outline"
            onClick={() => setIsDebriefModalOpen(true)}
            icon={<Flag className="w-4 h-4" />}
          >
            Fleet Debrief ({fleetSummary.recordsRequiringDebrief})
          </Button>
          <Button 
            variant="outline"
            onClick={() => setIsManualEntryModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Manual Entry
          </Button>
          <Button 
            icon={<Upload className="w-4 h-4" />} 
            onClick={() => setIsImportModalOpen(true)}
          >
            Import Diesel CSV
          </Button>
        </div>
      </div>

      {/* Connection Status Warning */}
      {connectionStatus !== 'connected' && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex items-start space-x-3">
            <Printer className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">Working Offline</h4>
              <p className="text-sm text-amber-700 mt-1">
                You're currently working offline. Diesel records will be stored locally and synced when your connection is restored.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Probe Verification Alert */}
      {fleetSummary.recordsNeedingProbeVerification > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Probe Verification Required</h4>
              <p className="text-sm text-red-700 mt-1">
                {fleetSummary.recordsNeedingProbeVerification} diesel record{fleetSummary.recordsNeedingProbeVerification !== 1 ? 's' : ''} require probe verification. 
                These records have significant discrepancies between filled amount and probe reading.
              </p>
              <div className="mt-3">
                <Button
                  size="sm"
                  onClick={() => setFilterProbeStatus('needs-verification')}
                >
                  View Records Needing Verification
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fleet Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{fleetSummary.totalRecords}</p>
                <p className="text-xs text-gray-400">
                  {fleetSummary.linkedToTrips} linked to trips
                </p>
              </div>
              <Fuel className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Fleet Average KM/L</p>
                <p className="text-2xl font-bold text-blue-600">{averageKmPerLitre.toFixed(2)}</p>
                <p className="text-xs text-gray-400">kilometers per litre</p>
              </div>
              <Calculator className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Cost</p>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-red-600">{formatCurrency(fleetSummary.zarTotalCost, 'ZAR')}</p>
                  {fleetSummary.usdTotalCost > 0 && (
                    <p className="text-lg font-bold text-red-600">{formatCurrency(fleetSummary.usdTotalCost, 'USD')}</p>
                  )}
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Reefer Units</p>
                <p className="text-2xl font-bold text-purple-600">{fleetSummary.reeferUnits}</p>
                <p className="text-xs text-gray-400">
                  {fleetSummary.totalReeferHours > 0 ? 
                    `${fleetSummary.totalReeferHours.toFixed(1)} hours • ${averageLitresPerHour.toFixed(2)} L/hr` : 
                    'refrigeration trailers'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader title="Filter Records" />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Select
              label="Fleet"
              value={filterFleet}
              onChange={(e) => setFilterFleet(e.target.value)}
              options={[
                { label: 'All Fleets', value: '' },
                ...uniqueFleets.map(fleet => ({ 
                  label: `${fleet}${FLEETS_WITH_PROBES.includes(fleet) ? ' (Probe)' : ['4F', '5F', '6F', '7F', '8F'].includes(fleet) ? ' (Reefer)' : ''}`, 
                  value: fleet 
                }))
              ]}
            />
            <Select
              label="Driver"
              value={filterDriver}
              onChange={(e) => setFilterDriver(e.target.value)}
              options={[
                { label: 'All Drivers', value: '' },
                ...uniqueDrivers.map(driver => ({ label: driver, value: driver }))
              ]}
            />
            <Select
              label="Date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              options={[
                { label: 'All Dates', value: '' },
                ...uniqueDates.map(date => ({ 
                  label: formatDate(date), 
                  value: date 
                }))
              ]}
            />
            <Select
              label="Currency"
              value={filterCurrency}
              onChange={(e) => setFilterCurrency(e.target.value)}
              options={[
                { label: 'All Currencies', value: '' },
                { label: 'ZAR (R)', value: 'ZAR' },
                { label: 'USD ($)', value: 'USD' }
              ]}
            />
            <Select
              label="Probe Status"
              value={filterProbeStatus}
              onChange={(e) => setFilterProbeStatus(e.target.value)}
              options={[
                { label: 'All Records', value: '' },
                { label: 'Has Probe', value: 'has-probe' },
                { label: 'Needs Verification', value: 'needs-verification' },
                { label: 'Verified', value: 'verified' },
                { label: 'Large Discrepancy', value: 'large-discrepancy' },
                { label: 'Reefer Units', value: 'reefer-units' }
              ]}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setFilterFleet('');
                setFilterDriver('');
                setFilterDate('');
                setFilterCurrency('');
                setFilterProbeStatus('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader title="Fleet Performance Summary" />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-lg font-bold text-green-600">{fleetSummary.excellentPerformanceRecords}</p>
              <p className="text-sm text-green-700">Excellent Performance</p>
              <p className="text-xs text-gray-500">Above expected efficiency</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Fuel className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-lg font-bold text-gray-600">
                {fleetSummary.totalRecords - fleetSummary.excellentPerformanceRecords - fleetSummary.poorPerformanceRecords - fleetSummary.reeferUnits}
              </p>
              <p className="text-sm text-gray-700">Normal Performance</p>
              <p className="text-xs text-gray-500">Within tolerance range</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <TrendingDown className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-lg font-bold text-red-600">{fleetSummary.poorPerformanceRecords}</p>
              <p className="text-sm text-red-700">Poor Performance</p>
              <p className="text-xs text-gray-500">Below expected efficiency</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="text-lg font-bold text-amber-600">{fleetSummary.recordsNeedingProbeVerification}</p>
              <p className="text-sm text-amber-700">Probe Discrepancies</p>
              <p className="text-xs text-gray-500">Need verification</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No diesel records found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {enhancedRecords.length > 0 
              ? 'No records match your current filter criteria.' 
              : 'Import your diesel consumption data to start tracking fuel efficiency and costs.'}
          </p>
          {enhancedRecords.length === 0 && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsManualEntryModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Manual Entry
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRecords.map((record) => {
            const isReeferUnit = ['4F', '5F', '6F', '7F', '8F'].includes(record.fleetNumber);
            
            return (
              <Card key={record.id} className={`hover:shadow-md transition-shadow ${
                record.needsProbeVerification ? 'border-l-4 border-l-red-400' :
                record.requiresDebrief ? 'border-l-4 border-l-amber-400' : 
                record.performanceStatus === 'excellent' ? 'border-l-4 border-l-green-400' :
                record.performanceStatus === 'poor' ? 'border-l-4 border-l-red-400' :
                isReeferUnit ? 'border-l-4 border-l-purple-400' : ''
              }`}>
                <CardHeader
                  title={`Fleet ${record.fleetNumber}${isReeferUnit ? ' (Reefer)' : ''}`}
                  subtitle={
                    <div className="flex items-center space-x-4">
                      <span>{formatDate(record.date)} • {record.fuelStation}</span>
                      {record.requiresDebrief && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                          <Flag className="w-3 h-3 mr-1" />
                          Requires Debrief
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        record.performanceStatus === 'excellent' ? 'bg-green-100 text-green-800' :
                        record.performanceStatus === 'poor' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {record.performanceStatus.toUpperCase()}
                      </span>
                      {record.linkedTripInfo && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          <Link className="w-3 h-3 mr-1" />
                          Linked to Trip
                        </span>
                      )}
                      {record.linkedHorseInfo && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                          <Link className="w-3 h-3 mr-1" />
                          Linked to Horse {record.linkedHorseInfo.fleetNumber}
                        </span>
                      )}
                      {record.hasProbe && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          record.probeVerified && (!record.probeDiscrepancy || Math.abs(record.probeDiscrepancy) <= 50) 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.probeVerified 
                            ? ((!record.probeDiscrepancy || Math.abs(record.probeDiscrepancy) <= 50) 
                              ? 'Probe Verified' 
                              : 'Probe Discrepancy') 
                            : 'Needs Probe Verification'}
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {record.currency}
                      </span>
                    </div>
                  }
                />
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-8 gap-4 items-end">
                    <div>
                      <p className="text-sm text-gray-500">Driver</p>
                      <p className="font-medium">{record.driverName}</p>
                    </div>

                    {!isReeferUnit ? (
                      <>
                        <div>
                          <p className="text-sm text-gray-500">KM Reading</p>
                          {editingId === record.id ? (
                            <input
                              type="number"
                              className="border rounded px-2 py-1 w-full text-sm"
                              value={editData.kmReading}
                              onChange={e => setEditData(prev => ({ ...prev, kmReading: e.target.value }))}
                            />
                          ) : (
                            <p className="font-medium">{record.kmReading.toLocaleString()}</p>
                          )}
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Previous KM</p>
                          {editingId === record.id ? (
                            <input
                              type="number"
                              className="border rounded px-2 py-1 w-full text-sm"
                              value={editData.previousKmReading}
                              onChange={e => setEditData(prev => ({ ...prev, previousKmReading: e.target.value }))}
                            />
                          ) : (
                            <p className="font-medium">{record.previousKmReading?.toLocaleString() || 'N/A'}</p>
                          )}
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Distance</p>
                          <p className="font-medium">{record.distanceTravelled?.toLocaleString() || 'N/A'} km</p>
                        </div>
                      </>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-500">Hours Operated</p>
                        {editingId === record.id ? (
                          <input
                            type="number"
                            step="0.1"
                            className="border rounded px-2 py-1 w-full text-sm"
                            value={editData.hoursOperated}
                            onChange={e => setEditData(prev => ({ ...prev, hoursOperated: e.target.value }))}
                          />
                        ) : (
                          <p className="font-medium">{record.hoursOperated?.toFixed(1) || 'N/A'} hours</p>
                        )}
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-gray-500">Litres Filled</p>
                      {editingId === record.id ? (
                        <input
                          type="number"
                          step="0.1"
                          className="border rounded px-2 py-1 w-full text-sm"
                          value={editData.litresFilled}
                          onChange={e => setEditData(prev => ({ ...prev, litresFilled: e.target.value }))}
                        />
                      ) : (
                        <p className="font-medium">{record.litresFilled}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Total Cost</p>
                      {editingId === record.id ? (
                        <div className="flex space-x-2">
                          <select
                            className="border rounded px-2 py-1 text-sm"
                            value={editData.currency}
                            onChange={e => setEditData(prev => ({ ...prev, currency: e.target.value }))}
                          >
                            <option value="ZAR">ZAR</option>
                            <option value="USD">USD</option>
                          </select>
                          <input
                            type="number"
                            step="0.01"
                            className="border rounded px-2 py-1 w-full text-sm"
                            value={editData.totalCost}
                            onChange={e => setEditData(prev => ({ ...prev, totalCost: e.target.value }))}
                          />
                        </div>
                      ) : (
                        <p className="font-medium text-red-600">
                          {formatCurrency(record.totalCost, record.currency)}
                        </p>
                      )}
                    </div>

                    {!isReeferUnit ? (
                      <div>
                        <p className="text-sm text-gray-500">KM/L</p>
                        <div className="flex items-center space-x-2">
                          <p className={`font-medium ${
                            record.performanceStatus === 'excellent' ? 'text-green-600' :
                            record.performanceStatus === 'poor' ? 'text-red-600' :
                            'text-gray-900'
                          }`}>
                            {record.kmPerLitre?.toFixed(2) || 'N/A'}
                          </p>
                          {record.efficiencyVariance !== 0 && (
                            <span className={`text-xs px-1 py-0.5 rounded ${
                              record.efficiencyVariance > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {record.efficiencyVariance > 0 ? '+' : ''}{record.efficiencyVariance.toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          Expected: {record.expectedKmPerLitre}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-500">L/Hour</p>
                        <div className="flex items-center space-x-2">
                          <p className={`font-medium ${
                            record.performanceStatus === 'excellent' ? 'text-green-600' :
                            record.performanceStatus === 'poor' ? 'text-red-600' :
                            'text-gray-900'
                          }`}>
                            {record.litresPerHour?.toFixed(2) || 'N/A'}
                          </p>
                          {record.efficiencyVariance !== 0 && (
                            <span className={`text-xs px-1 py-0.5 rounded ${
                              record.efficiencyVariance > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {record.efficiencyVariance > 0 ? '+' : ''}{record.efficiencyVariance.toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          Expected: {record.expectedLitresPerHour?.toFixed(1) || '3.5'}
                        </p>
                      </div>
                    )}

                    <div>
                      {editingId === record.id ? (
                        <div className="space-y-2">
                          {record.hasProbe && (
                            <div className="mb-2">
                              <p className="text-xs text-gray-500">Probe Reading (L)</p>
                              <input
                                type="number"
                                step="0.1"
                                className="border rounded px-2 py-1 w-full text-sm"
                                value={editData.probeReading}
                                onChange={e => setEditData(prev => ({ ...prev, probeReading: e.target.value }))}
                              />
                            </div>
                          )}
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleSave(record.id)}
                              icon={<Save className="w-4 h-4" />}
                            >
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={handleCancel}
                              icon={<X className="w-4 h-4" />}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {record.hasProbe && (
                            <div className={`text-xs p-2 rounded border mb-2 ${
                              !record.probeReading ? 'bg-yellow-50 border-yellow-200' :
                              record.probeDiscrepancy && Math.abs(record.probeDiscrepancy) > 50 ? 'bg-red-50 border-red-200' :
                              'bg-green-50 border-green-200'
                            }`}>
                              <div className="flex items-center space-x-1">
                                <span className="font-medium">Probe:</span>
                                {!record.probeReading ? (
                                  <span className="text-yellow-700">Not recorded</span>
                                ) : (
                                  <>
                                    <span>{record.probeReading}L</span>
                                    {record.probeDiscrepancy !== undefined && (
                                      <span className={Math.abs(record.probeDiscrepancy) > 50 ? 'text-red-700' : 'text-green-700'}>
                                        ({record.probeDiscrepancy > 0 ? '+' : ''}{record.probeDiscrepancy.toFixed(1)}L diff)
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {record.linkedTripInfo && (
                            <div className="text-xs bg-blue-50 p-2 rounded border border-blue-200">
                              <div className="flex items-center space-x-1">
                                <Link className="w-3 h-3 text-blue-600" />
                                <span className="font-medium text-blue-800">Linked Trip:</span>
                              </div>
                              <p className="text-blue-700 mt-1">{record.linkedTripInfo.route}</p>
                              <p className="text-blue-600 text-xs mt-0.5">
                                {formatDate(record.linkedTripInfo.startDate)} - {formatDate(record.linkedTripInfo.endDate)}
                              </p>
                            </div>
                          )}

                          {record.linkedHorseInfo && (
                            <div className="text-xs bg-purple-50 p-2 rounded border border-purple-200">
                              <div className="flex items-center space-x-1">
                                <Link className="w-3 h-3 text-purple-600" />
                                <span className="font-medium text-purple-800">Linked Horse:</span>
                              </div>
                              <p className="text-purple-700 mt-1">Fleet {record.linkedHorseInfo.fleetNumber} - {record.linkedHorseInfo.driverName}</p>
                              {record.linkedHorseInfo.tripInfo && (
                                <p className="text-purple-600 text-xs mt-0.5">
                                  Trip: {record.linkedHorseInfo.tripInfo.route}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              icon={<Edit className="w-4 h-4" />}
                              onClick={() => handleEdit(record.id)}
                              disabled={isDeleting}
                            >
                              Edit
                            </Button>
                            {record.hasProbe && record.needsProbeVerification && (
                              <Button
                                size="sm"
                                variant="outline"
                                icon={<CheckCircle className="w-4 h-4" />}
                                onClick={() => handleVerifyProbe(record.id)}
                                disabled={isDeleting}
                              >
                                Verify Probe
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              icon={<Link className="w-4 h-4" />}
                              onClick={() => handleLinkToTrip(record.id)}
                              disabled={isDeleting}
                            >
                              {isReeferUnit 
                                ? (record.linkedHorseId ? 'Change Horse' : 'Link to Horse')
                                : (record.tripId ? 'Change Trip' : 'Link to Trip')
                              }
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              icon={<Trash2 className="w-4 h-4" />}
                              onClick={() => handleDelete(record.id)}
                              disabled={isDeleting}
                              isLoading={isDeleting}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <DieselImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
      />
      
      <ManualDieselEntryModal
        isOpen={isManualEntryModalOpen}
        onClose={() => setIsManualEntryModalOpen(false)}
      />
      
      <DieselDebriefModal 
        isOpen={isDebriefModalOpen} 
        onClose={() => setIsDebriefModalOpen(false)}
        records={enhancedRecords.filter(r => r.requiresDebrief)}
        norms={dieselNorms}
      />
      
      <DieselNormsModal
        isOpen={isNormsModalOpen}
        onClose={() => setIsNormsModalOpen(false)}
        norms={dieselNorms}
        onUpdateNorms={updateNorms}
      />
      
      {selectedDieselId && (
        <>
          <TripLinkageModal
            isOpen={isTripLinkageModalOpen}
            onClose={() => {
              setIsTripLinkageModalOpen(false);
              setSelectedDieselId('');
            }}
            dieselRecordId={selectedDieselId}
          />
          
          <ProbeVerificationModal
            isOpen={isProbeVerificationModalOpen}
            onClose={() => {
              setIsProbeVerificationModalOpen(false);
              setSelectedDieselId('');
            }}
            dieselRecordId={selectedDieselId}
          />
        </>
      )}
    </div>
  );
};

export default DieselDashboard;