import React, { useState, useEffect } from 'react';
import { History, Loader2, CheckCircle, XCircle, Search, Eye } from 'lucide-react';
import { fetchTransactionHistory, fetchTransactionStatus } from '../services/apiService';
import { TransactionPhase } from '../types';

interface TransactionSummary {
  id: string;
  startedAt: string;
  completedAt: string | null;
  phase: TransactionPhase;
  outcome: 'COMMITTED' | 'ABORTED' | 'PENDING';
  participants: Array<{
    nodeId: string;
    name: string;
    vote?: 'YES' | 'NO';
    status: string;
  }>;
}

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<TransactionSummary | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTransactionHistory();
        setTransactions(data);
      } catch (err) {
        setError('Failed to fetch transaction history');
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  // Optional: fetch details if you want to show more info in modal
  const handleViewDetails = async (tx: TransactionSummary) => {
    setDetailsLoading(true);
    try {
      // Optionally, fetch more up-to-date details
      const details = await fetchTransactionStatus(tx.id);
      setSelected({ ...tx, ...details });
    } catch {
      setSelected(tx);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filtered = transactions.filter(tx =>
    tx.id.toLowerCase().includes(search.toLowerCase())
    || tx.participants.some(p => p.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-terminal-bg p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8 space-x-3">
          <History className="w-7 h-7 text-terminal-accent" />
          <h1 className="text-2xl font-bold text-terminal-text">Transaction History</h1>
        </div>
        <div className="mb-6 flex items-center space-x-2">
          <Search className="w-5 h-5 text-terminal-muted" />
          <input
            type="text"
            placeholder="Search by transaction ID or node..."
            className="px-3 py-2 border border-terminal-border rounded bg-terminal-highlight text-terminal-text focus:outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin h-6 w-6 text-terminal-accent mr-2" />
            <span className="text-terminal-muted">Loading transactions...</span>
          </div>
        ) : error ? (
          <div className="bg-terminal-error/20 text-terminal-error p-4 rounded">{error}</div>
        ) : (
          <div className="overflow-x-auto bg-terminal-highlight rounded border border-terminal-border">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-terminal-header-bg">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Started</th>
                  <th className="px-4 py-2 text-left">Completed</th>
                  <th className="px-4 py-2 text-left">Outcome</th>
                  <th className="px-4 py-2 text-left">Participants</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-terminal-muted">
                      No transactions found.
                    </td>
                  </tr>
                )}
                {filtered.map(tx => (
                  <tr key={tx.id} className="border-b border-terminal-border last:border-0">
                    <td className="px-4 py-2 font-mono">{tx.id}</td>
                    <td className="px-4 py-2">{new Date(tx.startedAt).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      {tx.completedAt ? new Date(tx.completedAt).toLocaleString() : <span className="text-terminal-warning">Pending</span>}
                    </td>
                    <td className="px-4 py-2">
                      {tx.outcome === 'COMMITTED' && (
                        <span className="inline-flex items-center text-terminal-success font-semibold">
                          <CheckCircle className="w-4 h-4 mr-1" /> Committed
                        </span>
                      )}
                      {tx.outcome === 'ABORTED' && (
                        <span className="inline-flex items-center text-terminal-error font-semibold">
                          <XCircle className="w-4 h-4 mr-1" /> Aborted
                        </span>
                      )}
                      {tx.outcome === 'PENDING' && (
                        <span className="inline-flex items-center text-terminal-warning font-semibold">
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {tx.participants.map(p => (
                        <span
                          key={p.nodeId}
                          className={`inline-block px-2 py-0.5 rounded mr-1 text-xs font-mono ${
                            p.vote === 'YES'
                              ? 'bg-terminal-success/20 text-terminal-success'
                              : p.vote === 'NO'
                              ? 'bg-terminal-error/20 text-terminal-error'
                              : 'bg-terminal-warning/20 text-terminal-warning'
                          }`}
                        >
                          {p.name}: {p.vote || '-'}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleViewDetails(tx)}
                        className="inline-flex items-center text-terminal-accent hover:underline text-sm"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 mr-1" /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Transaction Details Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-terminal-bg border border-terminal-border rounded-lg p-6 max-w-xl w-full relative">
              <button
                onClick={() => setSelected(null)}
                className="absolute top-2 right-2 text-terminal-accent hover:text-terminal-error"
                title="Close"
              >
                ×
              </button>
              <h2 className="text-xl font-bold mb-4">Transaction Details</h2>
              {detailsLoading ? (
                <div className="flex items-center py-8 justify-center">
                  <Loader2 className="animate-spin h-6 w-6 text-terminal-accent mr-2" />
                  <span className="text-terminal-muted">Loading details...</span>
                </div>
              ) : (
                <>
                  <div className="mb-2 text-sm">
                    <span className="font-semibold">ID:</span> <span className="font-mono">{selected.id}</span>
                  </div>
                  <div className="mb-2 text-sm">
                    <span className="font-semibold">Started:</span> {new Date(selected.startedAt).toLocaleString()}
                  </div>
                  <div className="mb-2 text-sm">
                    <span className="font-semibold">Completed:</span> {selected.completedAt ? new Date(selected.completedAt).toLocaleString() : <span className="text-terminal-warning">Pending</span>}
                  </div>
                  <div className="mb-2 text-sm">
                    <span className="font-semibold">Phase:</span> {selected.phase}
                  </div>
                  <div className="mb-4 text-sm">
                    <span className="font-semibold">Outcome:</span>{' '}
                    {selected.outcome === 'COMMITTED' && (
                      <span className="text-terminal-success font-semibold">Committed</span>
                    )}
                    {selected.outcome === 'ABORTED' && (
                      <span className="text-terminal-error font-semibold">Aborted</span>
                    )}
                    {selected.outcome === 'PENDING' && (
                      <span className="text-terminal-warning font-semibold">Pending</span>
                    )}
                  </div>
                  <div className="mb-2 font-semibold">Participants:</div>
                  <div className="mb-2">
                    {selected.participants.map(p => (
                      <div key={p.nodeId} className="flex items-center text-sm mb-1">
                        <span className="font-mono mr-2">{p.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold mr-2 ${
                            p.vote === 'YES'
                              ? 'bg-terminal-success/20 text-terminal-success'
                              : p.vote === 'NO'
                              ? 'bg-terminal-error/20 text-terminal-error'
                              : 'bg-terminal-warning/20 text-terminal-warning'
                          }`}
                        >
                          {p.vote || '-'}
                        </span>
                        <span className="text-terminal-muted">{p.status}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
