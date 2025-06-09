// coordinator/tcServer.js

const express = require('express');
const cors = require('cors');
const constants = require('../constants.js');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios'); // Ensure axios is installed in your coordinator folder (npm install axios)

// Ensure tcProcess is correctly imported.
// This assumes 'tcProcess.js' exists in the same directory and exports the expected methods.
const tcProcess = require(path.resolve(__dirname, './tcProcess'));

// --- EXPRESS APP SETUP ---
const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for frontend integration

// --- HTTP SERVER AND WEBSOCKET SERVER SETUP ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set(); // Stores connected WebSocket clients

wss.on('connection', ws => {
    console.log('Frontend client connected via WebSocket!');
    clients.add(ws);

    ws.on('message', message => {
        console.log(`Received WebSocket message from client: ${message}`);
        // You can add logic here to handle messages from the frontend if needed
    });

    ws.on('close', () => {
        console.log('Frontend client disconnected from WebSocket.');
        clients.delete(ws);
    });

    ws.on('error', error => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
    });
});

// Function to broadcast updates to all connected WebSocket clients
const broadcastUpdate = (type, payload) => {
    const message = JSON.stringify({ type, payload });
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
};

// You might want to export or pass `broadcastUpdate` to `tcProcess`
// if tcProcess is responsible for sending real-time updates based on 2PC events.
// For example: tcProcess.init(broadcastUpdate);
// Or if you want to make it global (less recommended but quick for demo):
// global.broadcastUpdate = broadcastUpdate;


// --- API ENDPOINTS ---

/**
 * Health check endpoint
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({ status: 'Transaction Coordinator is healthy' });
});

/**
 * Endpoint to get status of all participant nodes
 * GET /nodes/status  <-- REQUIRED BY YOUR FRONTEND
 * This endpoint will now return the base 'url' for each node.
 */
const participantNodes = [
  // CORRECTED URL SYNTAX (no <span> or math-inline artifacts)
  { id: 'node1', name: 'Node One', url: `http://${constants.LOCAL_HOST}:${constants.N1_SERVER_PORT}` },
  { id: 'node2', name: 'Node Two', url: `http://${constants.LOCAL_HOST}:${constants.N2_SERVER_PORT}` },
];

app.get('/nodes/status', async (req, res) => {
    const statuses = [];
    for (const node of participantNodes) {
        try {
            const response = await axios.get(`${node.url}/health`);
            const isHealthy = response.data.status && response.data.status.includes('healthy');
            statuses.push({
                id: node.id,
                name: node.name,
                status: isHealthy ? 'online' : 'unhealthy',
                url: node.url // This 'url' is now the correctly evaluated string
            });
        } catch (err) {
            // If the node is unreachable, treat it as offline
            statuses.push({
                id: node.id,
                name: node.name,
                status: 'offline',
                url: node.url // Still include the URL even if offline
            });
        }
    }
    console.log('TC SERVER DEBUG: Sending nodes status:', JSON.stringify(statuses, null, 2));
    res.json({ nodes: statuses });
});


/**
 * Prepare phase endpoint
 * POST /prepare
 * Body: { transactionRef }
 */
app.post('/prepare', async (req, res) => {
  try {
    const { transactionRef } = req.body;
    if (!transactionRef) {
      return res.status(400).json({ error: 'Missing transactionRef in request' });
    }
    const ack = await tcProcess.prepare(transactionRef);
    res.json({ ack });
  } catch (err) {
    console.error('Error in /prepare:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Begin transaction endpoint (initiates the 2PC process)
 * POST /begin
 * Body: { transactionID }
 */
app.post('/begin', async (req, res) => {
  try {
    const { transactionID } = req.body;
    if (!transactionID) {
      return res.status(400).json({ error: 'Missing transactionID in request' });
    }
    // First, begin the transaction in tcProcess to initialize its state
    await tcProcess.beginTransaction(transactionID);

    // Then, run the full 2PC process from tcProcess (which calls transactionCoordinator)
    const transactionResult = await tcProcess.runTransactionFromClient();
    
    res.json({ status: 'begun', outcome: transactionResult?.outcome });
  } catch (err) {
    console.error('Error in /begin:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Message endpoint (for protocol messages from participants)
 * POST /message
 * Body: { message }
 */
app.post('/message', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Missing message in request' });
    }
    await tcProcess.sendMessage(message);
    res.json({ status: 'message received' });
  } catch (err) {
    console.error('Error in /message:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- NEW ROUTE: Get specific transaction status (REQUIRED BY FRONTEND) ---
/**
 * Get specific transaction status
 * GET /transactions/:id/status
 */
app.get('/transactions/:id/status', async (req, res) => {
    const transactionID = req.params.id;
    try {
        // This calls the getTransactionStatus method on your tcProcess instance
        const statusData = await tcProcess.getTransactionStatus(transactionID);

        if (!statusData) {
            // If tcProcess.getTransactionStatus returns null or undefined for a transaction ID
            return res.status(404).json({ error: `Transaction ${transactionID} not found` });
        }
        // Send the actual status data received from tcProcess
        res.json(statusData);
    } catch (err) {
        console.error(`Error fetching status for transaction ${transactionID}:`, err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- NEW ROUTE: Get current transaction messages for visualization (REQUIRED BY FRONTEND) ---
/**
 * Get current transaction messages for visualization
 * GET /transactions/current/messages
 */
app.get('/transactions/current/messages', async (req, res) => {
    try {
        // You'll need a method in tcProcess.js to get these messages
        // For now, return a dummy array or an empty array.
        // Later, tcProcess should store historical messages.
        // Example: const messages = await tcProcess.getLatestTransactionMessages();
        const messages = []; // Placeholder for now

        res.json(messages);
    } catch (err) {
        console.error('Error fetching visualization messages:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// --- SERVER LISTENING ---
// This port should match what your frontend's VITE_TC_API_URL and VITE_REACT_APP_WS_URL expect.
const TC_PORT_FOR_FRONTEND = 8080; // This is the port your frontend is looking for.

server.listen(TC_PORT_FOR_FRONTEND, constants.LOCAL_HOST, () => {
  console.log(
    `Transaction Coordinator (HTTP & WS) listening at http://${constants.LOCAL_HOST}:${TC_PORT_FOR_FRONTEND}`
  );
});

// --- TESTING BROADCAST (Temporary - remove once real updates are implemented) ---
// This broadcasts a dummy update after 5 seconds to test WebSocket connection.
// This should be removed once real-time updates are integrated into your 2PC logic.
setTimeout(() => {
    if (clients.size > 0) {
        console.log('Sending initial status update via WebSocket...');
        broadcastUpdate('statusUpdate', {
            coordinator: 'online',
            nodes: [
                { id: 'node1', name: 'Node One', status: 'online' },
                { id: 'node2', name: 'Node Two', status: 'online' }
            ]
        });
    } else {
        console.log('No WebSocket clients connected to send initial update.');
    }
}, 5000);
// --- END TEMPORARY TESTING ---