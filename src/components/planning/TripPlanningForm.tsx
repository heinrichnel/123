// ─── React ───────────────────────────────────────────────────────
import React, { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────
import { Trip, DelayReason, DELAY_REASON_TYPES } from '../../types';

// ─── UI Components ───────────────────────────────────────────────
import Button from '../ui/Button';
import Card, { CardContent, CardHeader } from '../ui/Card';
import { Input, Select, Textarea } from '../ui/FormElements';

// ─── Icons ───────────────────────────────────────────────────────
import { AlertTriangle, Plus, X } from 'lucide-react';

// ─── Helper Functions ────────────────────────────────────────────
import { formatDateTime } from '../../utils/helpers';


interface TripPlanningFormProps {
  trip: Trip;
  onUpdate: (updatedTrip: Trip) => void;
  onAddDelay: (delay: Omit<DelayReason, 'id'>) => void;
  readOnly?: boolean;
}

const TripPlanningForm: React.FC<TripPlanningFormProps> = ({
  trip,
  onUpdate,
  onAddDelay,
  readOnly = false
}) => {
  const [plannedTimes, setPlannedTimes] = useState({
    plannedArrivalDateTime: trip.plannedArrivalDateTime || '',
    plannedOffloadDateTime: trip.plannedOffloadDateTime || '',
    plannedDepartureDateTime: trip.plannedDepartureDateTime || ''
  });

  const [actualTimes, setActualTimes] = useState({
    actualArrivalDateTime: trip.actualArrivalDateTime || '',
    actualOffloadDateTime: trip.actualOffloadDateTime || '',
    actualDepartureDateTime: trip.actualDepartureDateTime || ''
  });

  const [newDelay, setNewDelay] = useState({
    delayType: '',
    description: '',
    delayDuration: ''
  });

  const [showDelayForm, setShowDelayForm] = useState(false);

  const handlePlannedTimeChange = (field: string, value: string) => {
    setPlannedTimes(prev => ({ ...prev, [field]: value }));
  };

  const handleActualTimeChange = (field: string, value: string) => {
    setActualTimes(prev => ({ ...prev, [field]: value }));
  };

  const savePlannedTimes = () => {
    onUpdate({
      ...trip,
      ...plannedTimes
    });
  };

  const saveActualTimes = () => {
    onUpdate({
      ...trip,
      ...actualTimes
    });
  };

  const calculateDiscrepancies = () => {
    const discrepancies = [];
    
    if (plannedTimes.plannedArrivalDateTime && actualTimes.actualArrivalDateTime) {
      const planned = new Date(plannedTimes.plannedArrivalDateTime);
      const actual = new Date(actualTimes.actualArrivalDateTime);
      const diffHours = (actual.getTime() - planned.getTime()) / (1000 * 60 * 60);
      
      if (Math.abs(diffHours) > 1) { // More than 1 hour difference
        discrepancies.push({
          type: 'Arrival',
          planned: formatDateTime(planned),
          actual: formatDateTime(actual),
          difference: `${diffHours > 0 ? '+' : ''}${diffHours.toFixed(1)} hours`
        });
      }
    }

    if (plannedTimes.plannedOffloadDateTime && actualTimes.actualOffloadDateTime) {
      const planned = new Date(plannedTimes.plannedOffloadDateTime);
      const actual = new Date(actualTimes.actualOffloadDateTime);
      const diffHours = (actual.getTime() - planned.getTime()) / (1000 * 60 * 60);
      
      if (Math.abs(diffHours) > 1) {
        discrepancies.push({
          type: 'Offload',
          planned: formatDateTime(planned),
          actual: formatDateTime(actual),
          difference: `${diffHours > 0 ? '+' : ''}${diffHours.toFixed(1)} hours`
        });
      }
    }

    if (plannedTimes.plannedDepartureDateTime && actualTimes.actualDepartureDateTime) {
      const planned = new Date(plannedTimes.plannedDepartureDateTime);
      const actual = new Date(actualTimes.actualDepartureDateTime);
      const diffHours = (actual.getTime() - planned.getTime()) / (1000 * 60 * 60);
      
      if (Math.abs(diffHours) > 1) {
        discrepancies.push({
          type: 'Departure',
          planned: formatDateTime(planned),
          actual: formatDateTime(actual),
          difference: `${diffHours > 0 ? '+' : ''}${diffHours.toFixed(1)} hours`
        });
      }
    }

    return discrepancies;
  };

  const handleAddDelay = () => {
    if (!newDelay.delayType || !newDelay.description || !newDelay.delayDuration) {
      alert('Please fill in all delay fields');
      return;
    }

    onAddDelay({
      tripId: trip.id,
      delayType: newDelay.delayType as any,
      description: newDelay.description,
      delayDuration: parseFloat(newDelay.delayDuration),
      reportedAt: new Date().toISOString(),
      reportedBy: 'Current User',
      severity: 'moderate' // or set based on your UI/logic, e.g., newDelay.severity
    });

    setNewDelay({ delayType: '', description: '', delayDuration: '' });
    setShowDelayForm(false);
  };

  const discrepancies = calculateDiscrepancies();

  return (
    <div className="space-y-6">
      {/* Planned Times */}
      <Card>
        <CardHeader 
          title="Planned Timeline" 
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Planned Arrival Date & Time"
              type="datetime-local"
              value={plannedTimes.plannedArrivalDateTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePlannedTimeChange('plannedArrivalDateTime', e.target.value)}
              disabled={readOnly}
            />
            <Input
              label="Planned Offload Date & Time"
              type="datetime-local"
              value={plannedTimes.plannedOffloadDateTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePlannedTimeChange('plannedOffloadDateTime', e.target.value)}
              disabled={readOnly}
            />
            <Input
              label="Planned Departure Date & Time"
              type="datetime-local"
              value={plannedTimes.plannedDepartureDateTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePlannedTimeChange('plannedDepartureDateTime', e.target.value)}
              disabled={readOnly}
            />
          </div>
          {!readOnly && (
            <div className="mt-4 flex justify-end">
              <Button onClick={savePlannedTimes}>
                Save Planned Times
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actual Times */}
      <Card>
        <CardHeader 
          title="Actual Timeline" 
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Actual Arrival Date & Time"
              type="datetime-local"
              value={actualTimes.actualArrivalDateTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleActualTimeChange('actualArrivalDateTime', e.target.value)}
              disabled={readOnly}
            />
            <Input
              label="Actual Offload Date & Time"
              type="datetime-local"
              value={actualTimes.actualOffloadDateTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleActualTimeChange('actualOffloadDateTime', e.target.value)}
              disabled={readOnly}
            />
            <Input
              label="Actual Departure Date & Time"
              type="datetime-local"
              value={actualTimes.actualDepartureDateTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleActualTimeChange('actualDepartureDateTime', e.target.value)}
              disabled={readOnly}
            />
          </div>
          {!readOnly && (
            <div className="mt-4 flex justify-end">
              <Button onClick={saveActualTimes}>
                Save Actual Times
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discrepancies Alert */}
      {discrepancies.length > 0 && (
        <Card className="border-l-4 border-l-amber-400">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">Timeline Discrepancies Detected</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Significant differences found between planned and actual times:
                </p>
                <div className="mt-3 space-y-2">
                  {discrepancies.map((disc, index) => (
                    <div key={index} className="text-sm bg-amber-50 p-2 rounded border border-amber-200">
                      <div className="font-medium text-amber-800">{disc.type} Time Variance</div>
                      <div className="text-amber-700">
                        <span className="font-medium">Planned:</span> {disc.planned}
                      </div>
                      <div className="text-amber-700">
                        <span className="font-medium">Actual:</span> {disc.actual}
                      </div>
                      <div className="text-amber-800 font-medium">
                        <span className="font-medium">Difference:</span> {disc.difference}
                      </div>
                    </div>
                  ))}
                </div>
                {!readOnly && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      onClick={() => setShowDelayForm(true)}
                      icon={<Plus className="w-4 h-4" />}
                    >
                      Add Delay Reason
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delay Reasons */}
      {trip.delayReasons && trip.delayReasons.length > 0 && (
        <Card>
          <CardHeader title="Recorded Delays" />
          <CardContent>
            <div className="space-y-3">
              {trip.delayReasons.map((delay, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">
                        {DELAY_REASON_TYPES.find(t => t.value === delay.delayType)?.label || delay.delayType}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{delay.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Duration: {delay.delayDuration} hours • Reported by {delay.reportedBy} on {formatDateTime(delay.reportedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Delay Form */}
      {showDelayForm && !readOnly && (
        <Card>
          <CardHeader 
            title="Add Delay Reason" 
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDelayForm(false)}
                icon={<X className="w-4 h-4" />}
              >
                Cancel
              </Button>
            }
          />
          <CardContent>
            <div className="space-y-4">
              <Select
                label="Delay Type *"
                value={newDelay.delayType}
                onChange={(e) => setNewDelay(prev => ({ ...prev, delayType: e.target.value }))}
                options={[
                  { label: 'Select delay type...', value: '' },
                  ...DELAY_REASON_TYPES
                ]}
              />
              <Textarea
                label="Description *"
                value={newDelay.description}
                onChange={(e) => setNewDelay(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the delay and its impact..."
                rows={3}
              />
              <Input
                label="Delay Duration (hours) *"
                type="number"
                step="0.5"
                min="0"
                value={newDelay.delayDuration}
                onChange={(e) => setNewDelay(prev => ({ ...prev, delayDuration: e.target.value }))}
                placeholder="e.g., 2.5"
              />
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDelayForm(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddDelay}>
                  Add Delay Reason
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TripPlanningForm;