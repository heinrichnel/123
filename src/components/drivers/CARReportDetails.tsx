// ─── React ───────────────────────────────────────────────────────
import React from 'react';

// ─── Types ───────────────────────────────────────────────────────
import { CARReport } from '../../types';

// ─── UI Components ───────────────────────────────────────────────
import Modal from '../ui/Modal';
import Button from '../ui/Button';

// ─── Icons ───────────────────────────────────────────────────────
import {
  FileText,
  Edit,
  Download,
  X,
  Calendar,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileUp
} from 'lucide-react';

// ─── Utilities ───────────────────────────────────────────────────
import { formatDate, formatDateTime } from '../../utils/helpers';


interface CARReportDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  report: CARReport;
  onEdit: () => void;
}

const CARReportDetails: React.FC<CARReportDetailsProps> = ({
  isOpen,
  onClose,
  report,
  onEdit
}) => {
  // Check if report is overdue
  const isOverdue = new Date(report.dateDue) < new Date() && report.status !== 'completed';
  
  // Get severity class
  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get status class
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Handle download PDF
  const handleDownloadPDF = () => {
    alert(`Generating PDF for CAR report ${report.reportNumber}. This would download a PDF in a production environment.`);
  };
  
  // Handle download Excel
  const handleDownloadExcel = () => {
    alert(`Generating Excel for CAR report ${report.reportNumber}. This would download an Excel file in a production environment.`);
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`CAR Report: ${report.reportNumber}`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Report Header */}
        <div className={`p-4 rounded-lg ${
          report.status === 'completed' ? 'bg-green-50 border border-green-200' :
          isOverdue ? 'bg-red-50 border border-red-200' :
          report.severity === 'high' ? 'bg-amber-50 border border-amber-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Corrective Action Report</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(report.status)}`}>
                  {report.status === 'in_progress' ? 'In Progress' : 
                   report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityClass(report.severity)}`}>
                  {report.severity.toUpperCase()} Severity
                </span>
                {isOverdue && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    OVERDUE
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">Report Number:</p>
              <p className="text-lg font-bold text-blue-600">{report.reportNumber}</p>
            </div>
          </div>
        </div>
        
        {/* Key Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Responsible Reporter</p>
            <p className="font-medium">{report.responsibleReporter}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Responsible Person</p>
            <p className="font-medium">{report.responsiblePerson}</p>
          </div>
          
          {report.referenceEventId && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Reference</p>
              <p className="font-medium">Driver Event #{report.referenceEventId.substring(0, 8)}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Date of Incident</p>
            <p className="font-medium">{formatDate(report.dateOfIncident)}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Date Due</p>
            <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>{formatDate(report.dateDue)}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Created</p>
            <p className="font-medium">{formatDateTime(report.createdAt)}</p>
          </div>
        </div>
        
        {/* Client Report */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">CLIENT'S REPORT OF NON-CONFORMANCE</h3>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="whitespace-pre-line">{report.clientReport}</p>
          </div>
        </div>
        
        {/* Problem Identification */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">PROBLEM IDENTIFICATION</h3>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="whitespace-pre-line">{report.problemIdentification}</p>
          </div>
        </div>
        
        {/* Primary Cause Analysis */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">PRIMARY CAUSE ANALYSIS (FISHBONE FRAMEWORK)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">1. People (Manpower)</h4>
              <p className="whitespace-pre-line">{report.causeAnalysisPeople || 'Not provided'}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">2. Materials</h4>
              <p className="whitespace-pre-line">{report.causeAnalysisMaterials || 'Not provided'}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">3. Equipment</h4>
              <p className="whitespace-pre-line">{report.causeAnalysisEquipment || 'Not provided'}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">4. Methods/Systems/Processes</h4>
              <p className="whitespace-pre-line">{report.causeAnalysisMethods || 'Not provided'}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">5. Metrics/Measurement</h4>
              <p className="whitespace-pre-line">{report.causeAnalysisMetrics || 'Not provided'}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">6. Operating Environment</h4>
              <p className="whitespace-pre-line">{report.causeAnalysisEnvironment || 'Not provided'}</p>
            </div>
          </div>
        </div>
        
        {/* Root Cause Analysis */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">ROOT CAUSE ANALYSIS (5 WHY'S)</h3>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="whitespace-pre-line">{report.rootCauseAnalysis || 'Not provided'}</p>
          </div>
        </div>
        
        {/* Actions */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">ACTIONS</h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Corrective Actions</h4>
              <p className="whitespace-pre-line">{report.correctiveActions || 'Not provided'}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preventative Actions (Immediate)</h4>
              <p className="whitespace-pre-line">{report.preventativeActionsImmediate || 'Not provided'}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preventative Actions (Medium/Long Term)</h4>
              <p className="whitespace-pre-line">{report.preventativeActionsLongTerm || 'Not provided'}</p>
            </div>
          </div>
        </div>
        
        {/* Financial Impact and Comments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Financial Impact</h4>
            <p className="whitespace-pre-line">{report.financialImpact || 'Not provided'}</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">General Comments</h4>
            <p className="whitespace-pre-line">{report.generalComments || 'Not provided'}</p>
          </div>
        </div>
        
        {/* Attachments */}
        {report.attachments && report.attachments.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Attachments</h3>
            <div className="space-y-2">
              {report.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <FileUp className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">{attachment.filename}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(attachment.fileUrl, '_blank')}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Completion Information */}
        {report.status === 'completed' && report.completedAt && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-green-800">Report Completed</h4>
                <p className="text-sm text-green-700 mt-1">
                  This CAR report was completed on {formatDateTime(report.completedAt)} by {report.completedBy}.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Overdue Warning */}
        {isOverdue && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Report Overdue</h4>
                <p className="text-sm text-red-700 mt-1">
                  This CAR report is past its due date of {formatDate(report.dateDue)}. Immediate attention is required.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            icon={<X className="w-4 h-4" />}
          >
            Close
          </Button>
          
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            icon={<Download className="w-4 h-4" />}
          >
            Download PDF
          </Button>
          
          <Button
            variant="outline"
            onClick={handleDownloadExcel}
            icon={<FileText className="w-4 h-4" />}
          >
            Download Excel
          </Button>
          
          <Button
            onClick={onEdit}
            icon={<Edit className="w-4 h-4" />}
          >
            Edit Report
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CARReportDetails;