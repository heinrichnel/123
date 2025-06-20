<<<<<<< HEAD
// ─── React ───────────────────────────────────────────────────────
import React from 'react';

// ─── Icons ───────────────────────────────────────────────────────
import {
  Activity,
  BarChart3,
  Calendar,
  CheckCircle,
  ClipboardList,
  Clock,
  DollarSign,
  FileText,
  Flag,
  Fuel,
  Plus,
  Settings,
  Shield,
  Target,
  TrendingDown,
  Truck,
  Upload,
  Users,
  Wifi,
  WifiOff,
  User as UserRound // Alias to avoid name conflict
} from 'lucide-react';

// ─── Context ─────────────────────────────────────────────────────
import { useAppContext } from '../../context/AppContext';

// ─── UI Components ───────────────────────────────────────────────
import Button from '../ui/Button';
import SyncIndicator from '../ui/SyncIndicator';

=======

import React from 'react';
import { User, Bell, Settings } from 'lucide-react';
import Button from '../ui/Button';
>>>>>>> 26992b5f0a3b081be38f1bd0501c447ccf1bbf89

interface HeaderProps {
  title?: string;
  userName?: string;
  onProfileClick?: () => void;
  onNotificationsClick?: () => void;
  onSettingsClick?: () => void;
}

<<<<<<< HEAD
const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, onNewTrip }) => {
  const { connectionStatus } = useAppContext();
  
  const navItems = [
    { id: 'ytd-kpis', label: 'YTD KPIs', icon: Target },
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'active-trips', label: 'Active Trips', icon: Truck },
    { id: 'completed-trips', label: 'Completed Trips', icon: CheckCircle },
    { id: 'flags', label: 'Flags & Investigations', icon: Flag },
    { id: 'reports', label: 'Reports & Exports', icon: BarChart3 },
    { id: 'system-costs', label: 'Indirect Costs', icon: Settings },
    { id: 'invoice-aging', label: 'Invoice Aging', icon: Clock },
    { id: 'customer-retention', label: 'Customer Retention', icon: Users },
    { id: 'missed-loads', label: 'Missed Loads', icon: TrendingDown },
    { id: 'diesel-dashboard', label: 'Diesel Dashboard', icon: Fuel },
    { id: 'driver-behavior', label: 'Driver Behavior', icon: Shield },
    { id: 'action-log', label: 'Action Log', icon: ClipboardList }
  ];

=======
const Header: React.FC<HeaderProps> = ({
  title = "Transport Management System",
  userName = "Current User",
  onProfileClick,
  onNotificationsClick,
  onSettingsClick
}) => {
>>>>>>> 26992b5f0a3b081be38f1bd0501c447ccf1bbf89
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              {title}
            </h1>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button
              variant="outline"
              size="sm"
              onClick={onNotificationsClick}
              icon={<Bell className="w-4 h-4" />}
              className="relative"
            >
              <span className="sr-only">Notifications</span>
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span>
            </Button>

            {/* Settings */}
            <Button
              variant="outline"
              size="sm"
              onClick={onSettingsClick}
              icon={<Settings className="w-4 h-4" />}
            >
              <span className="sr-only">Settings</span>
            </Button>

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="text-sm">
                <span className="text-gray-700">Welcome, </span>
                <span className="font-medium text-gray-900">{userName}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onProfileClick}
                icon={<User className="w-4 h-4" />}
              >
                Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
