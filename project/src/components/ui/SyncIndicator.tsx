import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { RefreshCw, Check, Clock } from 'lucide-react';

interface SyncIndicatorProps {
  className?: string;
  showText?: boolean;
}

const SyncIndicator: React.FC<SyncIndicatorProps> = ({ 
  className = '',
  showText = true
}) => {
  const { connectionStatus } = useAppContext();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  
  // Simulate sync activity when connection status changes
  useEffect(() => {
    if (connectionStatus === 'reconnecting') {
      setIsSyncing(true);
    } else if (connectionStatus === 'connected') {
      // Simulate sync completion after reconnection
      const timer = setTimeout(() => {
        setIsSyncing(false);
        setLastSynced(new Date());
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus]);
  
  // Format time since last sync
  const getTimeSinceSync = () => {
    if (!lastSynced) return 'Never';
    
    const seconds = Math.floor((new Date().getTime() - lastSynced.getTime()) / 1000);
    
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };
  
  return (
    <div className={`flex items-center space-x-2 text-xs ${className}`}>
      {isSyncing ? (
        <>
          <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
          {showText && <span className="text-blue-600">Syncing data...</span>}
        </>
      ) : (
        <>
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
          }`} />
          {showText && (
            <span className={connectionStatus === 'connected' ? 'text-gray-500' : 'text-red-500'}>
              {connectionStatus === 'connected' 
                ? `Synced ${getTimeSinceSync()}` 
                : 'Offline'}
            </span>
          )}
        </>
      )}
    </div>
  );
};

export default SyncIndicator;