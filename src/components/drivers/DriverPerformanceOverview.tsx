import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { DriverBehaviorEvent, DRIVER_BEHAVIOR_EVENT_TYPES, DRIVERS, FLEET_NUMBERS } from '../../types';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { Input, Select, TextArea } from '../ui/FormElements';
import Modal from '../ui/Modal';
import { User as UserRound, AlertTriangle, CheckCircle, Filter, Plus, X, Save, Eye, Edit, Trash2, Shield, Clock, MapPin, FileUp } from 'lucide-react';
import { formatDate, formatDateTime } from '../../utils/helpers';

const DriverPerformanceOverview: React.FC = () => {
  const { driverBehaviorEvents, addDriverBehaviorEvent, updateDriverBehaviorEvent, deleteDriverBehaviorEvent, getAllDriversPerformance } = useAppContext();
  
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<DriverBehaviorEvent | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Form state for adding/editing events
  const [eventForm, setEventForm] = useState({
    driverName: '',
    fleetNumber: '',
    eventDate: new Date().toISOString().split('T')[0],
    eventTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
    eventType: '' as DriverBehaviorEvent['eventType'],
    description: '',
    location: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    status: 'pending' as 'pending' | 'acknowledged' | 'resolved' | 'disputed',
    actionTaken: '',
    points: 0
  });
  
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Get all driver performance data
  const driversPerformance = useMemo(() => {
    return getAllDriversPerformance();
  }, [driverBehaviorEvents, getAllDriversPerformance]);
  
  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    return driverBehaviorEvents.filter(event => {
      if (selectedDriver && event.driverName !== selectedDriver) return false;
      if (selectedEventType && event.eventType !== selectedEventType) return false;
      if (selectedSeverity && event.severity !== selectedSeverity) return false;
      if (selectedStatus && event.status !== selectedStatus) return false;
      if (dateRange.start && event.eventDate < dateRange.start) return false;
      if (dateRange.end && event.eventDate > dateRange.end) return false;
      return true;
    });
  }, [driverBehaviorEvents, selectedDriver, selectedEventType, selectedSeverity, selectedStatus, dateRange]);
  
  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalEvents = filteredEvents.length;
    const criticalEvents = filteredEvents.filter(e => e.severity === 'critical').length;
    const highSeverityEvents = filteredEvents.filter(e => e.severity === 'high').length;
    const unresolvedEvents = filteredEvents.filter(e => e.status !== 'resolved').length;
    
    // Count events by type
    const eventsByType = filteredEvents.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Get top 3 event types
    const topEventTypes = Object.entries(eventsByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => ({
        type,
        count,
        label: DRIVER_BEHAVIOR_EVENT_TYPES.find(t => t.value === type)?.label || type
      }));
    
    // Get high-risk drivers (more than 3 events or any critical events)
    const driverEventCounts = filteredEvents.reduce((acc, event) => {
      acc[event.driverName] = (acc[event.driverName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const driverCriticalEvents = filteredEvents.filter(e => e.severity === 'critical' || e.severity === 'high')
      .reduce((acc, event) => {
        acc[event.driverName] = (acc[event.driverName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    const highRiskDrivers = Object.entries(driverEventCounts)
      .filter(([driver, count]) => count > 3 || (driverCriticalEvents[driver] || 0) > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([driver, count]) => ({
        name: driver,
        eventCount: count,
        criticalCount: driverCriticalEvents[driver] || 0,
        score: driversPerformance.find(d => d.driverName === driver)?.behaviorScore || 0
      }));
    
    return {
      totalEvents,
      criticalEvents,
      highSeverityEvents,
      unresolvedEvents,
      topEventTypes,
      highRiskDrivers
    };
  }, [filteredEvents, driversPerformance]);
  
  // Handle form changes
  const handleFormChange = (field: string, value: any) => {
    setEventForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate points based on event type
      if (field === 'eventType') {
        const eventType = DRIVER_BEHAVIOR_EVENT_TYPES.find(t => t.value === value);
        if (eventType) {
          updated.points = eventType.points;
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
    
    if (!eventForm.driverName) newErrors.driverName = 'Driver name is required';
    if (!eventForm.fleetNumber) newErrors.fleetNumber = 'Fleet number is required';
    if (!eventForm.eventDate) newErrors.eventDate = 'Event date is required';
    if (!eventForm.eventTime) newErrors.eventTime = 'Event time is required';
    if (!eventForm.eventType) newErrors.eventType = 'Event type is required';
    if (!eventForm.description) newErrors.description = 'Description is required';
    if (!eventForm.severity) newErrors.severity = 'Severity is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const eventData: Omit<DriverBehaviorEvent, 'id'> = {
      driverName: eventForm.driverName,
      fleetNumber: eventForm.fleetNumber,
      eventDate: eventForm.eventDate,
      eventTime: eventForm.eventTime,
      eventType: eventForm.eventType,
      description: eventForm.description,
      location: eventForm.location,
      severity: eventForm.severity,
      reportedBy: 'Current User', // In a real app, use the logged-in user
      reportedAt: new Date().toISOString(),
      status: eventForm.status,
      actionTaken: eventForm.actionTaken,
      points: eventForm.points
    };
    
    if (selectedEvent) {
      // Update existing event
      updateDriverBehaviorEvent({
        ...selectedEvent,
        ...eventData
      });
      alert('Driver behavior event updated successfully');
    } else {
      // Add new event
      addDriverBehaviorEvent(eventData, selectedFiles || undefined);
      alert('Driver behavior event recorded successfully');
    }
    
    // Reset form and close modal
    resetForm();
    setShowAddEventModal(false);
  };
  
  // Reset form
  const resetForm = () => {
    setEventForm({
      driverName: '',
      fleetNumber: '',
      eventDate: new Date().toISOString().split('T')[0],
      eventTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
      eventType: '' as DriverBehaviorEvent['eventType'],
      description: '',
      location: '',
      severity: 'medium',
      status: 'pending',
      actionTaken: '',
      points: 0
    });
    setSelectedFiles(null);
    setErrors({});
    setSelectedEvent(null);
  };
  
  // Handle edit event
  const handleEditEvent = (event: DriverBehaviorEvent) => {
    setSelectedEvent(event);
    setEventForm({
      driverName: event.driverName,
      fleetNumber: event.fleetNumber,
      eventDate: event.eventDate,
      eventTime: event.eventTime,
      eventType: event.eventType,
      description: event.description,
      location: event.location || '',
      severity: event.severity,
      status: event.status,
      actionTaken: event.actionTaken || '',
      points: event.points
    });
    setShowAddEventModal(true);
  };
  
  // Handle view event details
  const handleViewEventDetails = (event: DriverBehaviorEvent) => {
    setSelectedEvent(event);
    setShowEventDetailsModal(true);
  };
  
  // Handle delete event
  const handleDeleteEvent = (id: string) => {
    if (confirm('Are you sure you want to delete this driver behavior event? This action cannot be undone.')) {
      deleteDriverBehaviorEvent(id);
      alert('Driver behavior event deleted successfully');
    }
  };
  
  // Clear filters
  const clearFilters = () => {
    setSelectedDriver('');
    setSelectedEventType('');
    setSelectedSeverity('');
    setSelectedStatus('');
    setDateRange({ start: '', end: '' });
  };
  
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Driver Performance Overview</h2>
          <p className="text-gray-600">Monitor driver behavior and identify high-risk drivers</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowAddEventModal(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          Record Behavior Event
        </Button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalEvents}</p>
                <p className="text-xs text-gray-400">Recorded incidents</p>
              </div>
              <UserRound className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Critical Events</p>
                <p className="text-2xl font-bold text-red-600">{summary.criticalEvents}</p>
                <p className="text-xs text-gray-400">Highest severity</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">High Severity</p>
                <p className="text-2xl font-bold text-orange-600">{summary.highSeverityEvents}</p>
                <p className="text-xs text-gray-400">Require attention</p>
              </div>
              <Shield className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Unresolved</p>
                <p className="text-2xl font-bold text-yellow-600">{summary.unresolvedEvents}</p>
                <p className="text-xs text-gray-400">Pending resolution</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader 
          title="Filter Events" 
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Select
              label="Driver"
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              options={[
                { label: 'All Drivers', value: '' },
                ...DRIVERS.map(driver => ({ label: driver, value: driver }))
              ]}
            />
            
            <Select
              label="Event Type"
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              options={[
                { label: 'All Event Types', value: '' },
                ...DRIVER_BEHAVIOR_EVENT_TYPES.map(type => ({ label: type.label, value: type.value }))
              ]}
            />
            
            <Select
              label="Severity"
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              options={[
                { label: 'All Severities', value: '' },
                { label: 'Critical', value: 'critical' },
                { label: 'High', value: 'high' },
                { label: 'Medium', value: 'medium' },
                { label: 'Low', value: 'low' }
              ]}
            />
            
            <Select
              label="Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Pending', value: 'pending' },
                { label: 'Acknowledged', value: 'acknowledged' },
                { label: 'Resolved', value: 'resolved' },
                { label: 'Disputed', value: 'disputed' }
              ]}
            />
            
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="From Date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
              <Input
                label="To Date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* High Risk Drivers */}
      <Card>
        <CardHeader 
          title="High Risk Drivers" 
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
        />
        <CardContent>
          {summary.highRiskDrivers.length > 0 ? (
            <div className="space-y-4">
              {summary.highRiskDrivers.map((driver) => (
                <div key={driver.name} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{driver.name}</h3>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-700">
                            {driver.eventCount} total events ({driver.criticalCount} critical/high)
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-orange-600" />
                          <span className="text-sm text-orange-700">
                            Behavior Score: {driver.score.toFixed(0)}/100
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        driver.score < 50 ? 'bg-red-100 text-red-800' :
                        driver.score < 70 ? 'bg-orange-100 text-orange-800' :
                        driver.score < 85 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {driver.score < 50 ? 'Critical Risk' :
                         driver.score < 70 ? 'High Risk' :
                         driver.score < 85 ? 'Medium Risk' :
                         'Low Risk'}
                      </span>
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedDriver(driver.name)}
                        >
                          View Events
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-10 w-10 text-green-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No high-risk drivers</h3>
              <p className="mt-1 text-sm text-gray-500">
                All drivers are currently within acceptable risk parameters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Top Event Types */}
      <Card>
        <CardHeader title="Most Common Behavior Events" />
        <CardContent>
          {summary.topEventTypes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {summary.topEventTypes.map((eventType) => (
                <div key={eventType.type} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900">{eventType.label}</h3>
                    <span className="text-lg font-bold text-blue-600">{eventType.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, (eventType.count / Math.max(1, summary.totalEvents)) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {((eventType.count / Math.max(1, summary.totalEvents)) * 100).toFixed(1)}% of all events
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No event data available</p>
          )}
        </CardContent>
      </Card>
      
      {/* Events List */}
      <Card>
        <CardHeader 
          title={`Driver Behavior Events (${filteredEvents.length})`}
          action={
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setShowAddEventModal(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Record Event
            </Button>
          }
        />
        <CardContent>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <UserRound className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No behavior events found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedDriver || selectedEventType || selectedSeverity || selectedStatus || dateRange.start || dateRange.end
                  ? 'No events match your current filter criteria.'
                  : 'Start recording driver behavior events to track performance and identify risks.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div key={event.id} className={`p-4 rounded-lg border ${
                  event.severity === 'critical' ? 'border-l-4 border-l-red-500 bg-red-50' :
                  event.severity === 'high' ? 'border-l-4 border-l-orange-500 bg-orange-50' :
                  event.severity === 'medium' ? 'border-l-4 border-l-yellow-500 bg-yellow-50' :
                  'border-l-4 border-l-green-500 bg-green-50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{event.driverName}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityClass(event.severity)}`}>
                          {event.severity.toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(event.status)}`}>
                          {event.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-500">Event Type</p>
                          <p className="font-medium">
                            {DRIVER_BEHAVIOR_EVENT_TYPES.find(t => t.value === event.eventType)?.label || event.eventType}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Date & Time</p>
                          <p className="font-medium">
                            {formatDate(event.eventDate)} {event.eventTime}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Fleet</p>
                          <p className="font-medium">{event.fleetNumber}</p>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-500">Description</p>
                        <p className="text-sm">{event.description}</p>
                      </div>
                      
                      {event.location && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="text-sm">{event.location}</p>
                        </div>
                      )}
                      
                      {event.actionTaken && (
                        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm font-medium text-blue-800">Action Taken:</p>
                          <p className="text-sm text-blue-700">{event.actionTaken}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-3 text-sm text-gray-500">
                        <span>Reported by {event.reportedBy}</span>
                        <span>•</span>
                        <span>{formatDateTime(event.reportedAt)}</span>
                        <span>•</span>
                        <span className="font-medium text-red-600">{event.points} points</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewEventDetails(event)}
                        icon={<Eye className="w-3 h-3" />}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditEvent(event)}
                        icon={<Edit className="w-3 h-3" />}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteEvent(event.id)}
                        icon={<Trash2 className="w-3 h-3" />}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add/Edit Event Modal */}
      <Modal
        isOpen={showAddEventModal}
        onClose={() => {
          resetForm();
          setShowAddEventModal(false);
        }}
        title={selectedEvent ? "Edit Driver Behavior Event" : "Record Driver Behavior Event"}
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Form Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <UserRound className="w-5 h-5 text-blue-600 mt-0.5" />
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
              value={eventForm.driverName}
              onChange={(e) => handleFormChange('driverName', e.target.value)}
              options={[
                { label: 'Select driver...', value: '' },
                ...DRIVERS.map(driver => ({ label: driver, value: driver }))
              ]}
              error={errors.driverName}
            />
            
            <Select
              label="Fleet Number *"
              value={eventForm.fleetNumber}
              onChange={(e) => handleFormChange('fleetNumber', e.target.value)}
              options={[
                { label: 'Select fleet...', value: '' },
                ...FLEET_NUMBERS.map(fleet => ({ label: fleet, value: fleet }))
              ]}
              error={errors.fleetNumber}
            />
            
            <Input
              label="Event Date *"
              type="date"
              value={eventForm.eventDate}
              onChange={(e) => handleFormChange('eventDate', e.target.value)}
              error={errors.eventDate}
            />
            
            <Input
              label="Event Time *"
              type="time"
              value={eventForm.eventTime}
              onChange={(e) => handleFormChange('eventTime', e.target.value)}
              error={errors.eventTime}
            />
            
            <Select
              label="Event Type *"
              value={eventForm.eventType}
              onChange={(e) => handleFormChange('eventType', e.target.value)}
              options={[
                { label: 'Select event type...', value: '' },
                ...DRIVER_BEHAVIOR_EVENT_TYPES.map(type => ({ label: type.label, value: type.value }))
              ]}
              error={errors.eventType}
            />
            
            <Select
              label="Severity *"
              value={eventForm.severity}
              onChange={(e) => handleFormChange('severity', e.target.value)}
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
              value={eventForm.location}
              onChange={(e) => handleFormChange('location', e.target.value)}
              placeholder="e.g., Highway A1, Kilometer 45"
            />
            
            <Select
              label="Status"
              value={eventForm.status}
              onChange={(e) => handleFormChange('status', e.target.value)}
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
            value={eventForm.description}
            onChange={(e) => handleFormChange('description', e.target.value)}
            placeholder="Provide details about the behavior event..."
            rows={3}
            error={errors.description}
          />
          
          <TextArea
            label="Action Taken"
            value={eventForm.actionTaken}
            onChange={(e) => handleFormChange('actionTaken', e.target.value)}
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
                value={eventForm.points.toString()}
                onChange={(e) => handleFormChange('points', parseInt(e.target.value))}
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
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setShowAddEventModal(false);
              }}
              icon={<X className="w-4 h-4" />}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              icon={<Save className="w-4 h-4" />}
            >
              {selectedEvent ? 'Update Event' : 'Record Event'}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Event Details Modal */}
      <Modal
        isOpen={showEventDetailsModal}
        onClose={() => {
          setSelectedEvent(null);
          setShowEventDetailsModal(false);
        }}
        title="Driver Behavior Event Details"
        maxWidth="lg"
      >
        {selectedEvent && (
          <div className="space-y-6">
            {/* Event Header */}
            <div className={`p-4 rounded-lg ${
              selectedEvent.severity === 'critical' ? 'bg-red-50 border border-red-200' :
              selectedEvent.severity === 'high' ? 'bg-orange-50 border border-orange-200' :
              selectedEvent.severity === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
              'bg-green-50 border border-green-200'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedEvent.driverName}</h3>
                  <p className="text-sm text-gray-600">Fleet {selectedEvent.fleetNumber}</p>
                </div>
                <div className="flex space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityClass(selectedEvent.severity)}`}>
                    {selectedEvent.severity.toUpperCase()}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(selectedEvent.status)}`}>
                    {selectedEvent.status.toUpperCase()}
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
                    {DRIVER_BEHAVIOR_EVENT_TYPES.find(t => t.value === selectedEvent.eventType)?.label || selectedEvent.eventType}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Date & Time</h4>
                  <p className="font-medium text-gray-900">
                    {formatDate(selectedEvent.eventDate)} at {selectedEvent.eventTime}
                  </p>
                </div>
                
                {selectedEvent.location && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Location</h4>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <p className="font-medium text-gray-900">{selectedEvent.location}</p>
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Demerit Points</h4>
                  <p className="font-medium text-red-600">{selectedEvent.points} points</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Reported By</h4>
                  <p className="font-medium text-gray-900">{selectedEvent.reportedBy}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(selectedEvent.reportedAt)}</p>
                </div>
                
                {selectedEvent.resolvedAt && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Resolved By</h4>
                    <p className="font-medium text-gray-900">{selectedEvent.resolvedBy}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(selectedEvent.resolvedAt)}</p>
                  </div>
                )}
                
                {selectedEvent.status === 'resolved' && !selectedEvent.resolvedAt && (
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-700">
                      This event is marked as resolved but missing resolution details.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Description */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
              <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-gray-900">{selectedEvent.description}</p>
              </div>
            </div>
            
            {/* Action Taken */}
            {selectedEvent.actionTaken && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Action Taken</h4>
                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                  <p className="text-blue-900">{selectedEvent.actionTaken}</p>
                </div>
              </div>
            )}
            
            {/* Attachments */}
            {selectedEvent.attachments && selectedEvent.attachments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Supporting Documents</h4>
                <div className="space-y-2">
                  {selectedEvent.attachments.map((attachment) => (
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
                onClick={() => {
                  setSelectedEvent(null);
                  setShowEventDetailsModal(false);
                }}
              >
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEventDetailsModal(false);
                  handleEditEvent(selectedEvent);
                }}
                icon={<Edit className="w-4 h-4" />}
              >
                Edit Event
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DriverPerformanceOverview;