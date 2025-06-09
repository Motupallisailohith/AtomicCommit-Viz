// C:\Users\sailo\my-2pc-ui\src\components\TransactionInitiator.tsx

import React, { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
// import { startTransaction } from '../services/apiService'; // Don't import if mocking

interface TransactionInitiatorProps {
  onTransactionStart: (id: string) => void;
}

const TransactionInitiator: React.FC<TransactionInitiatorProps> = ({ onTransactionStart }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartTransaction = async () => {
    setLoading(true);
    setError(null);

    // --- SHOWCASE MOCKING FOR LINKEDIN POST ---
    console.log('TRANSACTION INITIATOR DEBUG: Mocking transaction start for showcase.');
    const mockedTransactionId = `showcase-tx-${Date.now()}`;
    const mockedOutcome = Math.random() > 0.5 ? 'COMMITTED' : 'ABORTED'; // Randomly commit or abort for variety

    try {
      // Option A: Still call backend but override outcome for UI if it fails
      const actualTransactionId = await startTransaction(); // Still try to call backend
      console.log(`TRANSACTION INITIATOR DEBUG: Backend started ${actualTransactionId}, showing as ${mockedOutcome}.`);

      // Here, you'd trigger a *mocked* update to the transaction status
      // You'll need a way to pass this mocked outcome back to Dashboard/TransactionStatus
      // For simplicity, we can pass it via onTransactionStart, and Dashboard/TransactionStatus
      // can interpret a special ID or receive a direct status.

      // If you want to completely bypass backend for this button:
      // await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      onTransactionStart(actualTransactionId || mockedTransactionId); // Use actual ID if available, else mocked
      alert(`Showcase Transaction ${mockedTransactionId} ${mockedOutcome}! Check status.`);

    } catch (err) {
      // If backend call fails, fallback to pure frontend mock
      console.error('TRANSACTION INITIATOR DEBUG: Backend call failed. Falling back to full mock for showcase.', err);
      alert(`Showcase Transaction ${mockedTransactionId} ${mockedOutcome}! (Pure Frontend Mock)`);
      onTransactionStart(mockedTransactionId);
    } finally {
      setLoading(false);
    }
    // --- END SHOWCASE MOCKING ---
  };

  return (
    <div>
      <div className="flex items-center space-x-2 mb-4">
        <Play className="h-5 w-5 text-blue-500" />
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Start New Transaction</h2>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <button
          onClick={handleStartTransaction}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Initiating (Showcase)...
            </>
          ) : (
            <>Start New Transaction (Showcase)</>
          )}
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Initiates a new distributed transaction across all available participant nodes.
        </p>
      </div>

      {error && (
        <div className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};

export default TransactionInitiator;