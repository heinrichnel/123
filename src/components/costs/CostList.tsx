// ─── React ───────────────────────────────────────────────────────
import React from 'react';

// ─── Types ───────────────────────────────────────────────────────
import { CostEntry } from '../../types/index';

// ─── UI Components ───────────────────────────────────────────────
import Card, { CardContent } from '../ui/Card';
import Button from '../ui/Button';

// ─── Icons ───────────────────────────────────────────────────────
import {
  AlertTriangle,
  Calculator,
  Download,
  Edit,
  Eye,
  FileText,
  Flag,
  Image,
  Lock,
  Paperclip,
  Trash2
} from 'lucide-react';

// ─── Utilities ───────────────────────────────────────────────────
import { formatDate, formatCurrency } from '../../utils/helpers';


interface CostListProps {
  costs: CostEntry[];
  onEdit?: (cost: CostEntry) => void;
  onDelete?: (id: string) => void;
  onViewAttachment?: (url: string, filename: string) => void;
}

const CostList: React.FC<CostListProps> = ({ costs, onEdit, onDelete, onViewAttachment }) => {
  if (costs.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-10 w-10 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No cost entries</h3>
        <p className="mt-1 text-sm text-gray-500">
          Add cost entries to track expenses for this trip.
        </p>
      </div>
    );
  }

  const getIconByFileType = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (fileType.includes('image')) return <Image className="w-4 h-4" />;
    return <Paperclip className="w-4 h-4" />;
  };

  const getInvestigationStatusColor = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'in-progress':
        return 'text-blue-600 bg-blue-50';
      case 'resolved':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-red-600 bg-red-50';
    }
  };

  const handleViewAttachment = (attachment: any) => {
    if (onViewAttachment) {
      onViewAttachment(attachment.fileUrl, attachment.filename);
    } else if (attachment.fileUrl) {
      window.open(attachment.fileUrl, '_blank');
    } else {
      alert(`Viewing ${attachment.filename}\n\nIn a production system, this would open or download the file.`);
    }
  };

  const handleDownloadAttachment = (attachment: any) => {
    if (attachment.fileUrl) {
      const link = document.createElement('a');
      link.href = attachment.fileUrl;
      link.download = attachment.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`Downloading ${attachment.filename}\n\nIn a production system, this would download the file.`);
    }
  };

  const systemCosts = costs.filter(cost => cost.isSystemGenerated);
  const manualCosts = costs.filter(cost => !cost.isSystemGenerated);

  return (
    <div className="space-y-6">
      {/* Manual Costs */}
      {manualCosts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Manual Cost Entries ({manualCosts.length})</h3>
          {manualCosts.map((cost) => (
            <Card key={cost.id} className={`hover:shadow-md transition-shadow ${cost.isFlagged ? 'border-l-4 border-l-amber-400' : ''}`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{cost.category}</h4>
                          <p className="text-sm text-gray-600">{cost.subCategory}</p>
                        </div>
                        {cost.isFlagged && (
                          <div className="flex items-center space-x-1">
                            <Flag className="w-4 h-4 text-amber-500" />
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getInvestigationStatusColor(cost.investigationStatus)}`}>
                              {cost.investigationStatus || 'flagged'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg text-gray-900">
                          {formatCurrency(cost.amount, cost.currency)}
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(cost.date)}</p>
                        <p className="text-xs text-gray-400 font-medium">
                          {cost.currency}
                        </p>
                      </div>
                    </div>

                    <div className="mb-2">
                      <p className="text-sm text-gray-500">Ref: {cost.referenceNumber}</p>
                    </div>

                    {cost.notes && (
                      <p className="text-sm text-gray-600 mb-3">{cost.notes}</p>
                    )}

                    {cost.isFlagged && cost.flagReason && (
                      <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-800">Flag Reason:</p>
                            <p className="text-sm text-amber-700">{cost.flagReason}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {cost.investigationNotes && (
                      <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm font-medium text-blue-800">Investigation Notes:</p>
                        <p className="text-sm text-blue-700">{cost.investigationNotes}</p>
                      </div>
                    )}

                    {cost.noDocumentReason && (
                      <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm font-medium text-red-800">Missing Document Reason:</p>
                        <p className="text-sm text-red-700">{cost.noDocumentReason}</p>
                      </div>
                    )}

                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        Documentation ({cost.attachments.length} files)
                      </p>
                      {cost.attachments.length > 0 ? (
                        <div className="space-y-2">
                          {cost.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                            >
                              <div className="flex items-center space-x-2">
                                {getIconByFileType(attachment.fileType)}
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
                                  <p className="text-xs text-gray-500">
                                    {attachment.fileSize ? `${(attachment.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'} • 
                                    Uploaded {formatDate(attachment.uploadedAt)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewAttachment(attachment)}
                                  icon={<Eye className="w-3 h-3" />}
                                  className="px-2 py-1"
                                >
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadAttachment(attachment)}
                                  icon={<Download className="w-3 h-3" />}
                                  className="px-2 py-1"
                                >
                                  Download
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-2 bg-red-50 border border-red-200 rounded">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-700 font-medium">No documents attached</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {(onEdit || onDelete) && (
                      <div className="flex justify-end space-x-2">
                        {onEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(cost)}
                            icon={<Edit className="w-3 h-3" />}
                          >
                            Edit
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => onDelete(cost.id)}
                            icon={<Trash2 className="w-3 h-3" />}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* System Costs */}
      {systemCosts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">System-Generated Operational Overhead ({systemCosts.length})</h3>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-700">
              These costs are automatically calculated based on predefined per-kilometer and per-day rates to ensure accurate profitability assessment.
            </p>
          </div>

          {systemCosts.map((cost) => (
            <Card key={cost.id} className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <Calculator className="w-4 h-4 text-blue-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">{cost.category}</h4>
                          <p className="text-sm text-blue-700">{cost.subCategory}</p>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          System Generated
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg text-gray-900">
                          {formatCurrency(cost.amount, cost.currency)}
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(cost.date)}</p>
                        <p className="text-xs text-blue-600 font-medium">
                          {cost.systemCostType === 'per-km' ? 'Per-KM' : 'Per-Day'}
                        </p>
                      </div>
                    </div>

                    <div className="mb-2">
                      <p className="text-sm text-gray-500">Ref: {cost.referenceNumber}</p>
                    </div>

                    {cost.calculationDetails && (
                      <div className="mb-3 p-2 bg-blue-100 border border-blue-300 rounded">
                        <p className="text-sm font-medium text-blue-800">Calculation:</p>
                        <p className="text-sm text-blue-700">{cost.calculationDetails}</p>
                      </div>
                    )}

                    {cost.notes && (
                      <p className="text-sm text-gray-600 mb-3">{cost.notes}</p>
                    )}

                    <div className="flex justify-end space-x-2">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Lock className="w-3 h-3" />
                        <span>System-generated (locked)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* System Costs Summary */}
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-green-800">Total System Costs</h4>
                <p className="text-sm text-green-700">
                  Operational overhead automatically applied
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-green-800">
                  {formatCurrency(systemCosts.reduce((sum, cost) => sum + cost.amount, 0), systemCosts[0]?.currency || 'ZAR')}
                </p>
                <p className="text-sm text-green-600">{systemCosts.length} entries</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostList;