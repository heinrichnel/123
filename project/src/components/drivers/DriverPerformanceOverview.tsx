import React, { useState, useEffect, useMemo } from 'react';
import { GridColDef } from '@mui/x-data-grid';
import { mockDriverBehaviorEvents } from '../../api/mockData';
import { DriverBehaviorEvent } from '../../types';
import Header from '../../components/Header';

const DriverPerformanceOverview: React.FC = () => {
  const { addDriverBehaviorEvent, updateDriverBehaviorEvent, deleteDriverBehaviorEvent, getAllDriversPerformance } = useAppContext();
  
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
  
  // Get all driver performance data
  const driversPerformance = useMemo(() => {
    return getAllDriversPerformance();
  }, [getAllDriversPerformance]);
  
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
  const handleFormChange = (
    field: string,
    value: string | number | boolean | Date
  ) => {
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
      eventType: '' as DriverBehaviorEventType,
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
  
  const columns: GridColDef[] = useMemo(() => [
    { field: 'id', headerName: 'ID', width: 90 },
    {
      field: 'driverId',
      headerName: 'Driver ID',
      width: 120,
    },
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      width: 150,
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
    },
    {
      field: 'eventType',
      headerName: 'Event Type',
      width: 150,
    },
    {
      field: 'eventValue',
      headerName: 'Event Value',
      width: 120,
    },
    {
      field: 'latitude',
      headerName: 'Latitude',
      width: 120,
    },
    {
      field: 'longitude',
      headerName: 'Longitude',
      width: 120,
    },
  ], []);

  const rows = useMemo(() => {
    return driverBehaviorEvents;
  }, [driverBehaviorEvents]);

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setDriverBehaviorEvents(mockDriverBehaviorEvents);
      setIsLoading(false);
    }, 1000);
  }, []);

  const [driverBehaviorEvents, setDriverBehaviorEvents] = useState<DriverBehaviorEvent[]>([]);

  const processedDriverBehaviorEvents = useMemo(() => {
    // Process driverBehaviorEvents here
    return driverBehaviorEvents;
  }, [driverBehaviorEvents]); // Added driverBehaviorEvents as dependency

  return (
    <div>
      <Header />
      {/* Example: Display summary */}
      {summary && (
        <section>
          <h2>Summary</h2>
          <pre>{JSON.stringify(summary, null, 2)}</pre>
        </section>
      )}

      {/* Example: Show loading state */}
      {isLoading && <div>Loading...</div>}

      {/* Example: Render table if columns and rows exist */}
      {columns && rows && (
        <table>
          <thead>
            <tr>
              {columns.map((col: Column, idx: number) => (
                <th key={idx}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: Row, idx: number) => (
              <tr key={idx}>
                {columns.map((col: Column, cidx: number) => (
                  <td key={cidx}>{row[col.accessor]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Example: Use processedDriverBehaviorEvents */}
      {processedDriverBehaviorEvents && (
        <section>
          <h3>Processed Events</h3>
          <ul>
            {processedDriverBehaviorEvents.map((event: DriverBehaviorEvent, idx: number) => (
              <li key={idx}>
                <span className={getSeverityClass ? getSeverityClass(event.severity) : ""}>
                  {event.name}
                </span>
                <span className={getStatusClass ? getStatusClass(event.status) : ""}>
                  {event.status}
                </span>
                <button onClick={() => handleViewEventDetails && handleViewEventDetails(event)}>
                  View Details
                </button>
                <button onClick={() => handleEditEvent && handleEditEvent(event)}>
                  Edit
                </button>
                <button onClick={() => handleDeleteEvent && handleDeleteEvent(event)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Example: Show Add Event Modal */}
      {showAddEventModal && (
        <div className="modal">
          <form onChange={handleFormChange} onSubmit={handleSubmit}>
            {/* ...form fields... */}
            <button type="submit">Submit</button>
            <button type="button" onClick={() => setShowAddEventModal(false)}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Example: Show Event Details Modal */}
      {showEventDetailsModal && (
        <div className="modal">
          {/* ...event details... */}
          <button onClick={() => setShowEventDetailsModal(false)}>Close</button>
        </div>
      )}

      {/* Example: Clear Filters Button */}
      <button onClick={clearFilters}>Clear Filters</button>
    </div>
  );
};

export default DriverPerformanceOverview;