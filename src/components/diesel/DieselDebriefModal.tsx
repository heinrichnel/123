import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card, { CardContent, CardHeader } from '../ui/Card';
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
  FileSignature
} from 'lucide-react';
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
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.6; 
              color: #333;
            }
            .header { 
              border-bottom: 3px solid #2563eb; 
              padding-bottom: 15px; 
              margin-bottom: 25px; 
              text-align: center;
            }
            .header h1 { 
              color: #1e40af; 
              margin: 0; 
              font-size: 24px;
            }
            .company-info {
              text-align: center;
              margin-bottom: 30px;
              padding: 15px;
              background: #f8fafc;
              border-radius: 8px;
            }
            .section { 
              margin-bottom: 30px; 
              page-break-inside: avoid; 
            }
            .summary-grid { 
              display: grid; 
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
              gap: 15px; 
              margin: 20px 0; 
            }
            .summary-card { 
              border: 2px solid #e5e7eb; 
              padding: 15px; 
              border-radius: 8px; 
              text-align: center; 
              background: #f9fafb; 
            }
            .record-card {
              border: 1px solid #d1d5db;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
              background: white;
              page-break-inside: avoid;
            }
            .record-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #f3f4f6;
            }
            .fleet-info {
              font-size: 18px;
              font-weight: bold;
              color: #1f2937;
            }
            .status-badge {
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-critical {
              background-color: #fee2e2;
              color: #b91c1c;
            }
            .status-review {
              background-color: #fef3c7;
              color: #92400e;
            }
            .record-details {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-bottom: 15px;
            }
            .detail-group {
              margin-bottom: 10px;
            }
            .detail-label {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 2px;
            }
            .detail-value {
              font-size: 14px;
              font-weight: 500;
              color: #1f2937;
            }
            .detail-value.negative {
              color: #b91c1c;
            }
            .detail-value.positive {
              color: #047857;
            }
            .debrief-section {
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px solid #e5e7eb;
            }
            .debrief-notes {
              background-color: #f9fafb;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 15px;
              min-height: 80px;
            }
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px dashed #d1d5db;
            }
            .signature-box {
              width: 45%;
            }
            .signature-line {
              border-bottom: 1px solid #000;
              height: 40px;
              margin-bottom: 5px;
            }
            .signature-label {
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
            .page-break {
              page-break-after: always;
            }
            @media print {
              .record-card {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DIESEL EFFICIENCY DEBRIEF REPORT</h1>
            <p>Generated on ${formatDate(new Date())}</p>
          </div>

          <div class="company-info">
            <h2>Matanuska Transport</h2>
            <p>Fleet Performance Management</p>
          </div>

          <div class="section">
            <h2>Summary</h2>
            <div class="summary-grid">
              <div class="summary-card">
                <h3>Total Records</h3>
                <p style="font-size: 24px; font-weight: bold;">${filteredRecords.length}</p>
                <p>requiring debrief</p>
              </div>
              <div class="summary-card">
                <h3>Poor Performance</h3>
                <p style="font-size: 24px; font-weight: bold; color: #b91c1c;">
                  ${filteredRecords.filter(r => r.performanceStatus === 'poor').length}
                </p>
                <p>below expected efficiency</p>
              </div>
              <div class="summary-card">
                <h3>Critical Issues</h3>
                <p style="font-size: 24px; font-weight: bold; color: #b91c1c;">
                  ${filteredRecords.filter(r => r.efficiencyVariance < -20).length}
                </p>
                <p>>20% variance</p>
              </div>
            </div>
          </div>

          ${filteredRecords.map((record, index) => `
            <div class="record-card ${index < filteredRecords.length - 1 ? 'page-break' : ''}">
              <div class="record-header">
                <div class="fleet-info">
                  Fleet ${record.fleetNumber} - ${record.driverName}
                </div>
                <span class="status-badge ${record.efficiencyVariance < -20 ? 'status-critical' : 'status-review'}">
                  ${record.efficiencyVariance < -20 ? 'CRITICAL' : 'REVIEW'}
                </span>
              </div>

              <div class="record-details">
                <div>
                  <div class="detail-group">
                    <div class="detail-label">Date & Station</div>
                    <div class="detail-value">${formatDate(record.date)}</div>
                    <div class="detail-value">${record.fuelStation}</div>
                  </div>
                  
                  <div class="detail-group">
                    <div class="detail-label">Distance & Fuel</div>
                    <div class="detail-value">${record.distanceTravelled?.toLocaleString() || 'N/A'} km</div>
                    <div class="detail-value">${record.litresFilled} litres</div>
                  </div>
                </div>
                
                <div>
                  <div class="detail-group">
                    <div class="detail-label">Efficiency</div>
                    <div class="detail-value negative">
                      ${record.kmPerLitre?.toFixed(2) || 'N/A'} KM/L
                    </div>
                    <div class="detail-value">Expected: ${record.expectedKmPerLitre} KM/L</div>
                    <div class="detail-value negative">
                      Variance: ${record.efficiencyVariance.toFixed(1)}%
                    </div>
                  </div>
                  
                  <div class="detail-group">
                    <div class="detail-label">Cost Impact</div>
                    <div class="detail-value">R${record.totalCost.toFixed(2)}</div>
                    <div class="detail-value">
                      ${record.distanceTravelled ? 'R' + (record.totalCost / record.distanceTravelled).toFixed(2) : 'N/A'}/km
                    </div>
                  </div>
                </div>
              </div>

              <div class="debrief-section">
                <h3>Debrief Notes & Action Items</h3>
                <div class="debrief-notes">
                  ${debriefNotes[record.id] || 'No debrief notes recorded.'}
                </div>
                
                <div class="detail-group">
                  <div class="detail-label">Debrief Date</div>
                  <div class="detail-value">${debriefDates[record.id] || 'Not recorded'}</div>
                </div>
              </div>

              <div class="signature-section">
                <div class="signature-box">
                  <div class="signature-line"></div>
                  <div class="signature-label">Driver Signature</div>
                </div>
                
                <div class="signature-box">
                  <div class="signature-line"></div>
                  <div class="signature-label">Fleet Manager Signature</div>
                </div>
              </div>
            </div>
          `).join('')}

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 1000);
            };
          </script>
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
        {/* Header Alert */}
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

        {/* Summary Cards */}
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

        {/* Filter Controls */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by Fleet:</label>
            <select
              value={selectedFleet}
              onChange={(e) => setSelectedFleet(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Fleets ({records.length})</option>
              {fleetNumbers.map(fleet => (
                <option key={fleet} value={fleet}>
                  Fleet {fleet} ({records.filter(r => r.fleetNumber === fleet).length})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex space-x-3">
            <Button
              size="sm"
              variant="outline"
              onClick={generateDebriefReport}
              icon={<Download className="w-4 h-4" />}
            >
              Export CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={generatePDFDebriefReport}
              icon={<Printer className="w-4 h-4" />}
            >
              Print Debrief Forms
            </Button>
          </div>
        </div>

        {/* Records List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Records Require Debrief</h3>
              <p className="text-gray-500">All selected fleet records are within tolerance limits.</p>
            </div>
          ) : (
            filteredRecords.map((record) => (
              <Card key={record.id} className={`border-l-4 ${
                record.efficiencyVariance < -20 ? 'border-l-red-500' : 'border-l-amber-400'
              }`}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Record Details */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">
                          Fleet {record.fleetNumber} - {record.driverName}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            record.efficiencyVariance < -20 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {record.efficiencyVariance < -20 ? 'CRITICAL' : 'REVIEW'}
                          </span>
                          <span className="text-sm font-medium text-red-600">
                            {record.efficiencyVariance.toFixed(1)}% variance
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Date & Station</p>
                          <p className="font-medium">{formatDate(record.date)}</p>
                          <p className="text-gray-600">{record.fuelStation}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Distance & Fuel</p>
                          <p className="font-medium">{record.distanceTravelled?.toLocaleString() || 'N/A'} km</p>
                          <p className="text-gray-600">{record.litresFilled} litres</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Efficiency</p>
                          <p className="font-medium text-red-600">
                            {record.kmPerLitre?.toFixed(2) || 'N/A'} KM/L
                          </p>
                          <p className="text-gray-600">Expected: {record.expectedKmPerLitre} KM/L</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Cost Impact</p>
                          <p className="font-medium">{formatCurrency(record.totalCost, 'ZAR')}</p>
                          <p className="text-gray-600">
                            {record.distanceTravelled ? formatCurrency(record.totalCost / record.distanceTravelled, 'ZAR') : 'N/A'}/km
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Debrief Notes & Signature */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Debrief Notes & Action Items
                        </label>
                        <textarea
                          value={debriefNotes[record.id] || ''}
                          onChange={(e) => handleAddNote(record.id, e.target.value)}
                          placeholder="Document findings, potential causes, and corrective actions..."
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      {/* Debrief Date */}
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Debrief Date
                          </label>
                          <input
                            type="date"
                            value={debriefDates[record.id] || new Date().toISOString().split('T')[0]}
                            onChange={(e) => handleSetDebriefDate(record.id, e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      
                      {/* Driver Signature */}
                      <div className="flex items-center space-x-3">
                        <FileSignature className="w-4 h-4 text-gray-500" />
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Driver Signature Status
                          </label>
                          <div className="mt-1 flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => handleToggleSignature(record.id)}
                              className={`px-3 py-1 text-sm rounded-md ${
                                driverSignatures[record.id] 
                                  ? 'bg-green-100 text-green-800 border border-green-200' 
                                  : 'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}
                            >
                              {driverSignatures[record.id] ? 'Signed' : 'Not Signed'}
                            </button>
                            {driverSignatures[record.id] && (
                              <span className="text-xs text-green-600">
                                Driver has acknowledged the debrief
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Quick Action Suggestions */}
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Quick Actions:</p>
                        <div className="flex flex-wrap gap-1">
                          {[
                            'Check tire pressure',
                            'Engine maintenance required',
                            'Driver training needed',
                            'Route optimization',
                            'Load weight review'
                          ].map((action) => (
                            <button
                              key={action}
                              onClick={() => {
                                const currentNote = debriefNotes[record.id] || '';
                                const newNote = currentNote ? `${currentNote}\n• ${action}` : `• ${action}`;
                                handleAddNote(record.id, newNote);
                              }}
                              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border text-gray-700"
                            >
                              + {action}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Action Buttons */}
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