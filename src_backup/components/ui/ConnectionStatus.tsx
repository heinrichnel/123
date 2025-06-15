import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Wifi, WifiOff, RefreshCw, Check } from 'lucide-react';

interface ConnectionStatusProps {
  className?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const { connectionStatus, isOnline } = useAppContext();
  const [showSuccess, setShowSuccess] = useState(false);
  const [visible, setVisible] = useState(false);
  
  // Show a brief success message when reconnecting
  useEffect(() => {
    if (connectionStatus === 'connected' && !isOnline) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, isOnline]);
  
  // Control visibility of the component
  useEffect(() => {
    if (connectionStatus !== 'connected' || showSuccess) {
      setVisible(true);
    } else {
      // Add a small delay before hiding to allow for animation
      const timer = setTimeout(() => {
        setVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, showSuccess]);
  
  if (!visible) {
    return null;
  }
  
  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className={`flex items-center space-x-2 px-4 py-2 rounded-full shadow-lg text-sm font-medium transition-all duration-300 ${
        connectionStatus === 'disconnected' 
          ? 'bg-red-100 text-red-800 border border-red-200' 
          : connectionStatus === 'reconnecting'
          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
          : 'bg-green-100 text-green-800 border border-green-200'
      }`}>
        {connectionStatus === 'disconnected' ? (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Offline - Changes will sync when reconnected</span>
          </>
        ) : connectionStatus === 'reconnecting' ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Reconnecting...</span>
          </>
        ) : (
          <>
            <Check className="w-4 h-4" />
            <span>Connected - Data synced successfully</span>
          </>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;