// nodeone/p1Server.js

const express = require('express');
const cors = require('cors');
const processOneModule = require('./processOne')
const { N1_SERVER_PORT, LOCAL_HOST } = require('../constants');

const app = express();
app.use(express.json());
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Node One is healthy!' });
});

// Begin transaction
app.post('/begin', (req, res) => {
  const { transactionID } = req.body;
  if (!transactionID) {
    return res.status(400).json({ error: 'Missing transactionID in request' });
  }
  processOneModule.beginTransaction(transactionID);
  res.json({ status: `Transaction ${transactionID} timer started` });
});

// Prepare phase
// nodeone/p1Server.js

// ... (other code) ...

// Prepare phase
app.post('/prepare', async (req, res) => {
  try {
    // FIX: Destructure the 'transactionRef' object from req.body
    const { transactionRef } = req.body; // <--- CHANGE IS HERE
    // Now 'transactionRef' will be the actual object: { id: "tx-...", ... }

    if (!transactionRef || !transactionRef.transactionID) {
      return res.status(400).json({ error: 'Missing transactionID in request' });
    }
    const ack = await processOneModule.prepare(transactionRef);
    res.json({ ack, message: `Prepared transaction ${transactionRef.transactionID}` });
  } catch (err) {
    console.error('Error in /prepare:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ... (rest of the code) ...

// Receive message (Commit/Abort)
app.post('/message', (req, res) => {
  const { transactionID, message } = req.body;
  if (!transactionID || !message) {
    return res.status(400).json({ error: 'Missing transactionID or message in request' });
  }
  processOneModule.sendMessage(transactionID, message);
  res.json({ status: 'Message processed', transactionID, message });
});

// Query transaction status
app.get('/transactions/:id', (req, res) => {
  const transactionID = req.params.id;
  const status = processOneModule.getTransactionStatus(transactionID);

  if (status === undefined || status === 'unknown') {
    return res.status(404).json({ error: `No transaction found with ID ${transactionID}` });
  }
  res.json({ transactionID, status });
});

// Query transaction logs
app.get('/transactions/:id/logs', (req, res) => {
  const transactionID = req.params.id;
  const logs = processOneModule.getTransactionLogs(transactionID);

  if (!logs || logs.length === 0) {
    return res.status(404).json({ error: `No logs found for transaction ID ${transactionID}` });
  }
  res.json({ transactionID, logs });
});

// Toggle simulateCrash flag
app.post('/simulateCrash', (req, res, next) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Missing or invalid "enabled" flag (must be true or false)' });
    }

    processOneModule.setSimulateCrash(enabled);
    // If you have a logEvent function in processOneModule, use it:
    // processOneModule.logEvent('global', `Simulated crash flag set to ${enabled}`);
    
    res.json({ message: `Simulated crash flag updated`, enabled });
  } catch (err) {
    console.error('Error in /simulateCrash:', err.message);
    next(err); // Pass error to global handler
  }
});

// Error handler (optional, for catching unhandled errors)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(N1_SERVER_PORT, LOCAL_HOST, () => {
  console.log(`Node One listening on http://${LOCAL_HOST}:${N1_SERVER_PORT}`);
});