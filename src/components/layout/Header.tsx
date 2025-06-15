The code adds a user profile component to the header of the application.
```

```typescript
import React from 'react';
import { Truck, Plus, Flag, CheckCircle, Activity, FileText, BarChart3, Settings, Target, Users, Calendar, DollarSign, Clock, TrendingDown, Upload, Fuel, Wifi, WifiOff, Database, User as UserRound, ClipboardList, Shield } from 'lucide-react';
import Button from '../ui/Button.js';
import { useAppContext } from '../../context/AppContext';
import SyncIndicator from '../ui/SyncIndicator.js';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onNewTrip: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, onNewTrip }) => {
  const { connectionStatus } = useAppContext();

  const navItems = [
    { id: 'ytd-kpis', label: 'YTD KPIs', icon: Target },
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'active-trips', label: 'Active Trips', icon: Truck },
    { id: 'completed-trips', label: 'Completed Trips', icon: CheckCircle },
    { id: 'flags', label: 'Flags & Investigations', icon: Flag },
    { id: 'reports', label: 'Reports & Exports', icon: BarChart3 },
    { id: 'system-costs', label: 'System Costs', icon: Settings },
    { id: 'invoice-aging', label: 'Invoice Aging', icon: Clock },
    { id: 'customer-retention', label: 'Customer Retention', icon: Users },
    { id: 'missed-loads', label: 'Missed Loads', icon: TrendingDown },
    { id: 'diesel-dashboard', label: 'Diesel Dashboard', icon: Fuel },
    { id: 'driver-behavior', label: 'Driver Behavior', icon: Shield },
    { id: 'action-log', label: 'Action Log', icon: ClipboardList },
    { id: 'admin', label: 'Admin', icon: Database }
  ];

  return (
    <aside className="fixed inset-y-0 left-0 w-64 border-r border-gray-200 bg-white z-10 flex flex-col h-screen">
      {/* Logo and Title */}
      <div className="flex items-center space-x-3 p-4 border-b border-gray-200">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
          <Truck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">TripPro</h1>
          <p className="text-sm text-gray-500">Mtanauska Transport</p>
        </div>
      </div>

      {/* Connection Status */}
      {connectionStatus !== 'connected' && (
        <div className={`mx-2 my-2 px-3 py-2 rounded-md text-xs font-medium flex items-center space-x-2 ${
          connectionStatus === 'disconnected' 
            ? 'bg-red-100 text-red-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {connectionStatus === 'disconnected' ? (
            <>
              <WifiOff className="w-3 h-3" />
              <span>Offline Mode - Changes will sync when reconnected</span>
            </>
          ) : (
            <>
              <Wifi className="w-3 h-3" />
              <span>Reconnecting...</span>
            </>
          )}
        </div>
      )}

      {/* Vertical Nav Items */}
      <nav className="flex flex-col p-2 space-y-1 overflow-y-auto flex-1">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-md transition-colors
                ${currentView === item.id 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <IconComponent className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sync Status */}
      <div className="px-4 py-2 border-t border-gray-200">
        <SyncIndicator />
      </div>

      {/* Action Button */}
      <div className="p-4 border-t border-gray-200">
        <Button
          onClick={onNewTrip}
          icon={<Plus className="w-4 h-4" />}
          fullWidth
          disabled={connectionStatus !== 'connected'}
          title={connectionStatus !== 'connected' ? 'Connect to add new trips' : 'Add new trip'}
        >
          Add Trip
        </Button>
      </div>
    </aside>
  );
};

export default Header;
```import React, { createContext, useState, useEffect, useContext, FC } from 'react';

interface AuthContextProps {
    isLoggedIn: boolean;
    setLoggedIn: (loggedIn: boolean) => void;
    user: any;
    setUser: (user: any) => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextProps>({
    isLoggedIn: false,
    setLoggedIn: () => {},
    user: null,
    setUser: () => {},
    isLoading: true,
});

export const AuthProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoggedIn, setLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedAuth = localStorage.getItem('replitAuth');
        if (storedAuth) {
            const authData = JSON.parse(storedAuth);
            setLoggedIn(authData.isLoggedIn);
            setUser(authData.user);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        localStorage.setItem('replitAuth', JSON.stringify({ isLoggedIn, user }));
    }, [isLoggedIn, user]);

    return (
        <AuthContext.Provider value={{ isLoggedIn, setLoggedIn, user, setUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

import { ReplitReplAuth } from 'replit-auth-react';
import styled from 'styled-components';

const StyledButton = styled.button`
  background-color: #4CAF50; /* Green */
  border: none;
  color: white;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 5px;
`;

export const LoginButton = () => {
    const { setLoggedIn, setUser } = useAuth();

    const handleLogin = (user: any) => {
        setLoggedIn(true);
        setUser(user);
    };

    return (
        <ReplitReplAuth
            callback={handleLogin}
            btnStyle={{
                background: '#4CAF50',
                color: 'white',
                padding: '10px 20px',
                textAlign: 'center',
                textDecoration: 'none',
                display: 'inline-block',
                fontSize: '16px',
                margin: '4px 2px',
                cursor: 'pointer',
                borderRadius: '5px',
                border: 'none',
            }}
        />
    );
};

const UserProfile = () => {
    const { user, setLoggedIn, setUser } = useAuth();

    const handleLogout = () => {
        setLoggedIn(false);
        setUser(null);
    };

    if (!user) {
        return <LoginButton />;
    }

    return (
        <div>
            <span>{user.username}</span>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
};

import React from 'react';
import { Truck, Plus, Flag, CheckCircle, Activity, FileText, BarChart3, Settings, Target, Users, Calendar, DollarSign, Clock, TrendingDown, Upload, Fuel, Wifi, WifiOff, Database, User as UserRound, ClipboardList, Shield } from 'lucide-react';
import Button from '../ui/Button.js';
import { useAppContext } from '../../context/AppContext';
import SyncIndicator from '../ui/SyncIndicator.js';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onNewTrip: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, onNewTrip }) => {
  const { connectionStatus } = useAppContext();

  const navItems = [
    { id: 'ytd-kpis', label: 'YTD KPIs', icon: Target },
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'active-trips', label: 'Active Trips', icon: Truck },
    { id: 'completed-trips', label: 'Completed Trips', icon: CheckCircle },
    { id: 'flags', label: 'Flags & Investigations', icon: Flag },
    { id: 'reports', label: 'Reports & Exports', icon: BarChart3 },
    { id: 'system-costs', label: 'System Costs', icon: Settings },
    { id: 'invoice-aging', label: 'Invoice Aging', icon: Clock },
    { id: 'customer-retention', label: 'Customer Retention', icon: Users },
    { id: 'missed-loads', label: 'Missed Loads', icon: TrendingDown },
    { id: 'diesel-dashboard', label: 'Diesel Dashboard', icon: Fuel },
    { id: 'driver-behavior', label: 'Driver Behavior', icon: Shield },
    { id: 'action-log', label: 'Action Log', icon: ClipboardList },
    { id: 'admin', label: 'Admin', icon: Database }
  ];

  return (
    <aside className="fixed inset-y-0 left-0 w-64 border-r border-gray-200 bg-white z-10 flex flex-col h-screen">
      {/* Logo and Title */}
      <div className="flex items-center space-x-3 p-4 border-b border-gray-200">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
          <Truck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">TripPro</h1>
          <p className="text-sm text-gray-500">Mtanauska Transport</p>
        </div>
      </div>

      {/* Connection Status */}
      {connectionStatus !== 'connected' && (
        <div className={`mx-2 my-2 px-3 py-2 rounded-md text-xs font-medium flex items-center space-x-2 ${
          connectionStatus === 'disconnected' 
            ? 'bg-red-100 text-red-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {connectionStatus === 'disconnected' ? (
            <>
              <WifiOff className="w-3 h-3" />
              <span>Offline Mode - Changes will sync when reconnected</span>
            </>
          ) : (
            <>
              <Wifi className="w-3 h-3" />
              <span>Reconnecting...</span>
            </>
          )}
        </div>
      )}

      {/* Vertical Nav Items */}
      <nav className="flex flex-col p-2 space-y-1 overflow-y-auto flex-1">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-md transition-colors
                ${currentView === item.id 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <IconComponent className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sync Status */}
      <div className="px-4 py-2 border-t border-gray-200">
        <SyncIndicator />
      </div>

      {/* Action Button */}
      <div className="p-4 border-t border-gray-200">
        <Button
          onClick={onNewTrip}
          icon={<Plus className="w-4 h-4" />}
          fullWidth
          disabled={connectionStatus !== 'connected'}
          title={connectionStatus !== 'connected' ? 'Connect to add new trips' : 'Add new trip'}
        >
          Add Trip
        </Button>
      </div>
    </aside>
  );
};

export default Header;