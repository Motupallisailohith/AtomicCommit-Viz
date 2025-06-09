const { N1_DOWN_TIME, N1_TIME_OUT, TC_DOWN_TIME } = require('../constants');

const transactionStatusMap = new Map();
const transactionLogs = new Map();
const timeoutHandlers = new Map();

let simulateCrash = false; // Fault injection flag
let abortProbability = 0.3; // Make abort probability configurable

function logTransaction(transactionID, event, level = 'info') {
  const time = new Date().toISOString();
  if (!transactionLogs.has(transactionID)) {
    transactionLogs.set(transactionID, []);
  }
  transactionLogs.get(transactionID).push({ time, event, level });
}

async function sendWithRetry(sendFunc, maxRetries = 3, delay = 500) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await sendFunc();
    } catch (err) {
      logTransaction('global', `Retry ${i + 1} failed: ${err.message}`, 'warn');
      console.log(`Retry ${i + 1} failed:`, err.message);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error('All retries failed');
}

function beginTransaction(transactionID) {
  logTransaction(transactionID, 'Begin transaction - Timer started');
  console.log('N1: Waiting for prepare msg from TC');
  console.log('N1: Timer Started for the Transaction');

  const timeout = setTimeout(() => {
    logTransaction(transactionID, 'Transaction Timed Out', 'error');
    console.log('Transaction Timed Out');
    transactionStatusMap.set(transactionID, 'timed out');
    timeoutHandlers.delete(transactionID);
  }, N1_TIME_OUT);

  timeoutHandlers.set(transactionID, timeout);
  transactionStatusMap.set(transactionID, 'pending');
}

function prepare(transactionRef) {
  const { transactionID } = transactionRef;
  logTransaction(transactionID, 'Prepare message received');
  console.log('N1: Prepare Message received From TC');

  // Clear timeout when prepare is received
  if (timeoutHandlers.has(transactionID)) {
    clearTimeout(timeoutHandlers.get(transactionID));
    timeoutHandlers.delete(transactionID);
    logTransaction(transactionID, 'Timeout cleared on prepare');
  }

  return sendWithRetry(() => {
    return new Promise((resolve, reject) => {
      if (simulateCrash) {
        const errorMessage = 'Simulated crash - N1 is unresponsive';
        logTransaction(transactionID, errorMessage, 'error');
        console.log(`N1: ${errorMessage}`);
        return reject(new Error(errorMessage));
      }

      setTimeout(() => {
        const isTimeout = TC_DOWN_TIME > N1_TIME_OUT;
        if (isTimeout) {
          transactionStatusMap.set(transactionID, 'timed out');
          logTransaction(transactionID, 'Transaction Timed Out during prepare', 'error');
        }

        const shouldAbort = Math.random() < abortProbability; // configurable

        const status = transactionStatusMap.get(transactionID);
        if (status === 'timed out' || shouldAbort) {
          const reason = status === 'timed out' ? 'timed out' : 'random abort';
          logTransaction(transactionID, `Transaction aborted due to ${reason}`, 'warn');
          console.log('N1: Returning reply as no');
          logTransaction(transactionID, 'Reply: no');
          transactionStatusMap.set(transactionID, 'aborted');
          return resolve('no');
        }

        console.log('N1: Returning reply as yes');
        logTransaction(transactionID, 'Reply: yes');
        transactionStatusMap.set(transactionID, 'prepared');
        return resolve('yes');
      }, N1_DOWN_TIME);
    });
  });
}

function sendMessage(transactionID, message) {
  const normalizedMsg = typeof message === 'string' ? message.toLowerCase() : message.type?.toLowerCase() || '';
  logTransaction(transactionID, `Message received - ${normalizedMsg}`);
  if (timeoutHandlers.has(transactionID)) {
    clearTimeout(timeoutHandlers.get(transactionID));
    timeoutHandlers.delete(transactionID);
    logTransaction(transactionID, 'Timeout cleared');
  }
  transactionStatusMap.set(transactionID, normalizedMsg);
  console.log(`N1: Transaction ${transactionID} ${normalizedMsg}`);
  logTransaction(transactionID, `Transaction ${normalizedMsg}`);
}

function getTransactionStatus(transactionID) {
  return transactionStatusMap.get(transactionID) || 'unknown';
}

function getTransactionLogs(transactionID) {
  return transactionLogs.get(transactionID) || [];
}

// List all transactions (for history)
function getAllTransactions() {
  return Array.from(transactionStatusMap.entries()).map(([id, status]) => ({ id, status }));
}

// Fault injection control
function setSimulateCrash(value) {
  simulateCrash = value;
  return simulateCrash;
}

function setAbortProbability(prob) {
  abortProbability = prob;
  return abortProbability;
}

// Reset all state (for testing/demo)
function resetAll() {
  transactionStatusMap.clear();
  transactionLogs.clear();
  timeoutHandlers.forEach(clearTimeout);
  timeoutHandlers.clear();
  simulateCrash = false;
  abortProbability = 0.3;
}

module.exports = {
  beginTransaction,
  prepare,
  sendMessage,
  getTransactionStatus,
  getTransactionLogs,
  setSimulateCrash,
  setAbortProbability,
  getAllTransactions,
  resetAll,
};
