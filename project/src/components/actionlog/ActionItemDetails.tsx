import React, { useState } from 'react';
import { ActionItem } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { TextArea } from '../ui/FormElements';
import { 
  CheckCircle, 
  Clock, 
  Calendar, 
  User, 
  MessageSquare, 
  Send, 
  FileUp, 
  AlertTriangle,
  X
} from 'lucide-react';
import { formatDate, formatDateTime } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';

interface ActionItemDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  actionItem: ActionItem;
  onStatusChange: (item: ActionItem, newStatus: 'initiated' | 'in_progress' | 'completed') => void;
  onAddOverdueReason: (item: ActionItem, reason: string) => void;
}

const ActionItemDetails: React.FC<ActionItemDetailsProps> = ({
  isOpen,
  onClose,
  actionItem,
  onStatusChange,
  onAddOverdueReason
}) => {
  const { addActionItemComment, connectionStatus } = useAppContext();
  const [comment, setComment] = useState('');
  const [overdueReason, setOverdueReason] = useState('');
  
  // Calculate overdue status
  const today = new Date();
  const dueDate = new Date(actionItem.dueDate);
  const isOverdue = today > dueDate && actionItem.status !== 'completed';
  const overdueBy = isOverdue ? Math.floor((today.getTime() - dueDate.getTime()) / (86400000)) : 0;
  const isOverdueBy10 = overdueBy >= 10;
  const needsReason = isOverdueBy10 && !actionItem.overdueReason && actionItem.status !== 'completed';
  
  // Handle adding a comment
  const handleAddComment = () => {
    if (!comment.trim()) return;
    
    addActionItemComment(actionItem.id, comment);
    setComment('');
  };
  
  // Handle adding overdue reason
  const handleSubmitOverdueReason = () => {
    if (!overdueReason.trim()) return;
    
    onAddOverdueReason(actionItem, overdueReason);
    setOverdueReason('');
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Action Item Details"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className={`p-4 rounded-lg ${
          actionItem.status === 'completed' ? 'bg-green-50 border border-green-200' :
          isOverdueBy10 ? 'bg-red-50 border border-red-200' :
          isOverdue ? 'bg-yellow-50 border border-yellow-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{actionItem.title}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  actionItem.status === 'completed' ? 'bg-green-100 text-green-800' :
                  actionItem.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {actionItem.status === 'in_progress' ? 'In Progress' : 
                   actionItem.status === 'completed' ? 'Completed' : 'Initiated'}
                </span>
                {isOverdue && actionItem.status !== 'completed' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Overdue by {overdueBy} days
                  </span>
                )}
              </div>
            </div>
            
            {actionItem.status !== 'completed' && (
              <Button
                size="sm"
                onClick={() => onStatusChange(
                  actionItem, 
                  actionItem.status === 'initiated' ? 'in_progress' : 'completed'
                )}
                icon={actionItem.status === 'initiated' ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                disabled={connectionStatus !== 'connected'}
              >
                {actionItem.status === 'initiated' ? 'Start' : 'Complete'}
              </Button>
            )}
          </div>
        </div>
        
        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Description</h4>
              <p className="mt-1">{actionItem.description}</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Responsible Person</p>
                <p className="font-medium">{actionItem.responsiblePerson}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Due Date</p>
                <p className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDate(actionItem.dueDate)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium">{formatDate(actionItem.startDate)}</p>
              </div>
            </div>
            
            {actionItem.completedAt && (
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="font-medium">{formatDateTime(actionItem.completedAt)}</p>
                  <p className="text-xs text-gray-500">by {actionItem.completedBy}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Overdue Reason */}
        {actionItem.overdueReason && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <h4 className="text-sm font-medium text-amber-800 mb-1">Overdue Reason:</h4>
            <p className="text-sm text-amber-700">{actionItem.overdueReason}</p>
          </div>
        )}
        
        {/* Overdue Reason Input for items overdue by 10+ days */}
        {needsReason && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start space-x-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Overdue Explanation Required</h4>
                <p className="text-sm text-red-700 mt-1">
                  This action item is overdue by 10+ days and requires an explanation.
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <TextArea
                label="Reason for Delay *"
                value={overdueReason}
                onChange={(e) => setOverdueReason(e.target.value)}
                placeholder="Explain why this action item is overdue..."
                rows={2}
              />
              
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSubmitOverdueReason}
                  disabled={!overdueReason.trim() || connectionStatus !== 'connected'}
                >
                  Save Reason
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Attachments */}
        {actionItem.attachments && actionItem.attachments.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments ({actionItem.attachments.length})</h4>
            <div className="space-y-2">
              {actionItem.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <FileUp className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">{attachment.filename}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(attachment.fileUrl, '_blank')}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Comments */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Comments ({actionItem.comments?.length || 0})
          </h4>
          
          {actionItem.comments && actionItem.comments.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              {actionItem.comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm">{comment.comment}</p>
                  <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                    <User className="w-3 h-3" />
                    <span>{comment.createdBy}</span>
                    <span>•</span>
                    <span>{formatDateTime(comment.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">No comments yet</p>
          )}
          
          {/* Add Comment */}
          <div className="flex space-x-2">
            <TextArea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              className="flex-1"
            />
            <Button
              onClick={handleAddComment}
              disabled={!comment.trim() || connectionStatus !== 'connected'}
              icon={<Send className="w-4 h-4" />}
              className="self-end"
            >
              Comment
            </Button>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            icon={<X className="w-4 h-4" />}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ActionItemDetails;