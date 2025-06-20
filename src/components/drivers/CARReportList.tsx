// ─── React ───────────────────────────────────────────────────────
import React, { useState } from 'react';

// ─── Context ─────────────────────────────────────────────────────
import { useAppContext } from '../../context/AppContext';

// ─── Types ───────────────────────────────────────────────────────
import { CARReport } from '../../types';

// ─── UI Components ───────────────────────────────────────────────
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { Input, Select } from '../ui/FormElements';

// ─── Custom Components ───────────────────────────────────────────
import CARReportForm from './CARReportForm';
import CARReportDetails from './CARReportDetails';

// ─── Icons ───────────────────────────────────────────────────────
import {
  FileText,
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  User,
  FileUp
} from 'lucide-react';

// ─── Utilities ───────────────────────────────────────────────────
import { formatDate } from '../../utils/helpers';


const CARReportList: React.FC = () => {
  const { carReports = [], deleteCARReport } = useAppContext();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CARReport | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    responsiblePerson: '',
    dateRange: { start: '', end: '' }
  });
  
  // Apply filters
  const filteredReports = carReports.filter(report => {
    if (filters.status && report.status !== filters.status) return false;
    if (filters.severity && report.severity !== filters.severity) return false;
    if (filters.responsiblePerson && report.responsiblePerson !== filters.responsiblePerson) return false;
    if (filters.dateRange.start && report.incidentDate < filters.dateRange.start) return false;
    if (filters.dateRange.end && report.incidentDate > filters.dateRange.end) return false;
    return true;
  });
  
  // Sort reports: newest first
  const sortedReports = [...filteredReports].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Handle filter changes
  const handleFilterChange = (field: string, value: string) => {
    if (field.includes('dateRange')) {
      const [, dateField] = field.split('.');
      setFilters(prev => ({
        ...prev,
        dateRange: {
          ...prev.dateRange,
          [dateField]: value
        }
      }));
    } else {
      setFilters(prev => ({ ...prev, [field]: value }));
    }
  };
  
  // Clear filters
  const clearFilters = () => {
    setFilters({
      status: '',
      severity: '',
      responsiblePerson: '',
      dateRange: { start: '', end: '' }
    });
  };
  
  // Handle view report details
  const handleViewDetails = (report: CARReport) => {
    setSelectedReport(report);
    setShowDetailsModal(true);
  };
  
  // Handle edit report
  const handleEditReport = (report: CARReport) => {
    setSelectedReport(report);
    setShowAddModal(true);
  };
  
  // Handle delete report
  const handleDeleteReport = (id: string) => {
    if (confirm('Are you sure you want to delete this CAR report? This action cannot be undone.')) {
      deleteCARReport(id);
      alert('CAR report deleted successfully');
    }
  };
  
  // Download report as PDF
  const handleDownloadPDF = (report: CARReport) => {
    alert(`Generating PDF for CAR report ${report.reportNumber}. This would download a PDF in a production environment.`);
  };
  
  // Get status badge class
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get severity badge class
  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Calculate summary statistics
  const summary = {
    total: carReports.length,
    draft: carReports.filter(r => r.status === 'draft').length,
    inProgress: carReports.filter(r => r.status === 'in_progress').length,
    completed: carReports.filter(r => r.status === 'completed').length,
    highSeverity: carReports.filter(r => r.severity === 'high').length,
    mediumSeverity: carReports.filter(r => r.severity === 'medium').length,
    lowSeverity: carReports.filter(r => r.severity === 'low').length,
    overdue: carReports.filter(r => {
      const dueDate = new Date(r.dateDue);
      return r.status !== 'completed' && dueDate < new Date();
    }).length
  };
  
  // Get unique responsible persons for filter
  const uniqueResponsiblePersons = [...new Set(carReports.map(r => r.responsiblePerson))];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Corrective Action Reports (CAR)</h2>
          <p className="text-gray-600">Track and manage non-conformances and corrective actions</p>
        </div>
        <Button
          onClick={() => {
            setSelectedReport(null);
            setShowAddModal(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          Create CAR Report
        </Button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                <p className="text-xs text-gray-400">
                  {summary.completed} completed
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{summary.inProgress}</p>
                <p className="text-xs text-gray-400">
                  {summary.draft} drafts
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">High Severity</p>
                <p className="text-2xl font-bold text-red-600">{summary.highSeverity}</p>
                <p className="text-xs text-gray-400">
                  critical issues
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-amber-600">{summary.overdue}</p>
                <p className="text-xs text-gray-400">
                  past due date
                </p>
              </div>
              <Calendar className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader 
          title="Filter Reports" 
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={clearFilters}
              icon={<Filter className="w-4 h-4" />}
            >
              Clear Filters
            </Button>
          }
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Status"
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Draft', value: 'draft' },
                { label: 'Submitted', value: 'submitted' },
                { label: 'In Progress', value: 'in_progress' },
                { label: 'Completed', value: 'completed' }
              ]}
            />
            
            <Select
              label="Severity"
              value={filters.severity}
              onChange={(value) => handleFilterChange('severity', value)}
              options={[
                { label: 'All Severities', value: '' },
                { label: 'High', value: 'high' },
                { label: 'Medium', value: 'medium' },
                { label: 'Low', value: 'low' }
              ]}
            />
            
            <Select
              label="Responsible Person"
              value={filters.responsiblePerson}
              onChange={(value) => handleFilterChange('responsiblePerson', value)}
              options={[
                { label: 'All Persons', value: '' },
                ...uniqueResponsiblePersons.map(person => ({ label: person, value: person }))
              ]}
            />
            
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="From Date"
                type="date"
                value={filters.dateRange.start}
                onChange={(value) => handleFilterChange('dateRange.start', value)}
              />
              <Input
                label="To Date"
                type="date"
                value={filters.dateRange.end}
                onChange={(value) => handleFilterChange('dateRange.end', value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Reports List */}
      <Card>
        <CardHeader 
          title={`CAR Reports (${filteredReports.length})`}
          action={
            <Button
              size="sm"
              onClick={() => {
                setSelectedReport(null);
                setShowAddModal(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Create CAR Report
            </Button>
          }
        />
        <CardContent>
          {sortedReports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No CAR reports found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.status || filters.severity || filters.responsiblePerson || filters.dateRange.start || filters.dateRange.end
                  ? 'No reports match your current filter criteria.'
                  : 'Start by creating your first Corrective Action Report.'}
              </p>
              {!filters.status && !filters.severity && !filters.responsiblePerson && !filters.dateRange.start && !filters.dateRange.end && (
                <div className="mt-4">
                  <Button
                    onClick={() => {
                      setSelectedReport(null);
                      setShowAddModal(true);
                    }}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Create First CAR Report
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedReports.map((report) => {
                const isOverdue = new Date(report.dateDue) < new Date() && report.status !== 'completed';
                
                return (
                  <div 
                    key={report.id} 
                    className={`p-4 rounded-lg border ${
                      report.status === 'completed' ? 'bg-green-50 border-green-200' :
                      isOverdue ? 'bg-red-50 border-l-4 border-l-red-500' :
                      report.severity === 'high' ? 'bg-amber-50 border-l-4 border-l-amber-500' :
                      'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">CAR-{report.reportNumber}</h3>
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Responsible</p>
                              <p className="font-medium">{report.responsiblePerson}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Incident Date</p>
                              <p className="font-medium">{formatDate(report.incidentDate)}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Due Date</p>
                              <p className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                                {formatDate(report.dateDue)}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-sm text-gray-500">Problem</p>
                          <p className="text-sm line-clamp-2">{report.description || report.problemIdentification}</p>
                        </div>
                        
                        {report.completedAt && (
                          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <p className="text-sm text-green-700">
                                Completed on {formatDate(report.completedAt)} by {report.completedBy}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Attachments count */}
                        {report.attachments && report.attachments.length > 0 && (
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <FileUp className="w-4 h-4" />
                            <span>{report.attachments.length} attachment{report.attachments.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(report)}
                          icon={<Eye className="w-3 h-3" />}
                        >
                          View
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditReport(report)}
                          icon={<Edit className="w-3 h-3" />}
                        >
                          Edit
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPDF(report)}
                          icon={<Download className="w-3 h-3" />}
                        >
                          PDF
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteReport(report.id)}
                          icon={<Trash2 className="w-3 h-3" />}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* CAR Report Form Modal */}
      <CARReportForm
        isOpen={showAddModal}
        onClose={() => {
          setSelectedReport(null);
          setShowAddModal(false);
        }}
        existingReport={selectedReport}
      />
      
      {/* CAR Report Details Modal */}
      {selectedReport && (
        <CARReportDetails
          isOpen={showDetailsModal}
          onClose={() => {
            setSelectedReport(null);
            setShowDetailsModal(false);
          }}
          report={selectedReport}
          onEdit={() => {
            setShowDetailsModal(false);
            setShowAddModal(true);
          }}
        />
      )}
    </div>
  );
};

export default CARReportList;