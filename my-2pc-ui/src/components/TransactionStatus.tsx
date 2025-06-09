import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { fetchTransactionStatus } from '../services/apiService';
import { TransactionPhase, NodeStatus } from '../types';
import { Link } from 'react-router-dom';

interface TransactionStatusProps {
  transactionId: string;
}

interface TransactionStatusData {
  phase: TransactionPhase;
  participants?: NodeStatus[]; // [{ nodeId, name, vote, status }]
}

const PHASES: { key: TransactionPhase, label: string, description: string }[] = [
  {
    key: 'PREPARE',
    label: 'Prepare Phase',
    description: 'Coordinator asks all participants if they can commit',
  },
  {
    key: 'VOTING',
    label: 'Voting Phase',
    description: 'Participants vote YES or NO based on their ability to commit',
  },
  {
    key: 'COMMIT',
    label: 'Commit Phase',
    description: 'Coordinator sends COMMIT to all participants',
  },
  {
    key: 'ABORT',
    label: 'Abort Phase',
    description: 'Coordinator sends ABORT to all participants',
  },
  {
    key: 'COMPLETE',
    label: 'Complete',
    description: 'Transaction is either committed or aborted on all participants',
  },
];

const getPhaseIndex = (phase: TransactionPhase) => {
  switch (phase) {
    case 'PREPARE': return 0;
    case 'VOTING': return 1;
    case 'COMMIT': return 2;
    case 'ABORT': return 2;
    case 'COMPLETE': return 4;
    default: return 0;
  }
};

const TransactionStatus: React.FC<TransactionStatusProps> = ({ transactionId }) => {
  const [statusData, setStatusData] = useState<TransactionStatusData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadStatus = async () => {
    setError(null);
    try {
      const data = await fetchTransactionStatus(transactionId);
      setStatusData(data);
      // Show toast if just completed
      if (data.phase === 'COMPLETE') {
        if (data.participants?.some(p => p.vote === 'NO' || p.status === 'aborted')) {
          setToast('Transaction Aborted');
        } else {
          setToast('Transaction Committed');
        }
      }
    } catch (err) {
      setError('Failed to fetch transaction status');
    } finally {
      setLoading(false);
    }
  };

  // Initial load and polling
  useEffect(() => {
    setLoading(true);
    loadStatus();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(loadStatus, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line
  }, [transactionId]);

  // Stop polling if transaction is complete
  useEffect(() => {
    if (statusData?.phase === 'COMPLETE' && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [statusData]);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Retry handler
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    loadStatus();
  };

  const currentPhaseIdx = getPhaseIndex(statusData?.phase || 'PREPARE');

  return (
    <section
      className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
      aria-labelledby="transaction-status-title"
      role="region"
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-blue-500" />
          <h2 id="transaction-status-title" className="text-lg font-medium text-gray-900 dark:text-white">
            Transaction Status
          </h2>
        </div>
        <Link
          to={`/history?highlight=${transactionId}`}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          View in History
        </Link>
      </div>
      <div className="p-4">
        <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          Transaction ID: <span className="font-mono">{transactionId}</span>
        </div>
        {toast && (
          <div
            className={`mb-4 px-4 py-2 rounded text-white font-semibold shadow
              ${toast.includes('Commit') ? 'bg-green-500' : 'bg-red-500'}`}
            role="alert"
            aria-live="polite"
          >
            {toast}
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="animate-spin h-6 w-6 text-blue-500 mr-2" />
            <span className="text-gray-700 dark:text-gray-300">Loading transaction status...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              <button
                onClick={handleRetry}
                className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Progress Bar / Phase Animation */}
            <div className="flex items-center justify-between mb-8">
              {PHASES.slice(0, 4).map((phase, idx) => (
                <React.Fragment key={phase.key}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-1
                        ${idx < currentPhaseIdx
                          ? 'bg-green-500 text-white'
                          : idx === currentPhaseIdx
                          ? 'bg-blue-500 text-white animate-pulse'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}
                      aria-current={idx === currentPhaseIdx ? 'step' : undefined}
                    >
                      {idx + 1}
                    </div>
                    <span className="text-xs text-center font-medium text-gray-900 dark:text-white">{phase.label}</span>
                  </div>
                  {idx < 3 && (
                    <div className="flex-1 h-1 bg-gray-300 dark:bg-gray-700 mx-2" />
                  )}
                </React.Fragment>
              ))}
            </div>
            {/* Phase Description */}
            <div className="text-center mb-6">
              <span className="text-base font-semibold text-gray-900 dark:text-white">
                {PHASES[currentPhaseIdx]?.label}
              </span>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {PHASES[currentPhaseIdx]?.description}
              </div>
            </div>
            {/* Per-Node Status Table */}
            {statusData?.participants && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700 rounded">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900">
                      <th className="px-2 py-1 text-left font-semibold">Node</th>
                      <th className="px-2 py-1 text-left font-semibold">Status</th>
                      <th className="px-2 py-1 text-left font-semibold">Vote</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusData.participants.map((p, idx) => (
                      <tr key={p.nodeId} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}>
                        <td className="px-2 py-1">{p.name}</td>
                        <td className="px-2 py-1">
                          {p.status === 'committed' ? (
                            <span className="inline-flex items-center text-green-600 dark:text-green-400">
                              <CheckCircle className="h-4 w-4 mr-1" /> Committed
                            </span>
                          ) : p.status === 'aborted' ? (
                            <span className="inline-flex items-center text-red-600 dark:text-red-400">
                              <XCircle className="h-4 w-4 mr-1" /> Aborted
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-gray-600 dark:text-gray-300">
                              <Clock className="h-4 w-4 mr-1" /> {p.status}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1">
                          {p.vote === 'YES' && (
                            <span className="text-green-600 dark:text-green-400 font-semibold">YES</span>
                          )}
                          {p.vote === 'NO' && (
                            <span className="text-red-600 dark:text-red-400 font-semibold">NO</span>
                          )}
                          {!p.vote && (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default TransactionStatus;
