// nodeTwo/server.js

const express = require('express');
const cors = require('cors');
const compression = require('compression');
// FIX: Import processTwo as an object directly, not as a class to be instantiated
const processTwo = require('./processTwo');
require('dotenv').config();

// Use environment variables or fallback to constants
const N2_SERVER_PORT = process.env.N2_SERVER_PORT || require('../constants').N2_SERVER_PORT;
const LOCAL_HOST = process.env.LOCAL_HOST || require('../constants').LOCAL_HOST;

const app = express();
app.use(express.json());
app.use(cors());
app.use(compression());

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'Node Two is healthy!' });
});

// Prepare endpoint
// nodetwo/p2server.js

// ... (other code) ...

// Prepare endpoint
app.post('/prepare', async (req, res, next) => {
  try {
    // FIX: Destructure the 'transactionRef' object from req.body
    const { transactionRef } = req.body; // <--- CHANGE IS HERE
    if (!transactionRef || !transactionRef.transactionID) {
      return res.status(400).json({ error: 'Missing transactionID in request' });
    }

    const response = await processTwo.prepare(transactionRef);
    res.json({ ack: response, message: `Prepared transaction ${transactionRef.transactionID}` });
  } catch (err) {
    next(err);
  }
});

// ... (rest of the code) ...
// Begin transaction endpoint
app.post('/begin', async (req, res, next) => {
  try {
    const { transactionID } = req.body;
    if (!transactionID) {
      return res.status(400).json({ error: 'Missing transactionID in request' });
    }

    await processTwo.beginTransaction(transactionID);
    res.json({ status: `Transaction ${transactionID} timer started` });
  } catch (err) {
    next(err);
  }
});

// Send message endpoint
app.post('/message', (req, res, next) => {
  try {
    const { transactionID, message } = req.body;
    if (!transactionID || !message) {
      return res.status(400).json({ error: 'Missing transactionID or message in request' });
    }

    processTwo.sendMessage(transactionID, message);
    res.json({ status: 'Message processed', transactionID, message });
  } catch (err) {
    next(err);
  }
});

// Get transaction status
app.get('/transactions/:id', (req, res, next) => {
  try {
    const transactionID = req.params.id;
    const status = processTwo.getTransactionStatus(transactionID);

    if (status === undefined || status === 'unknown') {
      return res.status(404).json({ error: `No transaction found with ID ${transactionID}` });
    }

    res.json({ transactionID, status });
  } catch (err) {
    next(err);
  }
});

// Get transaction logs
app.get('/transactions/:id/logs', (req, res, next) => {
  try {
    const transactionID = req.params.id;
    const logs = processTwo.getTransactionLogs(transactionID);

    if (!logs || logs.length === 0) {
      return res.status(404).json({ error: `No logs found for transaction ID ${transactionID}` });
    }

    res.json({ transactionID, logs });
  } catch (err) {
    next(err);
  }
});

// Toggle simulateCrash flag
app.post('/simulateCrash', (req, res, next) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Missing or invalid "enabled" flag (must be true or false)' });
    }

    processTwo.setSimulateCrash(enabled);
    // FIX: Change logEvent to logTransaction if that's the correct function name in processTwo
    processTwo.logTransaction('global', `Simulated crash flag set to ${enabled}`);
    res.json({ message: `Simulated crash flag updated`, enabled });
  } catch (err) {
    next(err);
  }
});

// Check simulateCrash status
app.get('/simulateCrash', (req, res) => {
  res.json({ simulateCrash: processTwo.getSimulateCrash() });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(N2_SERVER_PORT, LOCAL_HOST, () => {
  console.log(`Node Two listening on http://<span class="math-inline">\{LOCAL\_HOST\}\:</span>{N2_SERVER_PORT}`);
});