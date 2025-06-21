import React, { useState } from 'react';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Input, Select, TextArea } from '../ui/FormElements';
import { 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  TrendingDown, 
  Calendar,
  MapPin,
  User,
  X,
  Save,
  CheckCircle,
  FileText
} from 'lucide-react';
import { MissedLoad, MISSED_LOAD_REASONS, CLIENTS } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';

interface MissedLoadsTrackerProps {
  missedLoads: MissedLoad[];
  onAddMissedLoad: (missedLoad: Omit<MissedLoad, 'id'>) => Promise<string>;
  onUpdateMissedLoad: (missedLoad: MissedLoad) => Promise<void>;
  onDeleteMissedLoad?: (id: string) => Promise<void>;
}

const MissedLoadsTracker: React.FC<MissedLoadsTrackerProps> = ({
  missedLoads,
  onAddMissedLoad,
  onUpdateMissedLoad,
  onDeleteMissedLoad
}) => {
  const { connectionStatus } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [editingLoad, setEditingLoad] = useState<MissedLoad | null>(null);
  const [resolvingLoad, setResolvingLoad] = useState<MissedLoad | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    loadRequestDate: new Date().toISOString().split('T')[0],
    requestedPickupDate: '',
    requestedDeliveryDate: '',
    route: '',
    estimatedRevenue: '',
    currency: 'ZAR' as 'ZAR' | 'USD',
    reason: '',
    reasonDescription: '',
    resolutionStatus: 'pending' as 'pending' | 'resolved' | 'lost_opportunity' | 'rescheduled',
    followUpRequired: true,
    competitorWon: false,
    impact: 'medium' as 'low' | 'medium' | 'high'
  });
  const [resolutionData, setResolutionData] = useState({
    resolutionNotes: '',
    compensationOffered: '',
    compensationNotes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string | boolean) => {
    // Always coerce to string for string fields
    if (typeof formData[field as keyof typeof formData] === 'string') {
      setFormData(prev => ({ ...prev, [field]: String(value ?? '') }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleResolutionChange = (field: string, value: string) => {
    setResolutionData(prev => ({ ...prev, [field]: String(value ?? '') }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!String(formData.customerName ?? '').trim()) {
      newErrors.customerName = 'Customer name is required';
    }
    if (!formData.loadRequestDate) {
      newErrors.loadRequestDate = 'Load request date is required';
    }
    if (!formData.requestedPickupDate) {
      newErrors.requestedPickupDate = 'Requested pickup date is required';
    }
    if (!formData.requestedDeliveryDate) {
      newErrors.requestedDeliveryDate = 'Requested delivery date is required';
    }
    if (!String(formData.route ?? '').trim()) {
      newErrors.route = 'Route is required';
    }
    if (!formData.estimatedRevenue || Number(formData.estimatedRevenue) <= 0) {
      newErrors.estimatedRevenue = 'Valid estimated revenue is required';
    }
    if (!formData.reason) {
      newErrors.reason = 'Reason for missing load is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateResolutionForm = () => {
    const newErrors: Record<string, string> = {};
    if (!String(resolutionData.resolutionNotes ?? '').trim()) {
      newErrors.resolutionNotes = 'Resolution notes are required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      const missedLoadData: Omit<MissedLoad, 'id'> = {
        customerName: String(formData.customerName ?? '').trim(),
        loadRequestDate: formData.loadRequestDate,
        requestedPickupDate: formData.requestedPickupDate,
        requestedDeliveryDate: formData.requestedDeliveryDate,
        route: String(formData.route ?? '').trim(),
        estimatedRevenue: Number(formData.estimatedRevenue),
        currency: formData.currency,
        reason: formData.reason as any,
        reasonDescription: String(formData.reasonDescription ?? '').trim() || undefined,
        resolutionStatus: formData.resolutionStatus,
        followUpRequired: formData.followUpRequired,
        competitorWon: formData.competitorWon,
        recordedBy: 'Current User',
        recordedAt: new Date().toISOString(),
        impact: formData.impact
      };
      
      if (editingLoad) {
        await onUpdateMissedLoad({ ...missedLoadData, id: editingLoad.id });
        alert('Missed load updated successfully!');
      } else {
        await onAddMissedLoad(missedLoadData);
        alert('Missed load recorded successfully!');
      }
      handleClose();
    } catch (error) {
      console.error("Error saving missed load:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  };

  const handleResolutionSubmit = async () => {
    if (!validateResolutionForm() || !resolvingLoad) return;
    try {
      const updatedLoad: MissedLoad = {
        ...resolvingLoad,
        resolutionStatus: 'resolved',
        resolutionNotes: String(resolutionData.resolutionNotes ?? '').trim(),
        resolvedAt: new Date().toISOString(),
        resolvedBy: 'Current User',
        compensationOffered: resolutionData.compensationOffered ? Number(resolutionData.compensationOffered) : undefined,
        compensationNotes: String(resolutionData.compensationNotes ?? '').trim() || undefined
      };
      
      await onUpdateMissedLoad(updatedLoad);
      alert(`Missed load resolved successfully!\n\nResolution: ${resolutionData.resolutionNotes}\n${resolutionData.compensationOffered ? `Compensation offered: ${formatCurrency(Number(resolutionData.compensationOffered), resolvingLoad.currency)}` : ''}`);
      setShowResolutionModal(false);
      setResolvingLoad(null);
      setResolutionData({
        resolutionNotes: '',
        compensationOffered: '',
        compensationNotes: ''
      });
      setErrors({});
    } catch (error) {
      console.error("Error resolving missed load:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  };

  const handleEdit = (load: MissedLoad) => {
    setFormData({
      customerName: load.customerName,
      loadRequestDate: load.loadRequestDate,
      requestedPickupDate: load.requestedPickupDate,
      requestedDeliveryDate: load.requestedDeliveryDate,
      route: load.route,
      estimatedRevenue: load.estimatedRevenue.toString(),
      currency: load.currency,
      reason: load.reason,
      reasonDescription: load.reasonDescription || '',
      resolutionStatus: load.resolutionStatus,
      followUpRequired: load.followUpRequired,
      competitorWon: load.competitorWon || false,
      impact: load.impact
    });
    setEditingLoad(load);
    setShowModal(true);
  };

  const handleResolve = (load: MissedLoad) => {
    setResolvingLoad(load);
    setResolutionData({
      resolutionNotes: '',
      compensationOffered: '',
      compensationNotes: ''
    });
    setShowResolutionModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!onDeleteMissedLoad) return;
    
    const load = missedLoads.find(l => l.id === id);
    if (!load) return;

    const confirmMessage = `Are you sure you want to delete this missed load?\n\n` +
      `Customer: ${load.customerName}\n` +
      `Route: ${load.route}\n` +
      `Estimated Revenue: ${formatCurrency(load.estimatedRevenue, load.currency)}\n\n` +
      `This action cannot be undone.`;

    if (confirm(confirmMessage)) {
      try {
        setIsDeleting(true);
        await onDeleteMissedLoad(id);
        alert('Missed load deleted successfully');
      } catch (error) {
        console.error("Error deleting missed load:", error);
        alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingLoad(null);
    setFormData({
      customerName: '',
      loadRequestDate: new Date().toISOString().split('T')[0],
      requestedPickupDate: '',
      requestedDeliveryDate: '',
      route: '',
      estimatedRevenue: '',
      currency: 'ZAR',
      reason: '',
      reasonDescription: '',
      resolutionStatus: 'pending',
      followUpRequired: true,
      competitorWon: false,
      impact: 'medium'
    });
    setErrors({});
  };

  const handleNewMissedLoad = () => {
    setEditingLoad(null);
    setShowModal(true);
  };

  // Calculate summary metrics
  const totalMissedLoads = missedLoads.length;
  const revenueLostZAR = missedLoads
    .filter(load => load.currency === 'ZAR' && load.resolutionStatus !== 'resolved')
    .reduce((sum, load) => sum + load.estimatedRevenue, 0);
  const revenueLostUSD = missedLoads
    .filter(load => load.currency === 'USD' && load.resolutionStatus !== 'resolved')
    .reduce((sum, load) => sum + load.estimatedRevenue, 0);
  const resolvedLoads = missedLoads.filter(load => load.resolutionStatus === 'resolved').length;
  const competitorWins = missedLoads.filter(load => load.competitorWon).length;
  const compensationOfferedZAR = missedLoads
    .filter(load => load.currency === 'ZAR' && load.compensationOffered)
    .reduce((sum, load) => sum + (load.compensationOffered || 0), 0);
  const compensationOfferedUSD = missedLoads
    .filter(load => load.currency === 'USD' && load.compensationOffered)
    .reduce((sum, load) => sum + (load.compensationOffered || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'rescheduled': return 'bg-blue-100 text-blue-800';
      case 'lost_opportunity': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Missed Loads Tracker</h2>
          <p className="text-gray-600">Track and analyze missed business opportunities</p>
        </div>
        <Button
          onClick={handleNewMissedLoad}
          icon={<Plus className="w-4 h-4" />}
          disabled={connectionStatus !== 'connected'}
        >
          Record Missed Load
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Missed Loads</p>
                <p className="text-2xl font-bold text-red-600">{totalMissedLoads}</p>
                <p className="text-xs text-gray-400">{resolvedLoads} resolved</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Revenue Lost</p>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(revenueLostZAR, 'ZAR')}
                  </p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(revenueLostUSD, 'USD')}
                  </p>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Compensation Offered</p>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(compensationOfferedZAR, 'ZAR')}
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(compensationOfferedUSD, 'USD')}
                  </p>
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Competitor Wins</p>
                <p className="text-2xl font-bold text-red-600">{competitorWins}</p>
                <p className="text-xs text-gray-400">High priority</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Missed Loads List */}
      <Card>
        <CardHeader title={`Missed Loads (${missedLoads.length})`} />
        <CardContent>
          {missedLoads.length === 0 ? (
            <div className="text-center py-12">
              <TrendingDown className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No missed loads recorded</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start tracking missed business opportunities to identify improvement areas.
              </p>
              <div className="mt-6">
                <Button onClick={handleNewMissedLoad} icon={<Plus className="w-4 h-4" />}>
                  Record First Missed Load
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {missedLoads.map((load) => {
                const safeResolutionNotes = typeof load.resolutionNotes === 'string' ? load.resolutionNotes : '';
                return (
                  <div key={load.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{load.customerName}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(load.resolutionStatus)}`}>
                            {load.resolutionStatus.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(load.impact)}`}>
                            {load.impact.toUpperCase()} IMPACT
                          </span>
                          {load.competitorWon && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              COMPETITOR WON
                            </span>
                          )}
                          {load.resolutionStatus === 'resolved' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              RESOLVED
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Route</p>
                              <p className="font-medium">{load.route}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Requested Dates</p>
                              <p className="font-medium text-sm">
                                {formatDate(load.requestedPickupDate)} - {formatDate(load.requestedDeliveryDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Estimated Revenue</p>
                              <p className="font-medium text-red-600">
                                {formatCurrency(load.estimatedRevenue, load.currency)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Recorded By</p>
                              <p className="font-medium text-sm">{load.recordedBy}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-gray-500">Reason</p>
                          <p className="font-medium">
                            {MISSED_LOAD_REASONS.find((r: string) => r === load.reason)?.label || load.reason}
                          </p>
                          {load.reasonDescription && (
                            <p className="text-sm text-gray-600 mt-1">{load.reasonDescription}</p>
                          )}
                        </div>

                        {load.resolutionStatus === 'resolved' && safeResolutionNotes && (
                          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded">
                            <p className="text-sm font-medium text-green-800">Resolution Notes:</p>
                            <p className="text-sm text-green-700">{safeResolutionNotes}</p>
                            {load.compensationOffered && (
                              <p className="text-sm text-green-700 mt-1">
                                <strong>Compensation Offered:</strong> {formatCurrency(load.compensationOffered, load.currency)}
                              </p>
                            )}
                            <p className="text-xs text-green-600 mt-1">
                              Resolved by {load.resolvedBy} on {load.resolvedAt ? formatDate(load.resolvedAt) : 'Unknown'}
                            </p>
                          </div>
                        )}

                        <div className="text-xs text-gray-500">
                          Recorded on {formatDate(load.recordedAt)} • 
                          {load.followUpRequired && <span className="text-amber-600 font-medium ml-1">Follow-up required</span>}
                        </div>
                      </div>

                      <div className="flex space-x-2 ml-4">
                        {load.resolutionStatus !== 'resolved' && (
                          <Button
                            size="sm"
                            onClick={() => handleResolve(load)}
                            icon={<FileText className="w-3 h-3" />}
                            disabled={connectionStatus !== 'connected'}
                          >
                            Resolve
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(load)}
                          icon={<Edit className="w-3 h-3" />}
                          disabled={connectionStatus !== 'connected'}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(load.id)}
                          icon={<Trash2 className="w-3 h-3" />}
                          disabled={isDeleting || connectionStatus !== 'connected'}
                          isLoading={isDeleting}
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleClose}
        title={editingLoad ? 'Edit Missed Load' : 'Record Missed Load'}
        maxWidth="lg"
      >
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">Missed Load Documentation</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Record all missed business opportunities to identify patterns and improve our response capabilities. 
                  This data helps in capacity planning and competitive analysis.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Customer Name *"
              value={formData.customerName}
              onChange={value => handleChange('customerName', value)}
              options={[
                { label: 'Select customer...', value: '' },
                ...CLIENTS.map(c => ({ label: c, value: c })),
                { label: 'Other (specify in description)', value: 'Other' }
              ]}
              error={errors.customerName}
            />

            <Input
              label="Load Request Date *"
              type="date"
              value={formData.loadRequestDate}
              onChange={value => handleChange('loadRequestDate', value)}
              error={errors.loadRequestDate}
            />

            <Input
              label="Requested Pickup Date *"
              type="date"
              value={formData.requestedPickupDate}
              onChange={value => handleChange('requestedPickupDate', value)}
              error={errors.requestedPickupDate}
            />

            <Input
              label="Requested Delivery Date *"
              type="date"
              value={formData.requestedDeliveryDate}
              onChange={value => handleChange('requestedDeliveryDate', value)}
              error={errors.requestedDeliveryDate}
            />

            <Input
              label="Route *"
              value={formData.route}
              onChange={value => handleChange('route', value)}
              placeholder="e.g., Johannesburg to Cape Town"
              error={errors.route}
            />

            <div className="grid grid-cols-2 gap-2">
              <Select
                label="Currency *"
                value={formData.currency}
                onChange={value => handleChange('currency', value)}
                options={[
                  { label: 'ZAR (R)', value: 'ZAR' },
                  { label: 'USD ($)', value: 'USD' }
                ]}
              />
              <Input
                label="Estimated Revenue *"
                type="number"
                step="0.01"
                min="0"
                value={formData.estimatedRevenue}
                onChange={value => handleChange('estimatedRevenue', value)}
                placeholder="0.00"
                error={errors.estimatedRevenue}
              />
            </div>

            <Select
              label="Reason for Missing Load *"
              value={formData.reason}
              onChange={value => handleChange('reason', value)}
              options={[
                { label: 'Select reason...', value: '' },
                ...MISSED_LOAD_REASONS
              ]}
              error={errors.reason}
            />

            <Select
              label="Business Impact"
              value={formData.impact}
              onChange={value => handleChange('impact', value)}
              options={[
                { label: 'Low Impact', value: 'low' },
                { label: 'Medium Impact', value: 'medium' },
                { label: 'High Impact', value: 'high' }
              ]}
            />

            <Select
              label="Resolution Status"
              value={formData.resolutionStatus}
              onChange={value => handleChange('resolutionStatus', value)}
              options={[
                { label: 'Pending', value: 'pending' },
                { label: 'Resolved', value: 'resolved' },
                { label: 'Lost Opportunity', value: 'lost_opportunity' },
                { label: 'Rescheduled', value: 'rescheduled' }
              ]}
            />
          </div>

          <TextArea
            label="Additional Details"
            value={formData.reasonDescription}
            onChange={value => handleChange('reasonDescription', value)}
            placeholder="Provide additional context about why this load was missed and any lessons learned..."
            rows={3}
          />

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="followUpRequired"
                checked={formData.followUpRequired}
                onChange={e => handleChange('followUpRequired', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="followUpRequired" className="text-sm font-medium text-gray-700">
                Follow-up required with customer
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="competitorWon"
                checked={formData.competitorWon}
                onChange={e => handleChange('competitorWon', e.target.checked)}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <label htmlFor="competitorWon" className="text-sm font-medium text-gray-700">
                Competitor won this load
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              icon={<X className="w-4 h-4" />}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              icon={<Save className="w-4 h-4" />}
            >
              {editingLoad ? 'Update Missed Load' : 'Record Missed Load'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Resolution Modal */}
      <Modal
        isOpen={showResolutionModal}
        onClose={() => {
          setShowResolutionModal(false);
          setResolvingLoad(null);
          setResolutionData({
            resolutionNotes: '',
            compensationOffered: '',
            compensationNotes: ''
          });
          setErrors({});
        }}
        title="Resolve Missed Load"
        maxWidth="md"
      >
        {resolvingLoad && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">Missed Load Resolution</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Document how this missed load was resolved and any compensation or goodwill gestures offered to maintain customer relationships.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-md p-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Missed Load Details</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Customer:</strong> {resolvingLoad.customerName}</p>
                <p><strong>Route:</strong> {resolvingLoad.route}</p>
                <p><strong>Estimated Revenue:</strong> {formatCurrency(resolvingLoad.estimatedRevenue, resolvingLoad.currency)}</p>
                <p><strong>Reason:</strong> {MISSED_LOAD_REASONS.find((r: string) => r === resolvingLoad.reason)?.label || resolvingLoad.reason}</p>
              </div>
            </div>

            <div className="space-y-4">
              <TextArea
                label="Resolution Notes *"
                value={resolutionData.resolutionNotes}
                onChange={value => handleResolutionChange('resolutionNotes', value)}
                placeholder="Describe how this missed load was resolved, what actions were taken, and the outcome..."
                rows={4}
                error={errors.resolutionNotes}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={`Compensation Offered (${resolvingLoad.currency})`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={resolutionData.compensationOffered}
                  onChange={value => handleResolutionChange('compensationOffered', value)}
                  placeholder="0.00"
                />
                <div></div>
              </div>

              <TextArea
                label="Compensation Notes"
                value={resolutionData.compensationNotes}
                onChange={value => handleResolutionChange('compensationNotes', value)}
                placeholder="Details about any compensation or goodwill gestures offered..."
                rows={3}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Resolution Recording</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• This missed load will be marked as <strong>RESOLVED</strong></p>
                <p>• Resolution details will be recorded for future reference</p>
                <p>• Customer relationship impact will be tracked</p>
                <p>• Resolution will be logged with timestamp and user information</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResolutionModal(false);
                  setResolvingLoad(null);
                  setResolutionData({
                    resolutionNotes: '',
                    compensationOffered: '',
                    compensationNotes: ''
                  });
                  setErrors({});
                }}
                icon={<X className="w-4 h-4" />}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResolutionSubmit}
                icon={<CheckCircle className="w-4 h-4" />}
              >
                Mark as Resolved
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MissedLoadsTracker;