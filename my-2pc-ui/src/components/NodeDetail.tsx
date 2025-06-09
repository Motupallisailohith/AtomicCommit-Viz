import React, { useState, useEffect } from 'react';
import { Server, AlertTriangle, RefreshCw, Power, Activity, Database, Clock, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
// Removed TC_API_URL import as direct node URLs are used here
// import { TC_API_URL } from '../services/apiService'; // Not directly used in this pattern
import { Node } from '../types'; // Add this for clarity and type-safety

interface NodeDetailProps {
  nodeId: string;
}

interface NodeState {
  status: string;
  uptime: string;
  lastTransaction: string;
  pendingTransactions: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    disk: number;
  };
  logs: Array<{
    timestamp: string;
    level: string;
    message: string;
  }>;
}

// Helper to determine the base URL for a given node ID
// This assumes you have Node One on 9001 and Node Two on 9002
// You might need to ensure 'constants' are available or hardcode these.
const getNodeBaseUrl = (id: string): string => {
    // These ports should match your backend NodeOne/NodeTwo server configurations
    const NODE_ONE_PORT = 9001;
    const NODE_TWO_PORT = 9002;
    const LOCAL_HOST = '127.0.0.1'; // Or 'localhost'

    if (id === 'node1') return `http://${LOCAL_HOST}:${NODE_ONE_PORT}`;
    if (id === 'node2') return `http://${LOCAL_HOST}:${NODE_TWO_PORT}`;
    // Add more cases if you have additional participant nodes
    console.error(`Attempted to get URL for unknown node ID: ${id}`);
    return ''; // Return empty string for unknown node IDs
};


const NodeDetail: React.FC<NodeDetailProps> = ({ nodeId }) => {
  const [nodeState, setNodeState] = useState<NodeState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchNodeState = async () => {
    const baseUrl = getNodeBaseUrl(nodeId);
    if (!baseUrl) {
        setError(`Node URL not found for ID: ${nodeId}. Cannot fetch state.`);
        setLoading(false);
        return;
    }
    try {
      // Corrected API endpoint: Assuming NodeOne/Two serves its state at /transactions/:id
      // (as per your p1Server/p2server.js get '/transactions/:id' route)
      const response = await axios.get(`${baseUrl}/transactions/${nodeId}`);
      setNodeState(response.data);
      setError(null);
    } catch (err) {
      console.error(`Error fetching node state for ${nodeId}:`, err);
      setError(`Failed to fetch node state for ${nodeId}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodeState();
    const interval = setInterval(fetchNodeState, 5000);
    return () => clearInterval(interval);
  }, [nodeId]); // Re-fetch if nodeId changes

  const simulateCrash = async () => {
    setActionLoading(true);
    const baseUrl = getNodeBaseUrl(nodeId);
    if (!baseUrl) {
        setError(`Node URL not found for ID: ${nodeId}. Cannot simulate crash.`);
        setActionLoading(false);
        return;
    }
    try {
      // Corrected API endpoint: Assuming NodeOne/Two serves simulateCrash at /simulateCrash
      // (as per your p1Server/p2server.js post '/simulateCrash' route)
      await axios.post(`${baseUrl}/simulateCrash`, { enabled: nodeState?.status !== 'offline' });
      setToast('Crash simulated successfully.');
      await fetchNodeState(); // Refresh state after action
    } catch (err) {
      console.error(`Error simulating crash for ${nodeId}:`, err);
      setError(`Failed to simulate crash for ${nodeId}`);
    } finally {
      setActionLoading(false);
    }
  };

  const restartNode = async () => {
    setActionLoading(true);
    const baseUrl = getNodeBaseUrl(nodeId);
    if (!baseUrl) {
        setError(`Node URL not found for ID: ${nodeId}. Cannot restart.`);
        setActionLoading(false);
        return;
    }
    try {
      // Corrected API endpoint: Assuming NodeOne/Two serves restart at /restart
      // (You need to add this route to p1Server.js/p2server.js if it doesn't exist)
      await axios.post(`${baseUrl}/restart`); // This route might need to be added to NodeOne/Two servers
      setToast('Node restarted successfully.');
      await fetchNodeState(); // Refresh state after action
    } catch (err) {
      console.error(`Error restarting node ${nodeId}:`, err);
      setError(`Failed to restart node ${nodeId}`);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]); // Clear toast after 3 seconds

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-terminal-bg">
        <RefreshCw className="w-8 h-8 text-terminal-accent animate-spin" />
      </div>
    );
  }

  // If nodeState is null (e.g., after an error), display error message or fallback
  if (!nodeState && !loading && error) {
      return (
          <div className="min-h-screen bg-terminal-bg p-6">
              <div className="max-w-7xl mx-auto">
                  <Link to="/" className="text-terminal-accent hover:underline flex items-center mb-4">
                      <ArrowLeft className="w-5 h-5 mr-1" /> Back
                  </Link>
                  <div className="bg-terminal-error/20 text-terminal-error p-4 rounded" role="alert">
                      Error: {error}
                  </div>
              </div>
          </div>
      );
  } else if (!nodeState && !loading) {
      // Fallback if no error but no data (e.g., 404 from backend)
      return (
          <div className="min-h-screen bg-terminal-bg p-6">
              <div className="max-w-7xl mx-auto">
                  <Link to="/" className="text-terminal-accent hover:underline flex items-center mb-4">
                      <ArrowLeft className="w-5 h-5 mr-1" /> Back
                  </Link>
                  <div className="bg-terminal-warning/20 text-terminal-warning p-4 rounded" role="alert">
                      Node data not found or inaccessible.
                  </div>
              </div>
          </div>
      );
  }


  return (
    <div className="min-h-screen bg-terminal-bg p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Link to="/" className="text-terminal-accent hover:underline flex items-center">
              <ArrowLeft className="w-5 h-5 mr-1" /> Back
            </Link>
            <Server className="w-8 h-8 text-terminal-accent" />
            <h1 className="text-2xl font-bold text-terminal-text">Node Details: {nodeId}</h1>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={restartNode}
              className="px-4 py-2 bg-terminal-highlight text-terminal-text rounded hover:bg-terminal-accent hover:text-terminal-bg transition-colors"
              disabled={actionLoading}
              title="Restart Node"
            >
              <Power className="w-4 h-4 inline mr-2" />
              Restart Node
            </button>
            <button
              onClick={simulateCrash}
              className="px-4 py-2 bg-terminal-error/20 text-terminal-error rounded hover:bg-terminal-error hover:text-terminal-bg transition-colors"
              disabled={actionLoading}
              title="Simulate Crash"
            >
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              Simulate Crash
            </button>
          </div>
        </div>

        {toast && (
          <div className="mb-4 px-4 py-2 rounded bg-terminal-success/20 text-terminal-success" aria-live="polite">
            {toast}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-terminal-error/20 text-terminal-error rounded" aria-live="polite">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Status */}
          <div className="bg-terminal-highlight rounded p-6 border border-terminal-border">
            <h2 className="text-lg font-semibold text-terminal-text mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-terminal-accent" />
              Status
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-terminal-muted">Current Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  nodeState?.status === 'Online' 
                    ? 'bg-terminal-success/20 text-terminal-success'
                    : 'bg-terminal-error/20 text-terminal-error'
                }`}>
                  {nodeState?.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-terminal-muted">Uptime:</span>
                <span className="text-terminal-text">{nodeState?.uptime}</span>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="bg-terminal-highlight rounded p-6 border border-terminal-border">
            <h2 className="text-lg font-semibold text-terminal-text mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2 text-terminal-accent" />
              Resources
            </h2>
            <div className="space-y-4">
              {nodeState?.resourceUsage && Object.entries(nodeState.resourceUsage).map(([resource, usage]) => (
                <div key={resource} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-terminal-muted capitalize">{resource}:</span>
                    <span className="text-terminal-text">{usage}%</span>
                  </div>
                  <div className="w-full bg-terminal-border rounded-full h-2">
                    <div 
                      className="bg-terminal-accent rounded-full h-2"
                      style={{ width: `${usage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-terminal-highlight rounded p-6 border border-terminal-border">
            <h2 className="text-lg font-semibold text-terminal-text mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-terminal-accent" />
              Transactions
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-terminal-muted">Last Transaction:</span>
                <span className="text-terminal-text">{nodeState?.lastTransaction}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-terminal-muted">Pending:</span>
                <span className="text-terminal-text">{nodeState?.pendingTransactions}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-terminal-highlight rounded p-6 border border-terminal-border">
          <h2 className="text-lg font-semibold text-terminal-text mb-4">Node Logs</h2>
          <div className="font-mono text-sm max-h-96 overflow-y-auto">
            {nodeState?.logs.map((log, index) => (
              <div 
                key={index}
                className="py-2 border-b border-terminal-border last:border-0 flex items-center"
              >
                <span className="text-terminal-muted mr-2">{log.timestamp}</span>
                <span className={`mx-2 px-2 py-0.5 rounded text-xs ${
                  log.level === 'ERROR' 
                    ? 'bg-terminal-error/20 text-terminal-error'
                    : log.level === 'WARN'
                    ? 'bg-terminal-warning/20 text-terminal-warning'
                    : 'bg-terminal-success/20 text-terminal-success'
                }`}>
                  {log.level}
                </span>
                <span className="text-terminal-text">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeDetail;