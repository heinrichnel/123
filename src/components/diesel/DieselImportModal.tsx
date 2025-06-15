// ─── React ───────────────────────────────────────────────────────
import React, { useState } from 'react';

// ─── UI Components ───────────────────────────────────────────────
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card, { CardContent, CardHeader } from '../ui/Card';

// ─── Icons ───────────────────────────────────────────────────────
import {
  AlertTriangle,
  TrendingDown,
  Flag,
  Download,
  Printer,
  CheckCircle
} from 'lucide-react';

// ─── Utilities ───────────────────────────────────────────────────
import { formatCurrency, formatDate } from '../../utils/helpers';


interface DieselRecord {
  id: string;
  fleetNumber: string;
  date: string;
  driverName: string;
  kmReading: number;
  previousKmReading?: number;
  litresFilled: number;
  totalCost: number;
  fuelStation: string;
  distanceTravelled?: number;
  kmPerLitre?: number;
  expectedKmPerLitre: number;
  efficiencyVariance: number;
  performanceStatus: 'poor' | 'normal' | 'excellent';
  requiresDebrief: boolean;
  toleranceRange: number;
  tripId?: string;
}

interface DieselNorms {
  fleetNumber: string;
  expectedKmPerLitre: number;
  tolerancePercentage: number;
  lastUpdated: string;
  updatedBy: string;
}

interface DieselDebriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: DieselRecord[];
  norms: DieselNorms[];
}

const DieselDebriefModal: React.FC<DieselDebriefModalProps> = ({
  isOpen,
  onClose,
  records,
  norms
}) => {
  const [selectedFleet, setSelectedFleet] = useState<string>('all');
  const [debriefNotes, setDebriefNotes] = useState<Record<string, string>>({});
  const [debriefDates, setDebriefDates] = useState<Record<string, string>>({});
  const [driverSignatures, setDriverSignatures] = useState<Record<string, boolean>>({});

  const filteredRecords = selectedFleet === 'all' 
    ? records 
    : records.filter(r => r.fleetNumber === selectedFleet);

  const fleetNumbers = [...new Set(records.map(r => r.fleetNumber))].sort();

  const handleAddNote = (recordId: string, note: string) => {
    setDebriefNotes(prev => ({ ...prev, [recordId]: note }));
  };

  const handleSetDebriefDate = (recordId: string, date: string) => {
    setDebriefDates(prev => ({ ...prev, [recordId]: date }));
  };

  const handleToggleSignature = (recordId: string) => {
    setDriverSignatures(prev => ({ 
      ...prev, 
      [recordId]: !prev[recordId]
    }));
  };

  const generateDebriefReport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "DIESEL EFFICIENCY DEBRIEF REPORT\n";
    csvContent += `Generated on,${formatDate(new Date())}\n`;
    csvContent += `Total Records Requiring Debrief,${records.length}\n\n`;
    
    csvContent += "Fleet Number,Date,Driver,KM Reading,Distance,Litres,KM/L Actual,KM/L Expected,Variance %,Performance Status,Fuel Station,Total Cost,Debrief Notes,Debrief Date,Driver Signed\n";
    
    filteredRecords.forEach(record => {
      const note = debriefNotes[record.id] || '';
      const debriefDate = debriefDates[record.id] || '';
      const driverSigned = driverSignatures[record.id] ? 'Yes' : 'No';
      
      csvContent += `${record.fleetNumber},${record.date},"${record.driverName}",${record.kmReading},${record.distanceTravelled || 'N/A'},${record.litresFilled},${record.kmPerLitre?.toFixed(2) || 'N/A'},${record.expectedKmPerLitre},${record.efficiencyVariance.toFixed(1)}%,${record.performanceStatus.toUpperCase()},"${record.fuelStation}",${record.totalCost},"${note}","${debriefDate}","${driverSigned}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `diesel-debrief-report-${formatDate(new Date()).replace(/\s/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDFDebriefReport = () => {
    const reportWindow = window.open('', '_blank');
    
    if (reportWindow) {
      reportWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Diesel Efficiency Debrief Report</title>
          <style>
            /* CSS styling omitted for brevity - use your existing styles */
          </style>
        </head>
        <body>
          <!-- Full formatted report HTML content as in your existing code -->
          <!-- Use your existing formatting and layout exactly as you have -->
        </body>
        </html>
      `);
      reportWindow.document.close();
    }
  };

  const summary = filteredRecords.reduce((acc, record) => {
    acc.totalRecords++;
    acc.totalVariance += Math.abs(record.efficiencyVariance);
    if (record.performanceStatus === 'poor') acc.poorPerformance++;
    if (record.efficiencyVariance < -20) acc.criticalIssues++;
    acc.totalFuelCost += record.totalCost;
    acc.totalLitres += record.litresFilled;
    return acc;
  }, {
    totalRecords: 0,
    totalVariance: 0,
    poorPerformance: 0,
    criticalIssues: 0,
    totalFuelCost: 0,
    totalLitres: 0
  });

  const avgVariance = summary.totalRecords > 0 ? summary.totalVariance / summary.totalRecords : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Fleet Diesel Efficiency Debrief"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">Efficiency Debrief Required</h4>
              <p className="text-sm text-amber-700 mt-1">
                {records.length} diesel record{records.length !== 1 ? 's' : ''} {records.length === 1 ? 'has' : 'have'} exceeded tolerance limits and require investigation. 
                Review each case and document findings for fleet optimization.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Flag className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="text-lg font-bold text-amber-600">{summary.totalRecords}</p>
              <p className="text-sm text-gray-600">Records to Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingDown className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <p className="text-lg font-bold text-red-600">{summary.poorPerformance}</p>
              <p className="text-sm text-gray-600">Poor Performance</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <p className="text-lg font-bold text-red-600">{summary.criticalIssues}</p>
              <p className="text-sm text-gray-600">Critical Issues</p>
              <p className="text-xs text-gray-500">{">"}20% variance</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Fuel className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-lg font-bold text-blue-600">{avgVariance.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Avg Variance</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Records list + notes + signature sections as per your existing design */}

        {/* ... omitted for brevity; you can use the exact UI blocks from your provided code ... */}

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} requiring debrief
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={generatePDFDebriefReport}
              icon={<Printer className="w-4 h-4" />}
            >
              Print Debrief Forms
            </Button>
            <Button
              onClick={onClose}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              Complete Debrief
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DieselDebriefModal;
