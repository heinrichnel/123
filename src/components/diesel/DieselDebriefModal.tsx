// ─── React ───────────────────────────────────────────────────────
import React, { useState } from 'react';

// ─── UI Components ───────────────────────────────────────────────
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card, { CardContent } from '../ui/Card';

// ─── Icons ───────────────────────────────────────────────────────
import {
  AlertTriangle,
  TrendingDown,
  Flag,
  Printer,
  CheckCircle,
  Fuel
} from 'lucide-react';

// ─── Utilities ───────────────────────────────────────────────────
import { formatDate } from '../../utils/helpers';


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
      ['Fleet Number', 'Date', 'Driver', 'KM Reading', 'Litres', 'KM/L', 'Expected', 'Variance (%)', 'Performance', 'Fuel Station', 'Total Cost', 'Debrief Notes', 'Debrief Date', 'Signed']
    ];

    records.forEach(r => {
      rows.push([
        r.fleetNumber,
        r.date,
        r.driverName,
        r.kmReading.toString(),
        r.litresFilled.toString(),
        r.kmPerLitre?.toFixed(2) || '',
        r.expectedKmPerLitre.toString(),
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
                  {r.fleetNumber} - {r.driverName} ({r.date})
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-600">
                <div><strong>KM/L:</strong> {r.kmPerLitre?.toFixed(2) || 'N/A'}</div>
                <div><strong>Expected:</strong> {r.expectedKmPerLitre}</div>
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
            <Button variant="outline" onClick={generateCSV} icon={<Printer className="w-4 h-4" />}>
              Export CSV
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

export default DieselDebriefModal;
