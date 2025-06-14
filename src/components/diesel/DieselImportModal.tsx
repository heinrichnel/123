import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useAppContext } from '../../context/AppContext';
import { Upload, X, FileSpreadsheet, AlertTriangle, WifiOff, Wifi } from 'lucide-react';
import { TRUCKS_WITH_PROBES } from '../../types';

interface DieselImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DieselImportModal: React.FC<DieselImportModalProps> = ({ isOpen, onClose }) => {
  const { importDieselFromCSV, connectionStatus } = useAppContext();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const file = e.target.files[0];
      setCsvFile(file);
      
      // Generate preview
      try {
        const text = await file.text();
        const data = parseCSV(text);
        setPreviewData(data.slice(0, 3)); // Show first 3 rows
      } catch (error) {
        console.error('Failed to parse CSV for preview:', error);
      }
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

  const handleImport = async () => {
    if (!csvFile) return;

    setIsProcessing(true);
    
    try {
      const text = await csvFile.text();
      const data = parseCSV(text);
      
      const records = data.map((row: any) => {
        const kmReading = parseFloat(row.kmReading || row.km || '0');
        const previousKmReading = parseFloat(row.previousKmReading || row.previousKm || '0');
        const litresFilled = parseFloat(row.litresFilled || row.litres || '0');
        const costPerLitre = parseFloat(row.costPerLitre || row.pricePerLitre || '0');
        const totalCost = parseFloat(row.totalCost || row.cost || '0');
        const currency = row.currency || 'ZAR';
        
        // Calculate derived values
        const distanceTravelled = previousKmReading > 0 ? kmReading - previousKmReading : 0;
        const kmPerLitre = distanceTravelled > 0 && litresFilled > 0 ? distanceTravelled / litresFilled : 0;
        const calculatedCostPerLitre = litresFilled > 0 ? totalCost / litresFilled : costPerLitre;
        
        // Check if truck has probe
        const fleetNumber = row.fleetNumber || row.fleet || '';
        const hasProbe = TRUCKS_WITH_PROBES.includes(fleetNumber);
        
        // Add probe data if available
        const probeReading = parseFloat(row.probeReading || '0');
        const probeDiscrepancy = probeReading > 0 ? litresFilled - probeReading : undefined;
        const probeVerified = probeReading > 0;

        return {
          fleetNumber,
          date: row.date || '',
          kmReading,
          litresFilled,
          costPerLitre: calculatedCostPerLitre,
          totalCost,
          fuelStation: row.fuelStation || row.station || '',
          driverName: row.driverName || row.driver || '',
          notes: row.notes || '',
          previousKmReading: previousKmReading > 0 ? previousKmReading : undefined,
          distanceTravelled: distanceTravelled > 0 ? distanceTravelled : undefined,
          kmPerLitre: kmPerLitre > 0 ? kmPerLitre : undefined,
          currency,
          hasProbe,
          probeReading: probeReading > 0 ? probeReading : undefined,
          probeDiscrepancy,
          probeVerified
        };
      });

      importDieselFromCSV(records);
      alert(`Successfully imported ${records.length} diesel records from CSV file.\n\nAll KM/L calculations and efficiency metrics have been automatically computed.${connectionStatus !== 'connected' ? '\n\nData will be synced when your connection is restored.' : ''}`);
      onClose();
    } catch (error) {
      console.error('Failed to import CSV:', error);
      alert('Failed to import CSV file. Please check the file format and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCsvFile(null);
    setIsProcessing(false);
    setPreviewData([]);
    onClose();
  };

  const exportCSVTemplate = () => {
    const csvContent = `data:text/csv;charset=utf-8,fleetNumber,date,kmReading,previousKmReading,litresFilled,totalCost,fuelStation,driverName,notes,currency,probeReading
6H,2025-01-15,125000,123560,450,8325,RAM Petroleum Harare,Enock Mukonyerwa,Full tank before long trip,ZAR,
26H,2025-01-16,89000,87670,380,7296,Engen Beitbridge,Jonathan Bepete,Border crossing fill-up,ZAR,
22H,2025-01-17,156000,154824,420,7875,Shell Mutare,Lovemore Qochiwe,Regular refuel,ZAR,415`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "diesel-import-template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Diesel Records from CSV" maxWidth="lg">
      <div className="space-y-6">
        {/* Connection Status Warning */}
        {connectionStatus !== 'connected' && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex items-start space-x-3">
              {connectionStatus === 'disconnected' ? (
                <WifiOff className="w-5 h-5 text-amber-600 mt-0.5" />
              ) : (
                <Wifi className="w-5 h-5 text-amber-600 mt-0.5" />
              )}
              <div>
                <h4 className="text-sm font-medium text-amber-800">
                  {connectionStatus === 'disconnected' ? 'Working Offline' : 'Reconnecting...'}
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  You can still import diesel records while offline. Your data will be stored locally and synced with the server when your connection is restored.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced CSV Format Requirements */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">CSV Format Requirements</h4>
          <div className="text-sm text-blue-700 space-y-2">
            <p>Your CSV file should include the following columns (all calculations will be done automatically):</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <p className="font-medium text-blue-800 mb-1">Required Fields:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>fleetNumber</strong> - Fleet identifier (e.g., "6H", "26H")</li>
                  <li><strong>date</strong> - Date of fuel purchase (YYYY-MM-DD)</li>
                  <li><strong>kmReading</strong> - Current kilometer reading</li>
                  <li><strong>litresFilled</strong> - Liters of fuel purchased</li>
                  <li><strong>totalCost</strong> - Total cost of fuel</li>
                  <li><strong>fuelStation</strong> - Name of fuel station</li>
                  <li><strong>driverName</strong> - Driver name</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-blue-800 mb-1">Optional Fields:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>previousKmReading</strong> - Previous km reading</li>
                  <li><strong>costPerLitre</strong> - Price per liter</li>
                  <li><strong>notes</strong> - Additional notes</li>
                  <li><strong>currency</strong> - ZAR or USD (defaults to ZAR)</li>
                  <li><strong>probeReading</strong> - Probe reading (for trucks with probes)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Automatic Calculations Info */}
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-green-800 mb-2">Automatic Calculations</h4>
          <div className="text-sm text-green-700 space-y-1">
            <p>The system will automatically calculate:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Distance Travelled:</strong> Current KM - Previous KM</li>
              <li><strong>KM per Litre:</strong> Distance ÷ Litres Filled</li>
              <li><strong>Cost per Litre:</strong> Total Cost ÷ Litres (if not provided)</li>
              <li><strong>Cost per KM:</strong> Total Cost ÷ Distance</li>
              <li><strong>Efficiency Variance:</strong> Compared to fleet norms</li>
              <li><strong>Performance Status:</strong> Excellent/Normal/Poor classification</li>
              <li><strong>Probe Discrepancy:</strong> Difference between filled litres and probe reading</li>
            </ul>
          </div>
        </div>

        {/* Probe Verification Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">Probe Verification System</h4>
              <p className="text-sm text-amber-700 mt-1">
                For trucks with fuel probes (22H, 23H, 24H, 26H, 28H, 30H, 31H), the system will automatically compare the filled litres with probe readings.
                Discrepancies greater than 50L will be flagged for investigation.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">
              Select CSV File
            </label>
            <Button
              size="sm"
              variant="outline"
              onClick={exportCSVTemplate}
              icon={<FileSpreadsheet className="w-4 h-4" />}
            >
              Download Template
            </Button>
          </div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
              file:rounded-md file:border-0 file:text-sm file:font-medium 
              file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100
              file:cursor-pointer cursor-pointer"
          />

          {csvFile && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Selected: {csvFile.name}
                </span>
                <span className="text-sm text-green-600">
                  ({(csvFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            </div>
          )}

          {/* Data Preview */}
          {previewData.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Data Preview (First 3 rows):</h4>
              <div className="bg-gray-50 p-3 rounded border overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      {Object.keys(previewData[0]).slice(0, 5).map((header) => (
                        <th key={header} className="px-2 py-1 text-left font-medium text-gray-700">
                          {header}
                        </th>
                      ))}
                      {Object.keys(previewData[0]).length > 5 && (
                        <th className="px-2 py-1 text-left font-medium text-gray-700">...</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b">
                        {Object.entries(row).slice(0, 5).map(([key, value], colIndex) => (
                          <td key={`${rowIndex}-${colIndex}`} className="px-2 py-1 text-gray-600">
                            {String(value)}
                          </td>
                        ))}
                        {Object.keys(row).length > 5 && (
                          <td className="px-2 py-1 text-gray-600">...</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
            icon={<X className="w-4 h-4" />}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!csvFile || isProcessing}
            isLoading={isProcessing}
            icon={<Upload className="w-4 h-4" />}
          >
            {isProcessing ? 'Importing & Calculating...' : 'Import & Calculate'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DieselImportModal;