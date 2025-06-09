// coordinator/tcProcess.js

const {
  runTransaction,
  sendPrepareMessage,
  sendMessageToClients
} = require('./transactionCoordinator'); // Import the core 2PC functions

const TransactionRef = require('../shared/transactionRef'); // Needed if creating new TransactionRef

// 1. Add a Map to store transaction states in memory
const transactionStates = new Map(); // Map: transactionID -> { phase, participants: [...], outcome, ... }

const tcProcessInstance = {
  // Handles the 'prepare' phase, usually by contacting participants.
  // tcServer.js calls this via POST /prepare
  async prepare(transactionRef) {
    console.log(`tcProcess: Received prepare for ${transactionRef.transactionID}. Initiating prepare phase...`);
    const result = await sendPrepareMessage(transactionRef);

    // 3a. Update transaction state after prepare
    const currentTxState = transactionStates.get(transactionRef.transactionID);
    if (currentTxState) {
        currentTxState.phase = 'VOTING'; // Or 'PREPARE_ACK_RECEIVED'
        // Update participant votes and status based on result.votes
        // 'result.votes' might look like { 'Node One': 'yes', 'Node Two': 'no' }
        currentTxState.participants.forEach(p => {
            if (result.votes[p.name]) { // Check if a vote exists for this participant
                p.vote = result.votes[p.name]; // e.g., 'yes' or 'no'
                p.status = result.votes[p.name] === 'yes' ? 'prepared' : 'aborted';
            } else {
                p.status = 'no_response'; // Handle nodes that didn't respond
            }
        });
        // Optional: Broadcast this update via WebSocket
        // if (global.broadcastUpdate) { // Assuming broadcastUpdate is globally available or passed in
        //     global.broadcastUpdate('transactionUpdate', { transactionId: transactionRef.transactionID, status: currentTxState });
        // }
    }

    return result.success ? 'yes' : 'no'; // This is what tcServer.js expects from prepare
  },

  // Handles the 'begin transaction' request.
  // tcServer.js calls this via POST /begin
  async beginTransaction(transactionID) {
    console.log(`tcProcess: Beginning transaction ${transactionID}.`);
    // 3b. Initialize transaction state when it begins
    transactionStates.set(transactionID, {
        id: transactionID, // Store ID
        phase: 'PREPARE', // Initial phase
        startedAt: new Date().toISOString(), // Timestamp
        completedAt: null, // Will be set later
        outcome: 'PENDING', // Initial outcome
        participants: [ // Initialize participants (ensure names match your Node One/Two setup)
            { nodeId: 'node1', name: 'Node One', vote: null, status: 'pending' },
            { nodeId: 'node2', name: 'Node Two', vote: null, status: 'pending' },
            // Add other participant nodes if you have more
        ],
    });
    // Optional: Broadcast this update via WebSocket
    // if (global.broadcastUpdate) {
    //     global.broadcastUpdate('transactionUpdate', { transactionId, status: transactionStates.get(transactionID) });
    // }
  },

  // Handles incoming messages (COMMIT/ABORT decisions from Coordinator to Participants).
  // tcServer.js calls this via POST /message
  async sendMessage(message) {
    console.log(`tcProcess: Forwarding message to clients: ${JSON.stringify(message)}`);
    const transactionRef = new TransactionRef(message.transactionID);
    await sendMessageToClients(transactionRef, message);

    // 3c. Update transaction state after commit/abort message is sent
    const currentTxState = transactionStates.get(message.transactionID);
    if (currentTxState) {
        currentTxState.phase = message.type; // Will be 'COMMIT' or 'ABORT'
        currentTxState.completedAt = new Date().toISOString(); // Mark completion time
        currentTxState.outcome = message.type === 'COMMIT' ? 'COMMITTED' : 'ABORTED';

        currentTxState.participants.forEach(p => {
            p.status = message.type.toLowerCase(); // 'committed' or 'aborted'
        });
        // After final message, move to COMPLETE phase if you track that granularly
        currentTxState.phase = 'COMPLETE';

        // Optional: Broadcast this update via WebSocket
        // if (global.broadcastUpdate) {
        //     global.broadcastUpdate('transactionUpdate', { transactionId: message.transactionID, status: currentTxState });
        // }
    }
  },

  // 2. Add the getTransactionStatus method
  async getTransactionStatus(transactionID) {
    console.log(`tcProcess: Fetching status for transaction ${transactionID}`);
    const state = transactionStates.get(transactionID);
    // Return the stored state or null if not found
    return state || null;
  },

  // Optional: This method kicks off the entire 2PC from a client request (e.g., frontend button click)
  // tcServer.js /begin endpoint should likely call this.
  async runTransactionFromClient() {
    console.log("tcProcess: Client requested a new transaction. Running 2PC.");
    // This will create a new transaction ID internally and handle the full flow
    const result = await runTransaction(); // Calls the runTransaction from transactionCoordinator.js
    // After runTransaction completes, the state should already be updated by prepare/sendMessage
    return result; // Return outcome
  }
};

module.exports = tcProcessInstance; // Export the created instance