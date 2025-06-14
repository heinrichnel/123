import React, { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { Globe, Clock, Code, GitBranch, CheckCircle, Upload } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';

interface DeploymentStatusProps {
  className?: string;
}

const DeploymentStatus: React.FC<DeploymentStatusProps> = ({ className = '' }) => {
  const [deploymentInfo, setDeploymentInfo] = useState({
    status: 'success',
    url: 'https://matanuska-491ad.web.app',
    deployedAt: new Date().toISOString(),
    version: '1.0.0',
    branch: 'main',
    commitHash: '8f7e9d3',
    deployedBy: 'Automated Deployment'
  });
  
  return (
    <Card className={className}>
      <CardHeader 
        title="Deployment Status" 
        icon={<Globe className="w-5 h-5 text-blue-600" />}
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(deploymentInfo.url, '_blank')}
            icon={<Upload className="w-4 h-4" />}
          >
            Visit Site
          </Button>
        }
      />
      <CardContent>
        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-lg font-medium text-green-700">Deployed Successfully</span>
            </div>
            <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
              Live
            </span>
          </div>
          
          {/* Deployment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-3">
              <Globe className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-500">Deployment URL</p>
                <a 
                  href={deploymentInfo.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline"
                >
                  {deploymentInfo.url}
                </a>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-500">Deployed At</p>
                <p className="font-medium">{formatDateTime(deploymentInfo.deployedAt)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Code className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-500">Version</p>
                <p className="font-medium">{deploymentInfo.version}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <GitBranch className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-500">Branch / Commit</p>
                <p className="font-medium">
                  {deploymentInfo.branch} ({deploymentInfo.commitHash.substring(0, 7)})
                </p>
              </div>
            </div>
          </div>
          
          {/* Firebase Hosting Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Firebase Hosting</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Project ID: matanuska-491ad</p>
              <p>• Hosting Channel: live</p>
              <p>• Cache Control: max-age=31536000 for static assets</p>
              <p>• Custom Domain: Not configured</p>
            </div>
          </div>
          
          {/* Firestore Info */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-sm font-medium text-green-800 mb-2">Firestore Database</h4>
            <div className="text-sm text-green-700 space-y-1">
              <p>• Status: Active</p>
              <p>• Location: us-central</p>
              <p>• Mode: Native</p>
              <p>• Collections: trips, diesel, missedLoads, systemConfig, activityLogs</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeploymentStatus;