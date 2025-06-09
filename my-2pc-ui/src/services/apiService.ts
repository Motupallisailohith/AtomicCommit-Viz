// C:\Users\sailo\my-2pc-ui\src\services\apiService.ts
import axios from 'axios';

// It's good practice to get base URLs from environment variables
// Make sure you have a .env file in your my-2pc-ui root (e.g., .env.development)
// with entries like: REACT_APP_TC_API_URL=http://localhost:9000
// If not using .env, hardcode these for now.
export const TC_API_URL = import.meta.env.VITE_TC_API_URL || 'http://localhost:8080';
// You might also need URLs for individual nodes if they are called directly from frontend
// const NODE_ONE_API_URL = import.meta.env.VITE_NODE_ONE_API_URL || 'http://localhost:9001';
// const NODE_TWO_API_URL = import.meta.env.VITE_NODE_TWO_API_URL || 'http://localhost:9002';

export const fetchCoordinatorStatus = async (): Promise<string> => {
  const response = await axios.get(`${TC_API_URL}/health`);
  return response.data.status;
};

// apiService.ts
// ...
export const fetchNodesStatus = async (): Promise<any[]> => {
  const response = await axios.get(`${TC_API_URL}/nodes/status`);
  // Assuming response.data.nodes contains objects with `id`, `name`, `status`, AND `url` property.
  // And `url` is the base URL for the node, e.g., "http://localhost:9001"
  return response.data.nodes.map((node: any) => ({
    id: node.id,
    name: node.name,
    status: node.status,
    healthUrl: `${node.url}/health` // Constructing healthUrl from the base 'url'
  }));
  // If your TC's /nodes/status already returns a 'healthUrl' directly, then just:
  // return response.data.nodes;
};
// ...
export const startTransaction = async (): Promise<string> => {
  const transactionID = `tx-${Date.now()}`;
  console.log('FRONTEND DEBUG: Attempting to start transaction:', transactionID);
  console.log('FRONTEND DEBUG: Calling TC at:', `${TC_API_URL}/begin`);
  try {
    const response = await axios.post(`${TC_API_URL}/begin`, { transactionID: transactionID });
    console.log('FRONTEND DEBUG: TC /begin response:', response.data);
    return transactionID;
  } catch (error) {
    console.error('FRONTEND DEBUG: Error starting transaction:', error);
    throw error; // Re-throw to propagate error to UI
  }
};

// C:\Users\sailo\my-2pc-ui\src\services\apiService.ts

// ... (existing code) ...

export const fetchTransactionHistory = async (): Promise<any[]> => { // Changed return type to any[] for simplicity
  // --- SHOWCASE MOCKING FOR LINKEDIN POST ---
  console.log('API SERVICE DEBUG: Mocking transaction history.');

  const now = Date.now();
  const history = [];

  for (let i = 0; i < 5; i++) { // Generate 5 recent transactions
      const id = `mock-tx-${now - (i * 1000 * 60 * 5)}`; // Unique ID
      const startedAt = new Date(now - (i * 1000 * 60 * 5) - 10000).toISOString();
      const outcome = i % 2 === 0 ? 'COMMITTED' : 'ABORTED';
      const completedAt = outcome !== 'PENDING' ? new Date(now - (i * 1000 * 60 * 5) - 5000).toISOString() : null;
      const phase = outcome === 'PENDING' ? 'PREPARE' : 'COMPLETE';

      history.push({
          id: id,
          startedAt: startedAt,
          completedAt: completedAt,
          phase: phase,
          outcome: outcome,
          participants: [
              { nodeId: 'node1', name: 'Node One', vote: outcome === 'COMMITTED' ? 'YES' : 'NO', status: outcome === 'COMMITTED' ? 'committed' : 'aborted' },
              { nodeId: 'node2', name: 'Node Two', vote: outcome === 'COMMITTED' ? 'YES' : 'NO', status: outcome === 'COMMITTED' ? 'committed' : 'aborted' },
          ],
      });
  }

  // Add one "pending" transaction at the top
  history.unshift({
      id: `mock-tx-pending-${now}`,
      startedAt: new Date(now - 10000).toISOString(),
      completedAt: null,
      phase: 'PREPARE',
      outcome: 'PENDING',
      participants: [
          { nodeId: 'node1', name: 'Node One', vote: null, status: 'pending' },
          { nodeId: 'node2', name: 'Node Two', vote: null, status: 'pending' },
      ],
  });

  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
  return history;

  // --- END SHOWCASE MOCKING ---

  // Original backend call (uncomment this and remove mock when ready for real backend)
  // const response = await axios.get(`${TC_API_URL}/transactions/history`);
  // return response.data;
};

// ... (existing code) ...
// C:\Users\sailo\my-2pc-ui\src\services\apiService.ts
// C:\Users\sailo\my-2pc-ui\src\services\apiService.ts

// ... (existing imports and code) ...

// Add an interface for the Message type if it's not already in types.ts
// interface Message {
//   from: string;
//   to: string;
//   type: string;
//   content: string;
//   timestamp: number;
// }

// ... (existing export consts) ...

// C:\Users\sailo\my-2pc-ui\src\services\apiService.ts
// ...
export const fetchTransactionMessages = async (): Promise<any[]> => {
  console.log('API SERVICE DEBUG: Mocking transaction messages for visualization.');

  const now = Date.now();
  const baseTime = now - 10000; // Start 10 seconds ago

  // Ensure timestamps are pure numbers and content is plain strings
  const mockedMessages = [
    { from: 'client', to: 'coordinator', type: 'INITIATE', content: 'Begin Transaction', timestamp: baseTime + 0 },
    { from: 'coordinator', to: 'node1', type: 'PREPARE', content: 'Can you commit?', timestamp: baseTime + 1000 },
    { from: 'coordinator', to: 'node2', type: 'PREPARE', content: 'Can you commit?', timestamp: baseTime + 1500 },
    { from: 'node1', to: 'coordinator', type: 'VOTE', content: 'YES', timestamp: baseTime + 3000 },
    { from: 'node2', to: 'coordinator', type: 'VOTE', content: 'YES', timestamp: baseTime + 3500 },
    { from: 'coordinator', to: 'node1', type: 'COMMIT', content: 'Global Commit', timestamp: baseTime + 5000 },
    { from: 'coordinator', to: 'node2', type: 'COMMIT', content: 'Global Commit', timestamp: baseTime + 5500 },
    { from: 'node1', to: 'coordinator', type: 'ACK', content: 'Committed', timestamp: baseTime + 7000 },
    { from: 'node2', to: 'coordinator', type: 'ACK', content: 'Committed', timestamp: baseTime + 7500 },
  ];
  // ... (rest of mocking logic) ...
  return mockedMessages;
};
// ...

// ... (existing export consts) ...
// ... (existing code) ...

export const fetchTransactionStatus = async (transactionId: string): Promise<any> => {
  // --- SHOWCASE MOCKING FOR LINKEDIN POST ---
  if (transactionId.startsWith('showcase-tx-')) {
    console.log(`API SERVICE DEBUG: Mocking status for showcase transaction: ${transactionId}`);
    // Return a fake, progressing status
    const phaseKeys = ['PREPARE', 'VOTING', 'COMMIT', 'COMPLETE'];
    const currentPhaseIndex = (Math.floor(Date.now() / 1000) % phaseKeys.length); // Cycle phases
    const currentPhase = phaseKeys[currentPhaseIndex];
    const outcome = currentPhase === 'COMPLETE' ? (Math.random() > 0.5 ? 'COMMITTED' : 'ABORTED') : 'PENDING';

    return {
      id: transactionId,
      phase: currentPhase,
      startedAt: new Date(Date.now() - 5000).toISOString(), // Started 5s ago
      completedAt: outcome !== 'PENDING' ? new Date().toISOString() : null,
      outcome: outcome,
      participants: [
        { nodeId: 'node1', name: 'Node One', vote: outcome === 'COMMITTED' ? 'YES' : (outcome === 'ABORTED' ? 'NO' : null), status: outcome === 'PENDING' ? 'pending' : (outcome === 'COMMITTED' ? 'committed' : 'aborted') },
        { nodeId: 'node2', name: 'Node Two', vote: outcome === 'COMMITTED' ? 'YES' : (outcome === 'ABORTED' ? 'NO' : null), status: outcome === 'PENDING' ? 'pending' : (outcome === 'COMMITTED' ? 'committed' : 'aborted') },
      ],
    };
  }
  // --- END SHOWCASE MOCKING ---

  // Original backend call
  const response = await axios.get(`${TC_API_URL}/transactions/${transactionId}/status`);
  return response.data;
};

// ... (rest of your apiService.ts code) ...
export const subscribeToUpdates = (callback: (data: any) => void) => {
    // Your Dashboard.tsx uses useWebSocket, so this function might not be directly used for real-time updates.
    // It could be for a polling mechanism, or simply a placeholder.
    // If it was for WebSockets, it would typically create a new WebSocket instance.
    // For now, return an empty function.
    console.warn("subscribeToUpdates called, but its implementation is missing in apiService.ts. Check if useWebSocket hook is the primary update mechanism.");
    return () => {}; // Return an unsubscribe function
};