import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useAppContext } from '../../context/AppContext';
import { Input } from '../ui/FormElements';
import { Upload, X, AlertTriangle, Wifi, WifiOff } from 'lucide-react';

interface LoadImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoadImportModal: React.FC<LoadImportModalProps> = ({ isOpen, onClose }) => {
  const { importTripsFromCSV, connectionStatus } = useAppContext();
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
      
      const trips = data.map((row: any) => ({
        fleetNumber: row.fleetNumber || row.fleet || '',
        route: row.route || '',
        clientName: row.clientName || row.client || '',
        baseRevenue: parseFloat(row.baseRevenue || row.revenue || '0'),
        revenueCurrency: row.revenueCurrency || row.currency || 'ZAR',
        startDate: row.startDate || '',
        endDate: row.endDate || '',
        driverName: row.driverName || row.driver || '',
        distanceKm: parseFloat(row.distanceKm || row.distance || '0'),
        clientType: row.clientType || 'external',
        description: row.description || ''
      }));

      importTripsFromCSV(trips);
      alert(`Successfully imported ${trips.length} trips from CSV file.${connectionStatus !== 'connected' ? '\n\nData will be synced when your connection is restored.' : ''}`);
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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Trips from CSV" maxWidth="md">
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
                  You can still import trips while offline. Your data will be stored locally and synced with the server when your connection is restored.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">CSV Format Requirements</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>Your CSV file should include the following columns:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>fleetNumber</strong> - Fleet identifier (e.g., "6H", "26H")</li>
              <li><strong>driverName</strong> - Driver name</li>
              <li><strong>clientName</strong> - Client/customer name</li>
              <li><strong>route</strong> - Trip route description</li>
              <li><strong>baseRevenue</strong> - Revenue amount (numeric)</li>
              <li><strong>revenueCurrency</strong> - Currency (USD or ZAR)</li>
              <li><strong>startDate</strong> - Start date (YYYY-MM-DD)</li>
              <li><strong>endDate</strong> - End date (YYYY-MM-DD)</li>
              <li><strong>distanceKm</strong> - Distance in kilometers (optional)</li>
              <li><strong>clientType</strong> - "internal" or "external" (optional)</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                file:rounded-md file:border-0 file:text-sm file:font-medium 
                file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100
                file:cursor-pointer cursor-pointer"
            />
          </div>

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
            {isProcessing ? 'Importing...' : 'Import Trips'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default LoadImportModal;