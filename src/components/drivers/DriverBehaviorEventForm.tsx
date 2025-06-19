// ─── React ───────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';

// ─── Types ───────────────────────────────────────────────────────
import {
  DriverBehaviorEvent,
  DriverBehaviorEventType,
  DRIVER_BEHAVIOR_EVENT_TYPES,
  DRIVERS,
  FLEET_NUMBERS
} from '../../types';

// ─── Context ─────────────────────────────────────────────────────
import { useAppContext } from '../../context/AppContext';

// ─── UI Components ───────────────────────────────────────────────
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select, TextArea } from '../ui/FormElements';

// ─── Icons ───────────────────────────────────────────────────────
import {
  Save,
  X,
  AlertTriangle,
  Shield,
  Calendar,
  Clock,
  MapPin,
  FileUp
} from 'lucide-react';

// ─── Utilities ───────────────────────────────────────────────────
import { formatDate } from '../../utils/helpers';


interface DriverBehaviorEventFormProps {
  isOpen: boolean;
  onClose: () => void;
  event?: DriverBehaviorEvent;
  onInitiateCAR?: (event: DriverBehaviorEvent) => void;
}

const DriverBehaviorEventForm: React.FC<DriverBehaviorEventFormProps> = ({
  isOpen,
  onClose,
  event,
  onInitiateCAR
}) => {
  const { addDriverBehaviorEvent, updateDriverBehaviorEvent } = useAppContext();
  
  const [formData, setFormData] = useState({
    driverName: '',
    fleetNumber: '',
    eventDate: new Date().toISOString().split('T')[0],
    eventTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
    eventType: '' as DriverBehaviorEventType,
    description: '',
    location: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    status: 'pending' as 'pending' | 'acknowledged' | 'resolved' | 'disputed',
    actionTaken: '',
    points: 0
  });
  
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Initialize form with event data if editing
  useEffect(() => {
    if (event) {
      setFormData({
        driverName: event.driverName,
        fleetNumber: event.fleetNumber,
        eventDate: event.eventDate || event.date?.split('T')[0] || new Date().toISOString().split('T')[0],
        eventTime: event.eventTime || '00:00',
        eventType: event.eventType,
        description: event.description,
        location: event.location || '',
        severity: event.severity || 'medium',
        status: event.status || 'pending',
        actionTaken: event.actionTaken || '',
        points: event.points || 0
      });
    } else {
      // Reset form for new event
      setFormData({
        driverName: '',
        fleetNumber: '',
        eventDate: new Date().toISOString().split('T')[0],
        eventTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
        eventType: '' as DriverBehaviorEventType,
        description: '',
        location: '',
        severity: 'medium',
        status: 'pending',
        actionTaken: '',
        points: 0
      });
    }
    
    setSelectedFiles(null);
    setErrors({});
  }, [event, isOpen]);
  
  // Handle form changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate points based on event type
      if (field === 'eventType') {
        const eventType = DRIVER_BEHAVIOR_EVENT_TYPES.find(t => t.value === value);
        if (eventType) {
          updated.points = eventType.points;
          updated.severity = eventType.severity as any;
        }
      }
      
      return updated;
    });
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.driverName) newErrors.driverName = 'Driver name is required';
    if (!formData.fleetNumber) newErrors.fleetNumber = 'Fleet number is required';
    if (!formData.eventDate) newErrors.eventDate = 'Event date is required';
    if (!formData.eventTime) newErrors.eventTime = 'Event time is required';
    if (!formData.eventType) newErrors.eventType = 'Event type is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.severity) newErrors.severity = 'Severity is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const eventData: Omit<DriverBehaviorEvent, 'id'> = {
      driverName: formData.driverName,
      fleetNumber: formData.fleetNumber,
      eventDate: formData.eventDate,
      eventTime: formData.eventTime,
      eventType: formData.eventType,
      description: formData.description,
      location: formData.location,
      severity: formData.severity,
      reportedBy: 'Current User', // In a real app, use the logged-in user
      reportedAt: new Date().toISOString(),
      status: formData.status,
      actionTaken: formData.actionTaken,
      points: formData.points,
      date: new Date().toISOString() // For compatibility
    };
    
    if (event) {
      // Update existing event
      updateDriverBehaviorEvent({
        ...event,
        ...eventData
      });
      alert('Driver behavior event updated successfully');
    } else {
      // Add new event
      addDriverBehaviorEvent(eventData, selectedFiles || undefined);
      alert('Driver behavior event recorded successfully');
    }
    
    onClose();
  };
  
  // Handle initiating CAR
  const handleInitiateCAR = () => {
    if (!event) return;
    
    if (onInitiateCAR) {
      onInitiateCAR(event);
    }
    
    onClose();
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event ? "Edit Driver Behavior Event" : "Record Driver Behavior Event"}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Form Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Driver Behavior Reporting</h4>
              <p className="text-sm text-blue-700 mt-1">
                Record driver behavior events to track performance and identify training needs. 
                Each event type has associated demerit points that affect the driver's overall risk score.
              </p>
            </div>
          </div>
        </div>
        
        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Driver *"
            value={formData.driverName}
            onChange={(value) => handleChange('driverName', value)}
            options={[
              { label: 'Select driver...', value: '' },
              ...DRIVERS.map(driver => ({ label: driver, value: driver }))
            ]}
            error={errors.driverName}
          />
          
          <Select
            label="Fleet Number *"
            value={formData.fleetNumber}
            onChange={(value) => handleChange('fleetNumber', value)}
            options={[
              { label: 'Select fleet...', value: '' },
              ...FLEET_NUMBERS.map(fleet => ({ label: fleet, value: fleet }))
            ]}
            error={errors.fleetNumber}
          />
          
          <Input
            label="Event Date *"
            type="date"
            value={formData.eventDate}
            onChange={(value) => handleChange('eventDate', value)}
            error={errors.eventDate}
          />
          
          <Input
            label="Event Time *"
            type="time"
            value={formData.eventTime}
            onChange={(value) => handleChange('eventTime', value)}
            error={errors.eventTime}
          />
          
          <Select
            label="Event Type *"
            value={formData.eventType}
            onChange={(value) => handleChange('eventType', value)}
            options={[
              { label: 'Select event type...', value: '' },
              ...DRIVER_BEHAVIOR_EVENT_TYPES.map(type => ({ label: type.label, value: type.value }))
            ]}
            error={errors.eventType}
          />
          
          <Select
            label="Severity *"
            value={formData.severity}
            onChange={(value) => handleChange('severity', value)}
            options={[
              { label: 'Critical', value: 'critical' },
              { label: 'High', value: 'high' },
              { label: 'Medium', value: 'medium' },
              { label: 'Low', value: 'low' }
            ]}
            error={errors.severity}
          />
          
          <Input
            label="Location"
            value={formData.location}
            onChange={(value) => handleChange('location', value)}
            placeholder="e.g., Highway A1, Kilometer 45"
          />
          
          <Select
            label="Status"
            value={formData.status}
            onChange={(value) => handleChange('status', value)}
            options={[
              { label: 'Pending', value: 'pending' },
              { label: 'Acknowledged', value: 'acknowledged' },
              { label: 'Resolved', value: 'resolved' },
              { label: 'Disputed', value: 'disputed' }
            ]}
          />
        </div>
        
        <TextArea
          label="Description *"
          value={formData.description}
          onChange={(value) => handleChange('description', value)}
          placeholder="Describe the event..."
          rows={3}
          error={errors.description}
        />
        
        <TextArea
          label="Action Taken"
          value={formData.actionTaken}
          onChange={(value) => handleChange('actionTaken', value)}
          placeholder="Describe any actions taken to address this behavior..."
          rows={2}
        />
        
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Demerit Points</span>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              min="0"
              max="25"
              value={formData.points.toString()}
              onChange={(value) => handleChange('points', parseInt(value))}
              className="w-20"
            />
            <span className="text-sm text-gray-500">points</span>
          </div>
        </div>
        
        {/* Supporting Documents */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Supporting Documents (Optional)
          </label>
          <input
            type="file"
            multiple
            onChange={(e) => setSelectedFiles(e.target.files)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
              file:rounded-md file:border-0 file:text-sm file:font-medium 
              file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100
              file:cursor-pointer cursor-pointer"
          />
          {selectedFiles && selectedFiles.length > 0 && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
              <p className="font-medium text-blue-800">
                Selected {selectedFiles.length} file(s)
              </p>
            </div>
          )}
        </div>
        
        {/* Initiate CAR option for existing events */}
        {event && (event.severity === 'critical' || event.severity === 'high') && !event.carReportId && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">Corrective Action Required</h4>
                <p className="text-sm text-amber-700 mt-1">
                  This is a {event.severity} severity event that requires a Corrective Action Report (CAR).
                </p>
                <div className="mt-3">
                  <Button
                    onClick={handleInitiateCAR}
                    variant="primary"
                  >
                    Initiate CAR Report
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            icon={<X className="w-4 h-4" />}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            icon={<Save className="w-4 h-4" />}
          >
            {event ? 'Update Event' : 'Record Event'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DriverBehaviorEventForm;