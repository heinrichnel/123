import React from 'react';
import { useReplitAuth } from '../../context/ReplitAuthContext';
import UserProfile from '../auth/UserProfile';
import { Truck, LogOut } from 'lucide-react';
import Button from '../ui/Button';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const { user, isAuthenticated } = useReplitAuth();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <Truck className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Matanuska Transport
              </h1>
              <p className="text-sm text-gray-500">Management System</p>
            </div>
          </div>

          {/* User Section */}
          {isAuthenticated && user && (
            <div className="flex items-center space-x-4">
              <UserProfile user={user} />
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                icon={<LogOut className="w-4 h-4" />}
                className="text-gray-600 hover:text-gray-800"
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;