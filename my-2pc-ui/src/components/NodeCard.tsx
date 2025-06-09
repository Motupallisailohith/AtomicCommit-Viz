import React, { useState } from 'react';
import { Server, AlertCircle, CheckCircle, Zap, RefreshCw, BookOpen } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import { Node } from '../types';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface NodeCardProps {
  node: Node;
  logs?: any[];
  onStatusChange?: () => void;
}

const NodeCard: React.FC<NodeCardProps> = ({ node, logs = [], onStatusChange }) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'online':
      case 'healthy':
      case 'ready':
        return {
          bg: 'bg-terminal-success/20',
          text: 'text-terminal-success',
          icon: <CheckCircle className="h-4 w-4 text-terminal-success" />
        };
      case 'unavailable':
      case 'offline':
      case 'error':
        return {
          bg: 'bg-terminal-error/20',
          text: 'text-terminal-error',
          icon: <AlertCircle className="h-4 w-4 text-terminal-error" />
        };
      default:
        return {
          bg: 'bg-terminal-warning/20',
          text: 'text-terminal-warning',
          icon: <AlertCircle className="h-4 w-4 text-terminal-warning" />
        };
    }
  };

  const statusStyle = getStatusColor(node.status);
// NodeCard.tsx (inside NodeCard component)

const handleRefresh = async () => {
  setActionLoading(true);
  if (!node.healthUrl) { // Also ensure healthUrl is defined for refresh
      console.error("Node's healthUrl is undefined, cannot refresh node status.");
      alert("Node URL not found. Cannot refresh status.");
      setActionLoading(false);
      return;
  }
  if (onStatusChange) {
      await onStatusChange();
  } else {
      console.warn("No onStatusChange prop provided to NodeCard for direct refresh.");
  }
  setActionLoading(false);
};

  // NodeCard.tsx (inside NodeCard component)

const handleCrashToggle = async () => {
  setActionLoading(true);
  try {
    // Ensure node.healthUrl is defined before using it
    if (!node.healthUrl) {
        console.error("Node's healthUrl is undefined, cannot simulate crash.");
        alert("Node URL not found. Cannot toggle crash state.");
        setActionLoading(false);
        return;
    }

    // Construct the base URL for the node by removing '/health' from healthUrl
    // Example: "http://localhost:9001/health" becomes "http://localhost:9001"
    const baseUrl = node.healthUrl.replace('/health', '');

    // Send the POST request to the correct backend node's simulateCrash endpoint
    await axios.post(`${baseUrl}/simulateCrash`, { enabled: node.status !== 'offline' });

    if (onStatusChange) onStatusChange();
  } catch (err) {
    alert("Failed to toggle crash state.");
  }
  setActionLoading(false);
};

  return (
    <div className="bg-terminal-highlight border border-terminal-border rounded-lg overflow-hidden hover:border-terminal-accent transition-colors duration-300 shadow relative">
      <div className="p-4 border-b border-terminal-border">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Server className="h-5 w-5 text-terminal-accent" />
            <h3 className="font-medium text-terminal-text">{node.name}</h3>
          </div>
          <div className={`${statusStyle.bg} ${statusStyle.text} text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center`}>
            {statusStyle.icon}
            <span className="ml-1">{node.status}</span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <dl className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-terminal-muted">ID:</dt>
            <dd className="font-mono text-terminal-text">{node.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-terminal-muted">Last Updated:</dt>
            <dd className="text-terminal-text">Just now</dd>
          </div>
        </dl>
        <div className="mt-3 flex space-x-2 items-center">
          <Link
            to={`/nodes/${node.id}`}
            className="text-sm font-medium text-terminal-accent hover:underline"
            data-tooltip-id="node-detail-tip"
            data-tooltip-content="View detailed status and logs"
          >
            View Details
          </Link>
          <button
            data-tooltip-id="node-action-tip"
            data-tooltip-content={node.status === 'offline' ? "Recover this node" : "Simulate a crash on this node"}
            className={`inline-flex items-center text-sm font-medium rounded px-2 py-1 transition-colors
              ${node.status === 'offline' ? 'bg-terminal-success text-white hover:bg-terminal-success/80' : 'bg-terminal-error text-white hover:bg-terminal-error/80'}
              ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={handleCrashToggle}
            disabled={actionLoading}
            title={node.status === 'offline' ? "Recover Node" : "Simulate Crash"}
          >
            {node.status === 'offline' ? <RefreshCw className="h-4 w-4 mr-1" /> : <Zap className="h-4 w-4 mr-1" />}
            {node.status === 'offline' ? "Recover" : "Crash"}
          </button>
          <button
            data-tooltip-id="node-refresh-tip"
            data-tooltip-content="Refresh node status"
            className="inline-flex items-center text-sm font-medium rounded px-2 py-1 bg-terminal-highlight border border-terminal-border hover:bg-terminal-accent/10 transition-colors"
            onClick={handleRefresh} // This is the line that was causing the error
            disabled={actionLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${actionLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onMouseEnter={() => setShowPopover(true)}
            onMouseLeave={() => setShowPopover(false)}
            className="inline-flex items-center text-sm font-medium rounded px-2 py-1 bg-terminal-highlight border border-terminal-border hover:bg-terminal-accent/10 transition-colors"
            data-tooltip-id="node-log-preview-tip"
            data-tooltip-content="Quick log preview"
          >
            <BookOpen className="h-4 w-4 mr-1" />
            Preview Logs
            {showPopover && (
              <div className="absolute z-20 left-0 top-full mt-2 bg-terminal-highlight border border-terminal-border rounded p-2 shadow-lg w-64">
                <div className="font-bold mb-1">Recent Logs</div>
                <ul className="text-xs max-h-32 overflow-y-auto">
                  {(logs || []).slice(-3).map((log, i) => (
                    <li key={i}>
                      <span className="text-terminal-muted">{log.timestamp || log.time}:</span> {log.event}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center text-sm font-medium rounded px-2 py-1 bg-terminal-highlight border border-terminal-border hover:bg-terminal-accent/10 transition-colors"
            data-tooltip-id="node-log-modal-tip"
            data-tooltip-content="View all logs in modal"
          >
            <BookOpen className="h-4 w-4 mr-1" />
            View Full Logs
          </button>
        </div>
      </div>
      <Tooltip id="node-detail-tip" place="top" />
      <Tooltip id="node-action-tip" place="top" />
      <Tooltip id="node-refresh-tip" place="top" />
      <Tooltip id="node-log-preview-tip" place="top" />
      <Tooltip id="node-log-modal-tip" place="top" />
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-bg border border-terminal-border rounded-lg p-6 max-w-lg w-full relative">
            <h2 className="text-lg font-bold mb-4">Logs for {node.name}</h2>
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-2 right-2 text-terminal-accent"
            >
              Close
            </button>
            <ul className="text-xs max-h-96 overflow-y-auto">
              {(logs || []).map((log, i) => (
                <li key={i}>
                  <span className="text-terminal-muted">{log.timestamp || log.time}:</span> {log.event}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default NodeCard;