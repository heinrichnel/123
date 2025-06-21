// ─── React ───────────────────────────────────────────────────────
import React, { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────
import { DieselConsumptionRecord } from '../../types';

// ─── UI Components ───────────────────────────────────────────────
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card, { CardContent, CardHeader } from '../ui/Card';

// ─── Icons ───────────────────────────────────────────────────────
import {
  X,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  FileText,
  Download,
  Flag,
  CheckCircle,
  Fuel,
  Printer,
  Calendar,
  User,
  FileSignature,
  Clock
} from 'lucide-react';

// ─── Utilities ───────────────────────────────────────────────────
import { formatCurrency, formatDate } from '../../utils/helpers';
import jsPDF from 'jspdf';


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
  currency?: 'USD' | 'ZAR';
  isReeferUnit?: boolean;
  litresPerHour?: number;
  expectedLitresPerHour?: number;
  hoursOperated?: number;
}

<<<<<<< HEAD
interface DieselNorms {
  fleetNumber: string;
  expectedKmPerLitre: number;
  tolerancePercentage: number;
  lastUpdated: string;
  updatedBy: string;
  isReeferUnit?: boolean;
  litresPerHour?: number;
}
=======
const DieselImportModal: React.FC<DieselImportModalProps> = ({ isOpen, onClose }) => {
  const { importDieselFromCSV, connectionStatus } = useAppContext();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
>>>>>>> 26992b5f0a3b081be38f1bd0501c447ccf1bbf89

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
  norms,
}) => {
  const [debriefNotes, setDebriefNotes] = useState<Record<string, string>>({});
  const [debriefDates, setDebriefDates] = useState<Record<string, string>>({});
  const [driverSignatures, setDriverSignatures] = useState<Record<string, boolean>>({});

  const handleNoteChange = (id: string, value: string) => {
    setDebriefNotes(prev => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (id: string, value: string) => {
    setDebriefDates(prev => ({ ...prev, [id]: value }));
  };

  const toggleSignature = (id: string) => {
    setDriverSignatures(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const generateCSV = () => {
    const rows = [
      ['Fleet Number', 'Date', 'Driver', 'KM Reading', 'Litres', 'KM/L or L/hr', 'Expected', 'Variance (%)', 'Performance', 'Fuel Station', 'Total Cost', 'Debrief Notes', 'Debrief Date', 'Signed']
    ];

    records.forEach(r => {
      const efficiencyMetric = r.isReeferUnit 
        ? `${r.litresPerHour?.toFixed(2) || 'N/A'} L/hr` 
        : `${r.kmPerLitre?.toFixed(2) || 'N/A'} KM/L`;
      
      const expectedMetric = r.isReeferUnit
        ? `${r.expectedLitresPerHour?.toFixed(2) || '3.5'} L/hr`
        : `${r.expectedKmPerLitre.toString()} KM/L`;
      
      rows.push([
        r.fleetNumber,
        r.date,
        r.driverName,
        r.kmReading.toString(),
        r.litresFilled.toString(),
        efficiencyMetric,
        expectedMetric,
        r.efficiencyVariance.toFixed(2),
        r.performanceStatus,
        r.fuelStation,
        r.totalCost.toFixed(2),
        debriefNotes[r.id] || '',
        debriefDates[r.id] || '',
        driverSignatures[r.id] ? 'Yes' : 'No',
      ]);
    });

    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `diesel-debrief-${formatDate(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = () => {
    // Create a new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add title
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 128);
    doc.text('Diesel Efficiency Debrief Report', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });
    
    // Add summary
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary:', 14, 30);
    
    const summary = records.reduce(
      (acc, r) => {
        acc.total++;
        acc.variance += Math.abs(r.efficiencyVariance);
        if (r.performanceStatus === 'poor') acc.poor++;
        if (r.efficiencyVariance < -20) acc.critical++;
        acc.cost += r.totalCost;
        acc.litres += r.litresFilled;
        return acc;
      },
      {
        total: 0,
        variance: 0,
        poor: 0,
        critical: 0,
        cost: 0,
        litres: 0,
      }
    );
    
    const avgVariance = summary.total ? (summary.variance / summary.total).toFixed(1) : '0.0';
    
    doc.setFontSize(10);
    doc.text(`Total Records: ${summary.total}`, 20, 38);
    doc.text(`Poor Performance: ${summary.poor}`, 20, 44);
    doc.text(`Critical Variance: ${summary.critical}`, 20, 50);
    doc.text(`Average Variance: ${avgVariance}%`, 20, 56);
    
    // Individual record pages
    let yPos = 70;
    let pageNum = 1;
    
    records.forEach((record, index) => {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
        pageNum++;
      }
      
      // Record header
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 128);
      doc.text(`Record #${index + 1}: Fleet ${record.fleetNumber}${record.isReeferUnit ? ' (Reefer)' : ''}`, 14, yPos);
      yPos += 8;
      
      // Record details
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Driver: ${record.driverName}`, 20, yPos);
      yPos += 6;
      doc.text(`Date: ${formatDate(record.date)}`, 20, yPos);
      yPos += 6;
      doc.text(`Fuel Station: ${record.fuelStation}`, 20, yPos);
      yPos += 6;
      
      if (record.isReeferUnit) {
        doc.text(`Hours Operated: ${record.hoursOperated?.toFixed(1) || 'N/A'} hours`, 20, yPos);
        yPos += 6;
      } else {
        doc.text(`KM Reading: ${record.kmReading.toLocaleString()}`, 20, yPos);
        yPos += 6;
        
        if (record.previousKmReading) {
          doc.text(`Previous KM: ${record.previousKmReading.toLocaleString()}`, 20, yPos);
          yPos += 6;
        }
        
        if (record.distanceTravelled) {
          doc.text(`Distance: ${record.distanceTravelled.toLocaleString()} km`, 20, yPos);
          yPos += 6;
        }
      }
      
      doc.text(`Litres Filled: ${record.litresFilled}`, 20, yPos);
      yPos += 6;
      
      const currencySymbol = record.currency === 'USD' ? '$' : 'R';
      doc.text(`Total Cost: ${currencySymbol}${record.totalCost.toFixed(2)}`, 20, yPos);
      yPos += 6;
      
      // Efficiency metrics
      doc.setTextColor(255, 0, 0);
      if (record.isReeferUnit) {
        doc.text(`L/hr: ${record.litresPerHour?.toFixed(2) || 'N/A'} (Expected: ${record.expectedLitresPerHour?.toFixed(1) || '3.5'})`, 20, yPos);
      } else {
        doc.text(`KM/L: ${record.kmPerLitre?.toFixed(2) || 'N/A'} (Expected: ${record.expectedKmPerLitre})`, 20, yPos);
      }
      yPos += 6;
      
      doc.text(`Variance: ${record.efficiencyVariance.toFixed(1)}%`, 20, yPos);
      yPos += 6;
      
      doc.text(`Performance: ${record.performanceStatus.toUpperCase()}`, 20, yPos);
      yPos += 6;
      
      // Debrief information
      doc.setTextColor(0, 100, 0);
      doc.text(`Debrief Notes: ${debriefNotes[record.id] || 'None provided'}`, 20, yPos);
      yPos += 6;
      
      doc.text(`Debrief Date: ${debriefDates[record.id] || 'Not set'}`, 20, yPos);
      yPos += 6;
      
      doc.text(`Driver Signed: ${driverSignatures[record.id] ? 'Yes' : 'No'}`, 20, yPos);
      yPos += 15;
    });
    
    // Save the PDF
    doc.save(`diesel-debrief-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const summary = records.reduce(
    (acc, r) => {
      acc.total++;
      acc.variance += Math.abs(r.efficiencyVariance);
      if (r.performanceStatus === 'poor') acc.poor++;
      if (r.efficiencyVariance < -20) acc.critical++;
      acc.cost += r.totalCost;
      acc.litres += r.litresFilled;
      return acc;
    },
    {
      total: 0,
      variance: 0,
      poor: 0,
      critical: 0,
      cost: 0,
      litres: 0,
    }
  );

  const avgVariance = summary.total ? (summary.variance / summary.total).toFixed(1) : '0.0';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Diesel Efficiency Debrief" maxWidth="2xl">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="text-center">
              <Flag className="mx-auto h-6 w-6 text-yellow-600 mb-2" />
              <p className="font-bold text-lg text-yellow-700">{summary.total}</p>
              <p className="text-sm text-gray-600">Total Records</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <TrendingDown className="mx-auto h-6 w-6 text-red-600 mb-2" />
              <p className="font-bold text-lg text-red-700">{summary.poor}</p>
              <p className="text-sm text-gray-600">Poor Performance</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <AlertTriangle className="mx-auto h-6 w-6 text-orange-600 mb-2" />
              <p className="font-bold text-lg text-orange-700">{summary.critical}</p>
              <p className="text-sm text-gray-600">Critical Variance</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <Fuel className="mx-auto h-6 w-6 text-blue-600 mb-2" />
              <p className="font-bold text-lg text-blue-700">{avgVariance}%</p>
              <p className="text-sm text-gray-600">Avg Variance</p>
            </CardContent>
          </Card>
        </div>

        {/* Records */}
        <div className="space-y-4 max-h-[50vh] overflow-y-auto">
          {records.map(r => (
            <div key={r.id} className="border p-4 rounded-lg space-y-2 bg-gray-50">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-700">
                  {r.fleetNumber}{r.isReeferUnit ? ' (Reefer)' : ''} - {r.driverName} ({r.date})
                </p>
                <span className={`text-xs px-2 py-1 rounded ${
                  r.performanceStatus === 'poor'
                    ? 'bg-red-100 text-red-700'
                    : r.performanceStatus === 'normal'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {r.performanceStatus.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-gray-600">
                {r.isReeferUnit ? (
                  <>
                    <div><strong>Hours:</strong> {r.hoursOperated?.toFixed(1) || 'N/A'}</div>
                    <div><strong>L/Hour:</strong> {r.litresPerHour?.toFixed(2) || 'N/A'}</div>
                    <div><strong>Expected:</strong> {r.expectedLitresPerHour?.toFixed(1) || '3.5'}</div>
                  </>
                ) : (
                  <>
                    <div><strong>KM/L:</strong> {r.kmPerLitre?.toFixed(2) || 'N/A'}</div>
                    <div><strong>Expected:</strong> {r.expectedKmPerLitre}</div>
                  </>
                )}
                <div><strong>Variance:</strong> {r.efficiencyVariance.toFixed(1)}%</div>
                <div><strong>Fuel Station:</strong> {r.fuelStation}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <textarea
                  placeholder="Debrief Notes"
                  value={debriefNotes[r.id] || ''}
                  onChange={(e) => handleNoteChange(r.id, e.target.value)}
                  className="w-full p-2 text-sm border rounded"
                />
                <input
                  type="date"
                  value={debriefDates[r.id] || ''}
                  onChange={(e) => handleDateChange(r.id, e.target.value)}
                  className="border p-2 text-sm rounded"
                />
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={driverSignatures[r.id] || false}
                    onChange={() => toggleSignature(r.id)}
                  />
                  <span>Driver Signed</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center border-t pt-4">
          <p className="text-sm text-gray-600">
            {records.length} record{records.length !== 1 ? 's' : ''} needing review
          </p>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={generateCSV} icon={<FileText className="w-4 h-4" />}>
              Export CSV
            </Button>
            <Button variant="outline" onClick={generatePDF} icon={<Printer className="w-4 h-4" />}>
              Export PDF
            </Button>
            <Button onClick={onClose} icon={<CheckCircle className="w-4 h-4" />}>
              Complete Debrief
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

<<<<<<< HEAD
export default DieselDebriefModal;
=======
export default DieselImportModal;
>>>>>>> 26992b5f0a3b081be38f1bd0501c447ccf1bbf89
