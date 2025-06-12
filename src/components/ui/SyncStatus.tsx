import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { RefreshCw, Database, CheckCircle, AlertTriangle } from 'lucide-react';

interface SyncStatusProps {
  className?: string;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ className = '' }) => {
  const { connectionStatus } = useAppContext();
  const [pendingChanges, setPendingChanges] = useState(0);
  const [syncHistory, setSyncHistory] = useState<Array<{
    timestamp: Date;
    status: 'success' | 'error';
    message: string;
  }>>([]);
  
  // Simulate pending changes when offline
  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      // Simulate random pending changes when offline
      const interval = setInterval(() => {
        setPendingChanges(prev => {
          const change = Math.random() > 0.7 ? 1 : 0;
          return prev + change;
        });
      }, 5000);
      
      return () => clearInterval(interval);
    } else if (connectionStatus === 'connected' && pendingChanges > 0) {
      // Simulate syncing when reconnected
      const timer = setTimeout(() => {
        setSyncHistory(prev => [
          {
            timestamp: new Date(),
            status: 'success',
            message: `Synced ${pendingChanges} pending changes`
          },
          ...prev.slice(0, 9) // Keep last 10 entries
        ]);
        setPendingChanges(0);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, pendingChanges]);
  
  return (
    <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Sync Status</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'reconnecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-sm font-medium">
            {connectionStatus === 'connected' ? 'Online' : 
             connectionStatus === 'reconnecting' ? 'Reconnecting' : 'Offline'}
          </span>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Pending Changes */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Pending Changes</span>
          </div>
          <div className="flex items-center">
            {pendingChanges > 0 ? (
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                {pendingChanges} pending
              </span>
            ) : (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                All synced
              </span>
            )}
          </div>
        </div>
        
        {/* Sync Status */}
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="flex items-center space-x-2 mb-2">
            {connectionStatus === 'reconnecting' || pendingChanges > 0 ? (
              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
            ) : connectionStatus === 'connected' ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm font-medium text-gray-700">
              {connectionStatus === 'reconnecting' ? 'Syncing...' :
               connectionStatus === 'connected' ? 'Firestore Connection Active' :
               'Offline - Using Local Cache'}
            </span>
          </div>
          
          {connectionStatus === 'disconnected' && (
            <p className="text-xs text-gray-500 ml-6">
              Changes will be synced automatically when your connection is restored
            </p>
          )}
        </div>
        
        {/* Recent Sync History */}
        {syncHistory.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Sync Activity</h4>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {syncHistory.map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    {entry.status === 'success' ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                    )}
                    <span className={entry.status === 'success' ? 'text-green-700' : 'text-red-700'}>
                      {entry.message}
                    </span>
                  </div>
                  <span className="text-gray-500">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncStatus;