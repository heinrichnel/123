import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { Database, RefreshCw, CheckCircle, AlertTriangle, Clock, Server, HardDrive } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';

const FirestoreStatus: React.FC = () => {
  const { trips, missedLoads, dieselRecords, connectionStatus } = useAppContext();
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStats, setSyncStats] = useState({
    trips: 0,
    missedLoads: 0,
    dieselRecords: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Update sync stats when data changes
  useEffect(() => {
    setSyncStats({
      trips: trips.length,
      missedLoads: missedLoads.length,
      dieselRecords: dieselRecords.length
    });
    
    if (connectionStatus === 'connected') {
      setLastSyncTime(new Date());
    }
  }, [trips, missedLoads, dieselRecords, connectionStatus]);
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Simulate refresh
    setTimeout(() => {
      setLastSyncTime(new Date());
      setIsRefreshing(false);
    }, 1500);
  };
  
  // Calculate time since last sync
  const getTimeSinceSync = () => {
    if (!lastSyncTime) return 'Never';
    
    const seconds = Math.floor((new Date().getTime() - lastSyncTime.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };
  
  return (
    <Card>
      <CardHeader 
        title="Firestore Database Status" 
        icon={<Database className="w-5 h-5 text-blue-600" />}
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            icon={isRefreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            disabled={isRefreshing || connectionStatus !== 'connected'}
          >
            Refresh
          </Button>
        }
      />
      <CardContent>
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Server className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Connection Status</p>
                <p className="text-xs text-gray-500">Firestore real-time database</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'reconnecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className={`text-sm font-medium ${
                connectionStatus === 'connected' ? 'text-green-700' : 
                connectionStatus === 'reconnecting' ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {connectionStatus === 'connected' ? 'Connected' : 
                 connectionStatus === 'reconnecting' ? 'Reconnecting' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          {/* Sync Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <HardDrive className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-700">Trips</p>
              </div>
              <p className="text-2xl font-bold text-blue-800">{syncStats.trips}</p>
              <p className="text-xs text-blue-600 mt-1">Synced records</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <HardDrive className="w-4 h-4 text-purple-600" />
                <p className="text-sm font-medium text-purple-700">Missed Loads</p>
              </div>
              <p className="text-2xl font-bold text-purple-800">{syncStats.missedLoads}</p>
              <p className="text-xs text-purple-600 mt-1">Synced records</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <HardDrive className="w-4 h-4 text-green-600" />
                <p className="text-sm font-medium text-green-700">Diesel Records</p>
              </div>
              <p className="text-2xl font-bold text-green-800">{syncStats.dieselRecords}</p>
              <p className="text-xs text-green-600 mt-1">Synced records</p>
            </div>
          </div>
          
          {/* Last Sync Info */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Last Synchronized</p>
                <p className="text-xs text-gray-500">{getTimeSinceSync()}</p>
              </div>
            </div>
            {lastSyncTime && (
              <p className="text-sm text-gray-600">
                {formatDateTime(lastSyncTime)}
              </p>
            )}
          </div>
          
          {/* Offline Mode Info */}
          {connectionStatus !== 'connected' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800">Working in Offline Mode</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    You're currently working with locally cached data. Changes you make will be stored locally and automatically synchronized when your connection is restored.
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-amber-600">
                    <p>• All data entry is available while offline</p>
                    <p>• Some operations like completing trips or invoicing require an active connection</p>
                    <p>• Data will automatically sync when connection is restored</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Sync Success */}
          {connectionStatus === 'connected' && lastSyncTime && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">Real-Time Sync Active</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Your data is being synchronized in real-time with the Firestore database. All changes are automatically saved and shared across devices.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FirestoreStatus;