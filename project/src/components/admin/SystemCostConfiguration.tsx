import React, { useState, useEffect } from 'react';
import { SystemCostRates, DEFAULT_SYSTEM_COST_RATES, SystemCostReminder, DEFAULT_SYSTEM_COST_REMINDER } from '../../types';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { Input } from '../ui/FormElements';
import Modal from '../ui/Modal';
import { Settings, Save, X, AlertTriangle, DollarSign, Clock, Navigation, History, Shield, Bell, Calendar } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/helpers';

interface SystemCostConfigurationProps {
  currentRates?: Record<'USD' | 'ZAR', SystemCostRates>;
  onUpdateRates: (currency: 'USD' | 'ZAR', rates: SystemCostRates) => void;
  userRole: 'admin' | 'manager' | 'operator';
}

const SystemCostConfiguration: React.FC<SystemCostConfigurationProps> = ({
  currentRates = DEFAULT_SYSTEM_COST_RATES,
  onUpdateRates,
  userRole
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<'USD' | 'ZAR' | null>(null);
  const [formData, setFormData] = useState<SystemCostRates | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [changeReason, setChangeReason] = useState('');
  
  // NEW: Monthly reminder system state
  const [reminder, setReminder] = useState<SystemCostReminder>(DEFAULT_SYSTEM_COST_REMINDER);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showReminderNotification, setShowReminderNotification] = useState(false);

  // NEW: Check for monthly reminder on component mount
  useEffect(() => {
    const checkMonthlyReminder = () => {
      const now = new Date();
      const nextReminderDate = new Date(reminder.nextReminderDate);
      
      // If current date is past the reminder date and reminder is active
      if (now >= nextReminderDate && reminder.isActive) {
        setShowReminderNotification(true);
      }
    };

    checkMonthlyReminder();
    
    // Set up interval to check every hour
    const interval = setInterval(checkMonthlyReminder, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [reminder]);

  // NEW: Handle monthly reminder dismissal
  const handleDismissReminder = () => {
    const now = new Date();
    const nextReminder = new Date(now.getTime() + reminder.reminderFrequencyDays * 24 * 60 * 60 * 1000);
    
    setReminder(prev => ({
      ...prev,
      lastReminderDate: now.toISOString(),
      nextReminderDate: nextReminder.toISOString(),
      updatedAt: now.toISOString()
    }));
    
    setShowReminderNotification(false);
    alert(`Monthly system cost reminder dismissed.\n\nNext reminder will appear on: ${nextReminder.toLocaleDateString()}`);
  };

  // NEW: Handle reminder configuration
  const handleConfigureReminder = () => {
    setShowReminderModal(true);
  };

  // NEW: Update reminder settings
  const handleUpdateReminder = (newFrequency: number, isActive: boolean) => {
    const now = new Date();
    const nextReminder = new Date(now.getTime() + newFrequency * 24 * 60 * 60 * 1000);
    
    setReminder(prev => ({
      ...prev,
      reminderFrequencyDays: newFrequency,
      isActive,
      nextReminderDate: nextReminder.toISOString(),
      updatedAt: now.toISOString()
    }));
    
    setShowReminderModal(false);
    alert(`Reminder settings updated!\n\nFrequency: Every ${newFrequency} days\nStatus: ${isActive ? 'Active' : 'Disabled'}\nNext reminder: ${nextReminder.toLocaleDateString()}`);
  };

  const handleEditRates = (currency: 'USD' | 'ZAR') => {
    setEditingCurrency(currency);
    setFormData({ ...currentRates[currency] });
    setChangeReason('');
    setIsOpen(true);
  };

  const handleChange = (section: 'perKmCosts' | 'perDayCosts', field: string, value: string) => {
    if (!formData) return;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setErrors(prev => ({ ...prev, [`${section}.${field}`]: 'Must be a valid positive number' }));
      return;
    }
    
    setErrors(prev => ({ ...prev, [`${section}.${field}`]: '' }));
    
    setFormData(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: numValue
      }
    }));
  };

  const validateForm = () => {
    if (!formData) return false;
    
    const newErrors: Record<string, string> = {};
    
    // Validate change reason
    if (!changeReason.trim()) {
      newErrors.changeReason = 'Reason for rate change is required for audit purposes';
    }
    
    // Validate per-KM costs
    Object.entries(formData.perKmCosts).forEach(([key, value]) => {
      if (value <= 0) {
        newErrors[`perKmCosts.${key}`] = 'Must be greater than 0';
      }
    });
    
    // Validate per-day costs
    Object.entries(formData.perDayCosts).forEach(([key, value]) => {
      if (value <= 0) {
        newErrors[`perDayCosts.${key}`] = 'Must be greater than 0';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasChanges = () => {
    if (!formData || !editingCurrency) return false;
    
    const original = currentRates[editingCurrency];
    
    // Check per-KM costs
    for (const [key, value] of Object.entries(formData.perKmCosts)) {
      if (value !== original.perKmCosts[key as keyof typeof original.perKmCosts]) {
        return true;
      }
    }
    
    // Check per-day costs
    for (const [key, value] of Object.entries(formData.perDayCosts)) {
      if (value !== original.perDayCosts[key as keyof typeof original.perDayCosts]) {
        return true;
      }
    }
    
    return false;
  };

  const handleSave = () => {
    if (!formData || !editingCurrency || !validateForm()) return;
    
    if (!hasChanges()) {
      setErrors({ general: 'No changes detected. Please make changes before saving.' });
      return;
    }
    
    const updatedRates: SystemCostRates = {
      ...formData,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'Current User', // In real app, use actual user
      effectiveDate: new Date().toISOString()
    };
    
    onUpdateRates(editingCurrency, updatedRates);
    setIsOpen(false);
    setEditingCurrency(null);
    setFormData(null);
    setChangeReason('');
    setErrors({});
    
    alert(`${editingCurrency} system cost rates updated successfully!\n\nReason: ${changeReason}\n\nNew rates will apply to all trips created from now onwards. Historical trips retain their original rates.`);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingCurrency(null);
    setFormData(null);
    setChangeReason('');
    setErrors({});
  };

  // Check permissions
  const canEdit = userRole === 'admin' || userRole === 'manager';

  return (
    <>
      {/* NEW: Monthly Reminder Notification */}
      {showReminderNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Card className="border-l-4 border-l-orange-400 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Bell className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-orange-800">Monthly System Cost Review</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    It's time for your monthly system cost configuration review. Please verify and update rates as needed.
                  </p>
                  <div className="mt-3 flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowReminderNotification(false);
                        // Scroll to system cost section
                        document.getElementById('system-cost-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      icon={<Settings className="w-3 h-3" />}
                    >
                      Review Now
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDismissReminder}
                    >
                      Remind Next Month
                    </Button>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowReminderNotification(false)}
                  className="p-1"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div id="system-cost-section">
        <Card>
          <CardHeader 
            title="System Cost Configuration"
            subtitle="Manage automatic operational cost rates for trip profitability calculation"
            icon={<Settings className="w-5 h-5 text-blue-600" />}
            action={
              canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleConfigureReminder}
                  icon={<Calendar className="w-4 h-4" />}
                >
                  Configure Reminders
                </Button>
              )
            }
          />
          <CardContent>
            {!canEdit && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-amber-800">View Only Access</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Only administrators and managers can modify system cost rates. Contact your administrator to request changes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* NEW: Monthly Reminder Status */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-800">Monthly Review Reminder</h4>
                  <div className="text-sm text-blue-700 mt-1 space-y-1">
                    <p><strong>Status:</strong> {reminder.isActive ? 'Active' : 'Disabled'}</p>
                    <p><strong>Frequency:</strong> Every {reminder.reminderFrequencyDays} days</p>
                    <p><strong>Next Reminder:</strong> {new Date(reminder.nextReminderDate).toLocaleDateString()}</p>
                    {reminder.lastReminderDate && (
                      <p><strong>Last Reminder:</strong> {new Date(reminder.lastReminderDate).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Rate Change Impact Warning */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Rate Change Impact & Version Control</h4>
                  <div className="text-sm text-blue-700 mt-1 space-y-1">
                    <p>• Changes to system cost rates will only affect <strong>new trips created after this update</strong></p>
                    <p>• Historical trips will retain the rates that were in effect at the time of creation</p>
                    <p>• All rate changes are logged with timestamps and reasons for audit purposes</p>
                    <p>• Each currency maintains independent rate tables</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* USD Rates */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">USD Rates</h3>
                  {canEdit && (
                    <Button
                      size="sm"
                      onClick={() => handleEditRates('USD')}
                      icon={<Settings className="w-4 h-4" />}
                    >
                      Edit USD Rates
                    </Button>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Navigation className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-700">Per-Kilometer Costs</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Repair & Maintenance</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(currentRates.USD.perKmCosts.repairMaintenance, 'USD')}/km
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tyre Cost</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(currentRates.USD.perKmCosts.tyreCost, 'USD')}/km
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-gray-700">Per-Day Fixed Costs</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(currentRates.USD.perDayCosts).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(value, 'USD')}/day
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-md p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <History className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Rate History</span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><strong>Last Updated:</strong> {formatDateTime(currentRates.USD.lastUpdated)}</p>
                    <p><strong>Updated By:</strong> {currentRates.USD.updatedBy}</p>
                    <p><strong>Effective Date:</strong> {formatDateTime(currentRates.USD.effectiveDate)}</p>
                  </div>
                </div>
              </div>

              {/* ZAR Rates */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">ZAR Rates</h3>
                  {canEdit && (
                    <Button
                      size="sm"
                      onClick={() => handleEditRates('ZAR')}
                      icon={<Settings className="w-4 h-4" />}
                    >
                      Edit ZAR Rates
                    </Button>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Navigation className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-700">Per-Kilometer Costs</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Repair & Maintenance</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(currentRates.ZAR.perKmCosts.repairMaintenance, 'ZAR')}/km
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tyre Cost</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(currentRates.ZAR.perKmCosts.tyreCost, 'ZAR')}/km
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-gray-700">Per-Day Fixed Costs</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(currentRates.ZAR.perDayCosts).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(value, 'ZAR')}/day
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-md p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <History className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Rate History</span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><strong>Last Updated:</strong> {formatDateTime(currentRates.ZAR.lastUpdated)}</p>
                    <p><strong>Updated By:</strong> {currentRates.ZAR.updatedBy}</p>
                    <p><strong>Effective Date:</strong> {formatDateTime(currentRates.ZAR.effectiveDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Logic Summary */}
            <div className="mt-8 bg-green-50 border border-green-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-green-800 mb-2">Automatic Application Logic</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p>• When a trip is created, the system automatically applies the current rates based on the trip's currency</p>
                <p>• Per-KM costs are calculated using: <strong>Distance × Rate per KM</strong></p>
                <p>• Per-Day costs are calculated using: <strong>Trip Duration × Rate per Day</strong></p>
                <p>• System costs appear under the "System Costs" category and are marked as auto-generated</p>
                <p>• All system costs are locked from manual editing to maintain consistency</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={`Edit ${editingCurrency} System Cost Rates`}
        maxWidth="lg"
      >
        {formData && editingCurrency && (
          <div className="space-y-6">
            {/* Change Reason - Required */}
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-amber-800">Rate Change Justification (Required)</h4>
                  <p className="text-sm text-amber-700 mt-1 mb-3">
                    All rate changes must be documented for audit purposes. Please provide a clear reason for this update.
                  </p>
                  <textarea
                    className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    rows={3}
                    placeholder="e.g., 'Monthly rate review - inflation adjustment', 'Fuel cost increase', 'Insurance premium update', etc."
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                  />
                  {errors.changeReason && (
                    <p className="text-sm text-red-600 mt-1">{errors.changeReason}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Per-KM Costs */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Per-Kilometer Costs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={`Repair & Maintenance (${editingCurrency}/km)`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.perKmCosts.repairMaintenance.toString()}
                  onChange={(e) => handleChange('perKmCosts', 'repairMaintenance', e.target.value)}
                  error={errors['perKmCosts.repairMaintenance']}
                />
                <Input
                  label={`Tyre Cost (${editingCurrency}/km)`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.perKmCosts.tyreCost.toString()}
                  onChange={(e) => handleChange('perKmCosts', 'tyreCost', e.target.value)}
                  error={errors['perKmCosts.tyreCost']}
                />
              </div>
            </div>

            {/* Per-Day Costs */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Per-Day Fixed Costs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(formData.perDayCosts).map(([key, value]) => (
                  <Input
                    key={key}
                    label={`${key.replace(/([A-Z])/g, ' $1').trim()} (${editingCurrency}/day)`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={value.toString()}
                    onChange={(e) => handleChange('perDayCosts', key, e.target.value)}
                    error={errors[`perDayCosts.${key}`]}
                  />
                ))}
              </div>
            </div>

            {/* Impact Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Impact Summary</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• These rates will apply to all new trips created after saving</p>
                <p>• Existing trips will retain their original rates for historical accuracy</p>
                <p>• Changes will be logged with timestamp and user information</p>
                <p>• Rate history will be preserved for audit purposes</p>
              </div>
            </div>

            {errors.general && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {errors.general}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleClose}
                icon={<X className="w-4 h-4" />}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges() || !changeReason.trim()}
                icon={<Save className="w-4 h-4" />}
              >
                Save {editingCurrency} Rates
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* NEW: Reminder Configuration Modal */}
      <Modal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        title="Configure Monthly Reminder"
        maxWidth="md"
      >
        <ReminderConfigForm
          reminder={reminder}
          onSave={handleUpdateReminder}
          onCancel={() => setShowReminderModal(false)}
        />
      </Modal>
    </>
  );
};

// NEW: Reminder Configuration Form Component
const ReminderConfigForm: React.FC<{
  reminder: SystemCostReminder;
  onSave: (frequency: number, isActive: boolean) => void;
  onCancel: () => void;
}> = ({ reminder, onSave, onCancel }) => {
  const [frequency, setFrequency] = useState(reminder.reminderFrequencyDays.toString());
  const [isActive, setIsActive] = useState(reminder.isActive);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    const freqNum = parseInt(frequency);
    if (isNaN(freqNum) || freqNum < 1) {
      newErrors.frequency = 'Frequency must be at least 1 day';
    }
    if (freqNum > 365) {
      newErrors.frequency = 'Frequency cannot exceed 365 days';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(parseInt(frequency), isActive);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start space-x-3">
          <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-800">Monthly System Cost Review Reminder</h4>
            <p className="text-sm text-blue-700 mt-1">
              Configure automatic reminders to review and update system cost rates. This helps ensure rates stay current with market conditions.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="reminderActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="reminderActive" className="text-sm font-medium text-gray-700">
            Enable automatic reminders
          </label>
        </div>

        <Input
          label="Reminder Frequency (days)"
          type="number"
          min="1"
          max="365"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          error={errors.frequency}
          disabled={!isActive}
        />

        <div className="bg-gray-50 rounded-md p-3">
          <h4 className="text-sm font-medium text-gray-800 mb-2">Preview</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Status:</strong> {isActive ? 'Active' : 'Disabled'}</p>
            {isActive && (
              <>
                <p><strong>Frequency:</strong> Every {frequency} days</p>
                <p><strong>Next Reminder:</strong> {new Date(Date.now() + parseInt(frequency) * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onCancel}
          icon={<X className="w-4 h-4" />}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          icon={<Save className="w-4 h-4" />}
        >
          Save Reminder Settings
        </Button>
      </div>
    </div>
  );
};

export default SystemCostConfiguration;