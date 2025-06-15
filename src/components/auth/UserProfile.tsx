
import React, { useState } from 'react';
import { useReplitAuth } from '../../context/ReplitAuthContext';
import { User, LogOut, ChevronDown } from 'lucide-react';

const UserProfile: React.FC = () => {
  const { user, logout } = useReplitAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-white hover:text-gray-200 transition-colors"
      >
        {user.profileImage ? (
          <img
            src={user.profileImage}
            alt={user.name}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <User className="h-8 w-8" />
        )}
        <span className="hidden md:block">{user.name}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 text-sm text-gray-700 border-b">
            <div className="font-medium">{user.name}</div>
            {user.bio && <div className="text-gray-500 text-xs">{user.bio}</div>}
          </div>
          <button
            onClick={logout}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
