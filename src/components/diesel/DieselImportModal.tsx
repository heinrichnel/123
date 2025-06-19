// ─── React & Context ─────────────────────────────────────────────
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

// ─── UI Components ───────────────────────────────────────────────
import Modal from '../ui/Modal';
import Button from '../ui/Button';

// ─── Icons ───────────────────────────────────────────────────────
import {
  Upload,
  X,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Download
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────
import { FUEL_STATIONS } from '../../types';


interface DieselImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DieselImportModal: React.FC<DieselImportModalProps> = ({
  isOpen,
  onClose
}) => {
  const { importDieselRecords, connectionStatus } = useAppContext();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);

    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'csv') {
        setError('Only CSV files are allowed.');
        setFile(null);
        setPreviewData([]);
      } else {
        setError('');
        
        // Generate preview
        try {
          const text = await selectedFile.text();
          const data = parseCSV(text);
          setPreviewData(data.slice(0, 3)); // Show first 3 rows
        } catch (error) {
          console.error('Failed to parse CSV for preview:', error);
          setError('Failed to parse CSV file. Please check the format.');
        }
      }
    } else {
      setPreviewData([]);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }
    
    return data;
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      const text = await file.text();
      const data = parseCSV(text);
      
      // Convert to diesel records
      const dieselRecords = data.map((row: any) => ({
        id: `diesel-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        fleetNumber: row.fleetNumber || '',
        date: row.date || new Date().toISOString().split('T')[0],
        kmReading: parseFloat(row.kmReading || '0'),
        previousKmReading: row.previousKmReading ? parseFloat(row.previousKmReading) : undefined,
        litresFilled: parseFloat(row.litresFilled || '0'),
        costPerLitre: row.costPerLitre ? parseFloat(row.costPerLitre) : undefined,
        totalCost: parseFloat(row.totalCost || '0'),
        fuelStation: row.fuelStation || '',
        driverName: row.driverName || '',
        notes: row.notes || '',
        currency: row.currency || 'ZAR',
        probeReading: row.probeReading ? parseFloat(row.probeReading) : undefined,
        isReeferUnit: row.isReeferUnit === 'true' || row.isReeferUnit === true || ['4F', '5F', '7F', '8F'].includes(row.fleetNumber)
      }));

      // Calculate derived values
      dieselRecords.forEach(record => {
        // Skip distance calculations for reefer units
        if (!record.isReeferUnit) {
          if (record.previousKmReading !== undefined && record.kmReading) {
            record.distanceTravelled = record.kmReading - record.previousKmReading;
          }
          
          if (record.distanceTravelled && record.litresFilled) {
            record.kmPerLitre = record.distanceTravelled / record.litresFilled;
          }
        }
        
        if (!record.costPerLitre && record.totalCost && record.litresFilled) {
          record.costPerLitre = record.totalCost / record.litresFilled;
        }
        
        if (record.probeReading !== undefined) {
          record.probeDiscrepancy = record.litresFilled - record.probeReading;
        }
      });

      // Create FormData for upload
      const formData = new FormData();
      formData.append('records', JSON.stringify(dieselRecords));
      
      await importDieselRecords(formData);
      setSuccess(`Successfully imported ${dieselRecords.length} diesel records.`);
      setFile(null);
      setPreviewData([]);
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to import diesel records:', err);
      setError('Error importing records. Please check the file format and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `data:text/csv;charset=utf-8,fleetNumber,date,kmReading,previousKmReading,litresFilled,costPerLitre,totalCost,fuelStation,driverName,notes,currency,probeReading,isReeferUnit
6H,2025-01-15,125000,123560,450,18.50,8325,RAM Petroleum Harare,Enock Mukonyerwa,Full tank before long trip,ZAR,,false
26H,2025-01-16,89000,87670,380,19.20,7296,Engen Beitbridge,Jonathan Bepete,Border crossing fill-up,ZAR,,false
22H,2025-01-17,156000,154824,420,18.75,7875,Shell Mutare,Lovemore Qochiwe,Regular refuel,ZAR,415,false
4F,2025-01-18,0,,250,19.50,4875,Engen Beitbridge,Peter Farai,Reefer unit refill,ZAR,,true`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "diesel-import-template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Diesel Records"
      maxWidth="md"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start space-x-3">
            <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">CSV Import Instructions</h4>
              <p className="text-sm text-blue-700 mt-1">
                Import your diesel records using a CSV file with the following columns:
              </p>
              <ul className="text-sm text-blue-700 mt-2 list-disc list-inside">
                <li>fleetNumber - Vehicle fleet number (e.g., "6H", "26H", "4F" for reefer)</li>
                <li>date - Date of refueling (YYYY-MM-DD)</li>
                <li>kmReading - Current odometer reading (not needed for reefer units)</li>
                <li>previousKmReading - Previous odometer reading (optional)</li>
                <li>litresFilled - Amount of diesel in litres</li>
                <li>costPerLitre - Cost per litre (optional if totalCost provided)</li>
                <li>totalCost - Total cost of the diesel purchase</li>
                <li>fuelStation - Name of the fuel station</li>
                <li>driverName - Name of the driver</li>
                <li>notes - Additional notes (optional)</li>
                <li>currency - ZAR or USD (optional, defaults to ZAR)</li>
                <li>probeReading - Probe reading in litres (optional)</li>
                <li>isReeferUnit - true/false (optional, defaults to false)</li>
              </ul>
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadTemplate}
                  icon={<Download className="w-4 h-4" />}
                >
                  Download Template
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          <div className="flex items-center p-4 bg-gray-50 border border-gray-200 rounded-md">
            <Upload className="w-6 h-6 text-gray-500 mr-3" />
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                Select a CSV file containing your diesel records. The first row should contain column headers.
              </p>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="p-2 border border-gray-300 rounded-md"
            />
            {error && (
              <p className="text-sm text-red-600">
                <AlertTriangle className="w-4 h-4 inline-block mr-1" />
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-600">
                <CheckCircle className="w-4 h-4 inline-block mr-1" />
                {success}
              </p>
            )}
          </div>

          {/* Data Preview */}
          {previewData.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Data Preview (First 3 rows):</h4>
              <div className="bg-gray-50 p-3 rounded border overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      {Object.keys(previewData[0]).slice(0, 6).map((header) => (
                        <th key={header} className="px-2 py-1 text-left font-medium text-gray-700">
                          {header}
                        </th>
                      ))}
                      {Object.keys(previewData[0]).length > 6 && (
                        <th className="px-2 py-1 text-left font-medium text-gray-700">...</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b">
                        {Object.entries(row).slice(0, 6).map(([key, value], colIndex) => (
                          <td key={`${rowIndex}-${colIndex}`} className="px-2 py-1 text-gray-600">
                            {String(value)}
                          </td>
                        ))}
                        {Object.keys(row).length > 6 && (
                          <td className="px-2 py-1 text-gray-600">...</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              icon={<X className="w-4 h-4" />}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || isProcessing}
              isLoading={isProcessing}
              icon={<Upload className="w-4 h-4" />}
            >
              {isProcessing ? 'Importing...' : 'Upload and Import'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DieselImportModal;