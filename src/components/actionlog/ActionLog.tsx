import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ActionItem, RESPONSIBLE_PERSONS } from '../../types';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { Input, Select, TextArea } from '../ui/FormElements';
import Modal from '../ui/Modal';
import { 
  ClipboardList, 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  X, 
  Save, 
  Eye,
  MessageSquare,
  FileUp
} from 'lucide-react';
import { formatDate, formatDateTime } from '../../utils/helpers';
import SyncIndicator from '../ui/SyncIndicator';
import ActionItemDetails from './ActionItemDetails';

const ActionLog: React.FC = () => {
  const { actionItems, addActionItem, updateActionItem, deleteActionItem, connectionStatus } = useAppContext();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ActionItem | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    responsiblePerson: '',
    overdue: false
  });
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    responsiblePerson: '',
    dueDate: '',
    status: 'initiated' as 'initiated' | 'in_progress' | 'completed'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  
  // Calculate overdue status and days for each action item
  const enhancedActionItems = useMemo(() => {
    return actionItems.map(item => {
      const today = new Date();
      const dueDate = new Date(item.dueDate);
      const isOverdue = today > dueDate && item.status !== 'completed';
      const overdueBy = isOverdue ? Math.floor((today.getTime() - dueDate.getTime()) / (86400000)) : 0;
      
      // Check if overdue by 5 or 10 days
      const isOverdueBy5 = overdueBy >= 5;
      const isOverdueBy10 = overdueBy >= 10;
      
      return {
        ...item,
        isOverdue,
        overdueBy,
        isOverdueBy5,
        isOverdueBy10,
        needsReason: isOverdueBy10 && !item.overdueReason && item.status !== 'completed'
      };
    });
  }, [actionItems]);
  
  // Apply filters
  const filteredItems = useMemo(() => {
    return enhancedActionItems.filter(item => {
      if (filters.status && item.status !== filters.status) return false;
      if (filters.responsiblePerson && item.responsiblePerson !== filters.responsiblePerson) return false;
      if (filters.overdue && !item.isOverdue) return false;
      return true;
    });
  }, [enhancedActionItems, filters]);
  
  // Sort items: first by status (incomplete first), then by due date (overdue first)
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      // Completed items at the bottom
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      
      // Then sort by due date (overdue first)
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      
      // Then by due date (earliest first)
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [filteredItems]);
  
  // Calculate summary statistics
  const summary = useMemo(() => {
    const total = enhancedActionItems.length;
    const completed = enhancedActionItems.filter(item => item.status === 'completed').length;
    const inProgress = enhancedActionItems.filter(item => item.status === 'in_progress').length;
    const initiated = enhancedActionItems.filter(item => item.status === 'initiated').length;
    const overdue = enhancedActionItems.filter(item => item.isOverdue).length;
    const overdueBy5 = enhancedActionItems.filter(item => item.isOverdueBy5).length;
    const overdueBy10 = enhancedActionItems.filter(item => item.isOverdueBy10).length;
    const needReason = enhancedActionItems.filter(item => item.needsReason).length;
    
    return {
      total,
      completed,
      inProgress,
      initiated,
      overdue,
      overdueBy5,
      overdueBy10,
      needReason,
      completionRate: total > 0 ? (completed / total) * 100 : 0
    };
  }, [enhancedActionItems]);
  
  // Handle form changes
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.responsiblePerson) newErrors.responsiblePerson = 'Responsible person is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    
    // Validate due date is not in the past
    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    const actionItemData: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      responsiblePerson: formData.responsiblePerson,
      startDate: today,
      dueDate: formData.dueDate,
      status: formData.status,
      attachments: []
    };
    
    // Add action item
    const newId = addActionItem(actionItemData);
    
    // Reset form and close modal
    resetForm();
    setShowAddModal(false);
    
    alert(`Action item created successfully!\n\nTitle: ${actionItemData.title}\nResponsible: ${actionItemData.responsiblePerson}\nDue Date: ${formatDate(actionItemData.dueDate)}`);
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      responsiblePerson: '',
      dueDate: '',
      status: 'initiated'
    });
    setSelectedFiles(null);
    setErrors({});
  };
  
  // Handle adding overdue reason
  const handleAddOverdueReason = (item: ActionItem, reason: string) => {
    if (!reason.trim()) {
      alert('Please provide a reason for the overdue action item');
      return;
    }
    
    updateActionItem({
      ...item,
      overdueReason: reason
    });
    
    alert('Overdue reason added successfully');
  };
  
  // Handle status change
  const handleStatusChange = (item: ActionItem, newStatus: 'initiated' | 'in_progress' | 'completed') => {
    const updates: Partial<ActionItem> = {
      status: newStatus
    };
    
    // If marking as completed, add completion date and user
    if (newStatus === 'completed') {
      updates.completedAt = new Date().toISOString();
      updates.completedBy = 'Current User'; // In a real app, use the logged-in user
    }
    
    updateActionItem({
      ...item,
      ...updates
    });
  };
  
  // Handle delete action item
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this action item? This action cannot be undone.')) {
      deleteActionItem(id);
      alert('Action item deleted successfully');
    }
  };
  
  // Handle view details
  const handleViewDetails = (item: ActionItem) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Action Log</h2>
          <div className="flex items-center mt-1">
            <p className="text-gray-600 mr-3">Track and manage action items and tasks</p>
            <SyncIndicator />
          </div>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          icon={<Plus className="w-4 h-4" />}
          disabled={connectionStatus !== 'connected'}
        >
          Add Action Item
        </Button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Action Items</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                <p className="text-xs text-gray-400">
                  {summary.completionRate.toFixed(0)}% completion rate
                </p>
              </div>
              <ClipboardList className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{summary.overdue}</p>
                <p className="text-xs text-gray-400">
                  {summary.overdueBy10} need reason
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
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{summary.inProgress}</p>
                <p className="text-xs text-gray-400">
                  {summary.initiated} initiated
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
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">{summary.completed}</p>
                <p className="text-xs text-gray-400">
                  tasks finished
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader title="Filter Action Items" />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Initiated', value: 'initiated' },
                { label: 'In Progress', value: 'in_progress' },
                { label: 'Completed', value: 'completed' }
              ]}
            />
            
            <Select
              label="Responsible Person"
              value={filters.responsiblePerson}
              onChange={(e) => setFilters(prev => ({ ...prev, responsiblePerson: e.target.value }))}
              options={[
                { label: 'All Persons', value: '' },
                ...RESPONSIBLE_PERSONS.map(person => ({ label: person, value: person }))
              ]}
            />
            
            <div className="flex items-center space-x-3 pt-8">
              <input
                type="checkbox"
                id="overdueFilter"
                checked={filters.overdue}
                onChange={(e) => setFilters(prev => ({ ...prev, overdue: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="overdueFilter" className="text-sm font-medium text-gray-700">
                Show Overdue Items Only
              </label>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFilters({ status: '', responsiblePerson: '', overdue: false })}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Action Items List */}
      <Card>
        <CardHeader 
          title={`Action Items (${filteredItems.length})`}
          action={
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              icon={<Plus className="w-4 h-4" />}
              disabled={connectionStatus !== 'connected'}
            >
              Add Action Item
            </Button>
          }
        />
        <CardContent>
          {sortedItems.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No action items found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.status || filters.responsiblePerson || filters.overdue
                  ? 'No items match your current filter criteria.'
                  : 'Start by adding your first action item.'}
              </p>
              {!filters.status && !filters.responsiblePerson && !filters.overdue && (
                <div className="mt-4">
                  <Button
                    onClick={() => {
                      resetForm();
                      setShowAddModal(true);
                    }}
                    icon={<Plus className="w-4 h-4" />}
                    disabled={connectionStatus !== 'connected'}
                  >
                    Add First Action Item
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-lg border ${
                    item.status === 'completed' ? 'bg-green-50 border-green-200' :
                    item.isOverdueBy10 ? 'bg-red-50 border-l-4 border-l-red-500' :
                    item.isOverdueBy5 ? 'bg-amber-50 border-l-4 border-l-amber-500' :
                    item.isOverdue ? 'bg-yellow-50 border-l-4 border-l-yellow-500' :
                    'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(item.status)}`}>
                          {item.status === 'in_progress' ? 'In Progress' : 
                           item.status === 'completed' ? 'Completed' : 'Initiated'}
                        </span>
                        {item.isOverdue && item.status !== 'completed' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Overdue by {item.overdueBy} days
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Responsible</p>
                            <p className="font-medium">{item.responsiblePerson}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Due Date</p>
                            <p className={`font-medium ${item.isOverdue && item.status !== 'completed' ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatDate(item.dueDate)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Started</p>
                            <p className="font-medium">{formatDate(item.startDate)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-500">Description</p>
                        <p className="text-sm">{item.description}</p>
                      </div>
                      
                      {item.overdueReason && (
                        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded">
                          <p className="text-sm font-medium text-amber-800">Overdue Reason:</p>
                          <p className="text-sm text-amber-700">{item.overdueReason}</p>
                        </div>
                      )}
                      
                      {item.completedAt && (
                        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm font-medium text-green-800">Completed:</p>
                          <p className="text-sm text-green-700">
                            {formatDateTime(item.completedAt)} by {item.completedBy}
                          </p>
                        </div>
                      )}
                      
                      {/* Overdue Reason Input for items overdue by 10+ days */}
                      {item.needsReason && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm font-medium text-red-800 mb-2">
                            This item is overdue by 10+ days and requires a reason
                          </p>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              placeholder="Enter reason for delay..."
                              className="flex-1 px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                              id={`reason-${item.id}`}
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                const reasonInput = document.getElementById(`reason-${item.id}`) as HTMLInputElement;
                                handleAddOverdueReason(item, reasonInput.value);
                              }}
                            >
                              Save Reason
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Comments count */}
                      {item.comments && item.comments.length > 0 && (
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <MessageSquare className="w-4 h-4" />
                          <span>{item.comments.length} comment{item.comments.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      
                      {/* Attachments count */}
                      {item.attachments && item.attachments.length > 0 && (
                        <div className="flex items-center space-x-2 text-sm text-gray-500 ml-4">
                          <FileUp className="w-4 h-4" />
                          <span>{item.attachments.length} attachment{item.attachments.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(item)}
                        icon={<Eye className="w-3 h-3" />}
                      >
                        View
                      </Button>
                      
                      {item.status !== 'completed' && (
                        <Button
                          size="sm"
                          variant={item.status === 'initiated' ? 'outline' : 'primary'}
                          onClick={() => handleStatusChange(item, item.status === 'initiated' ? 'in_progress' : 'completed')}
                          icon={item.status === 'initiated' ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                          disabled={connectionStatus !== 'connected'}
                        >
                          {item.status === 'initiated' ? 'Start' : 'Complete'}
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(item.id)}
                        icon={<Trash2 className="w-3 h-3" />}
                        disabled={connectionStatus !== 'connected'}
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
      
      {/* Add Action Item Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          resetForm();
          setShowAddModal(false);
        }}
        title="Add Action Item"
        maxWidth="lg"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <ClipboardList className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Action Item Tracking</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Create a new action item to track tasks, assign responsibility, and monitor progress.
                  Start date will be automatically set to today.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <Input
              label="Title *"
              value={formData.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              placeholder="Enter action item title..."
              error={errors.title}
            />
            
            <TextArea
              label="Description *"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Provide details about the action item..."
              rows={3}
              error={errors.description}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Responsible Person *"
                value={formData.responsiblePerson}
                onChange={(e) => handleFormChange('responsiblePerson', e.target.value)}
                options={[
                  { label: 'Select responsible person...', value: '' },
                  ...RESPONSIBLE_PERSONS.map(person => ({ label: person, value: person }))
                ]}
                error={errors.responsiblePerson}
              />
              
              <Input
                label="Due Date *"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleFormChange('dueDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                error={errors.dueDate}
              />
            </div>
            
            <Select
              label="Initial Status"
              value={formData.status}
              onChange={(e) => handleFormChange('status', e.target.value as any)}
              options={[
                { label: 'Initiated', value: 'initiated' },
                { label: 'In Progress', value: 'in_progress' }
              ]}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (Optional)
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
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setShowAddModal(false);
              }}
              icon={<X className="w-4 h-4" />}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              icon={<Save className="w-4 h-4" />}
            >
              Create Action Item
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Action Item Details Modal */}
      {selectedItem && (
        <ActionItemDetails
          isOpen={showDetailsModal}
          onClose={() => {
            setSelectedItem(null);
            setShowDetailsModal(false);
          }}
          actionItem={selectedItem}
          onStatusChange={handleStatusChange}
          onAddOverdueReason={handleAddOverdueReason}
        />
      )}
    </div>
  );
};

export default ActionLog;