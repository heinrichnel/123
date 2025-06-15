// ─── React ───────────────────────────────────────────────────────
import React from 'react';

// ─── Types ───────────────────────────────────────────────────────
import { DriverBehaviorEvent, DRIVER_BEHAVIOR_EVENT_TYPES } from '../../types';

// ─── UI Components ───────────────────────────────────────────────
import Modal from '../ui/Modal';
import Button from '../ui/Button';

// ─── Icons ───────────────────────────────────────────────────────
import {
  Edit,
  X,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  FileUp,
  Shield,
  FileText
} from 'lucide-react';

// ─── Utilities ───────────────────────────────────────────────────
import { formatDate, formatDateTime } from '../../utils/helpers';


interface DriverBehaviorEventDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  event: DriverBehaviorEvent;
  onEdit: () => void;
  onInitiateCAR: () => void;
}

const DriverBehaviorEventDetails: React.FC<DriverBehaviorEventDetailsProps> = ({
  isOpen,
  onClose,
  event,
  onEdit,
  onInitiateCAR
}) => {
  // Get severity class
  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get status class
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'acknowledged': return 'bg-blue-100 text-blue-800';
      case 'disputed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Driver Behavior Event Details"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Event Header */}
        <div className={`p-4 rounded-lg ${
          event.severity === 'critical' ? 'bg-red-50 border border-red-200' :
          event.severity === 'high' ? 'bg-orange-50 border border-orange-200' :
          event.severity === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
          'bg-green-50 border border-green-200'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{event.driverName}</h3>
              <p className="text-sm text-gray-600">Fleet {event.fleetNumber}</p>
            </div>
            <div className="flex space-x-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityClass(event.severity)}`}>
                {event.severity.toUpperCase()}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(event.status)}`}>
                {event.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        
        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Event Type</h4>
              <p className="font-medium text-gray-900">
                {DRIVER_BEHAVIOR_EVENT_TYPES.find(t => t.value === event.eventType)?.label || event.eventType}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Date & Time</h4>
              <p className="font-medium text-gray-900">
                {formatDate(event.eventDate)} at {event.eventTime}
              </p>
            </div>
            
            {event.location && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Location</h4>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <p className="font-medium text-gray-900">{event.location}</p>
                </div>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Demerit Points</h4>
              <p className="font-medium text-red-600">{event.points} points</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Reported By</h4>
              <p className="font-medium text-gray-900">{event.reportedBy}</p>
              <p className="text-xs text-gray-500">{formatDateTime(event.reportedAt)}</p>
            </div>
            
            {event.resolvedAt && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Resolved By</h4>
                <p className="font-medium text-gray-900">{event.resolvedBy}</p>
                <p className="text-xs text-gray-500">{formatDateTime(event.resolvedAt)}</p>
              </div>
            )}
            
            {event.status === 'resolved' && !event.resolvedAt && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-700">
                  This event is marked as resolved but missing resolution details.
                </p>
              </div>
            )}
            
            {/* CAR Report Link */}
            {event.carReportId ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">CAR Report Initiated</p>
                    <p className="text-sm text-blue-700">
                      Report ID: {event.carReportId}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              (event.severity === 'critical' || event.severity === 'high') && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">CAR Report Required</p>
                      <p className="text-sm text-amber-700">
                        This {event.severity} severity event requires a Corrective Action Report.
                      </p>
                      <div className="mt-2">
                        <Button
                          size="sm"
                          onClick={onInitiateCAR}
                        >
                          Initiate CAR Report
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
        
        {/* Description */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
          <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
            <p className="text-gray-900">{event.description}</p>
          </div>
        </div>
        
        {/* Action Taken */}
        {event.actionTaken && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Action Taken</h4>
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-blue-900">{event.actionTaken}</p>
            </div>
          </div>
        )}
        
        {/* Attachments */}
        {event.attachments && event.attachments.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Supporting Documents</h4>
            <div className="space-y-2">
              {event.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <FileUp className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">{attachment.filename}</span>
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
            onClick={onEdit}
            icon={<Edit className="w-4 h-4" />}
          >
            Edit Event
          </Button>
          {(event.severity === 'critical' || event.severity === 'high') && !event.carReportId && (
            <Button
              onClick={onInitiateCAR}
              icon={<FileText className="w-4 h-4" />}
            >
              Initiate CAR
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default DriverBehaviorEventDetails;