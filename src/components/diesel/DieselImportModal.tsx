// ─── React ───────────────────────────────────────────────────────
import React, { useState } from 'react';

// ─── UI Components ───────────────────────────────────────────────
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useAppContext } from '../../context/AppContext';

// ─── Icons ───────────────────────────────────────────────────────
import {
  Upload,
  X,
  FileSpreadsheet,
  AlertTriangle
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

interface DieselImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DieselImportModal: React.FC<DieselImportModalProps> = ({
  isOpen,
  onClose
}) => {
  const { importDieselRecords } = useAppContext();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);

    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'csv') {
        setError('Only CSV files are allowed.');
        setFile(null);
      } else {
        setError('');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await importDieselRecords(formData);
      setSuccess('File uploaded and records imported successfully.');
      setFile(null);
    } catch (err) {
      setError('Error importing records. Please try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Diesel Records"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Import Diesel Records</h3>
          <Button
            variant="outline"
            onClick={onClose}
            icon={<X className="w-4 h-4" />}
          >
            Close
          </Button>
        </div>

        <div className="flex flex-col space-y-4">
          <div className="flex items-center p-4 bg-gray-50 border border-gray-200 rounded-md">
            <FileSpreadsheet className="w-6 h-6 text-gray-500 mr-3" />
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                Import your diesel records using a CSV file. Ensure the file is formatted correctly to avoid errors.
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

          <div className="flex justify-end space-x-3">
            <Button
              onClick={handleUpload}
              disabled={!file}
              icon={<Upload className="w-4 h-4" />}
            >
              Upload and Import
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DieselImportModal;
