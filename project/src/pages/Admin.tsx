import React from 'react';
import { useAppContext } from '../context/AppContext';
import SystemCostConfiguration from '../components/admin/SystemCostConfiguration';
import FirestoreStatus from '../components/admin/FirestoreStatus';
import DeploymentStatus from '../components/admin/DeploymentStatus';
import SyncStatus from '../components/ui/SyncStatus';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Settings, Database, Globe, Shield, Users, Key } from 'lucide-react';

const Admin: React.FC = () => {
  const { connectionStatus } = useAppContext();
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-lg text-gray-600 mt-2">System configuration and monitoring</p>
        </div>
      </div>
      
      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Connection Status</p>
                <p className={`text-xl font-bold ${
                  connectionStatus === 'connected' ? 'text-green-600' : 
                  connectionStatus === 'reconnecting' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {connectionStatus === 'connected' ? 'Online' : 
                   connectionStatus === 'reconnecting' ? 'Reconnecting' : 'Offline'}
                </p>
              </div>
              <Database className={`w-8 h-8 ${
                connectionStatus === 'connected' ? 'text-green-500' : 
                connectionStatus === 'reconnecting' ? 'text-yellow-500' : 'text-red-500'
              }`} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Deployment</p>
                <p className="text-xl font-bold text-green-600">Live</p>
                <p className="text-xs text-gray-400">matanuska-491ad.web.app</p>
              </div>
              <Globe className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Security</p>
                <p className="text-xl font-bold text-blue-600">Development Mode</p>
                <p className="text-xs text-gray-400">Open access</p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Firestore Status */}
        <FirestoreStatus />
        
        {/* Deployment Status */}
        <DeploymentStatus />
      </div>
      
      {/* System Cost Configuration */}
      <SystemCostConfiguration
        userRole="admin"
        onUpdateRates={(currency, rates) => {
          console.log(`Updated ${currency} rates:`, rates);
        }}
      />
      
      {/* Sync Status */}
      <SyncStatus className="mt-6" />
      
      {/* Security Settings */}
      <Card>
        <CardHeader 
          title="Security Settings" 
          icon={<Shield className="w-5 h-5 text-blue-600" />}
        />
        <CardContent>
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex items-start space-x-3">
                <Key className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Development Security Mode</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    The application is currently running in development mode with open security rules. 
                    For production deployment, implement proper authentication and secure Firestore rules.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-800 mb-2">Firestore Rules</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                  {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access for development
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
                </pre>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-800 mb-2">User Management</h4>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">Authentication</span>
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    Not Configured
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Users className="w-4 h-4" />}
                  disabled={true}
                >
                  Configure Authentication
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;