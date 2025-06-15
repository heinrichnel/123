
import React from 'react';
import { useReplitAuth } from '../../context/ReplitAuthContext';
import Button from '../ui/Button';
import { Truck, LogIn } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login, isLoading } = useReplitAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Truck className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Transport Management System
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in with your Replit account to continue
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <Button
            onClick={login}
            disabled={isLoading}
            className="w-full flex justify-center items-center space-x-2"
          >
            <LogIn className="h-5 w-5" />
            <span>Log in with Replit</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
