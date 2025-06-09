const { N2_DOWN_TIME, N2_TIME_OUT, TC_DOWN_TIME } = require('../constants');

const transactionStatusMap = new Map();
const transactionLogs = new Map();
const timeoutHandlers = new Map();

let simulateCrash = false; // Fault injection flag
let abortProbability = 0.3; // Configurable

function logTransaction(transactionID, event, level = 'info') {
  const time = new Date().toISOString();
  if (!transactionLogs.has(transactionID)) {
    transactionLogs.set(transactionID, []);
  }
  transactionLogs.get(transactionID).push({ time, event, level });
}

function beginTransaction(transactionID) {
  logTransaction(transactionID, 'Begin transaction - Timer started');
  console.log('N2: Waiting for prepare msg from TC');
  console.log('N2: Timer Started for the Transaction');

  // Start a timeout for this transaction
  const timeout = setTimeout(() => {
    logTransaction(transactionID, 'Transaction Timed Out', 'error');
    console.log('N2: Transaction Timed Out');
    transactionStatusMap.set(transactionID, 'timed out');
    timeoutHandlers.delete(transactionID);
  }, N2_TIME_OUT);

  timeoutHandlers.set(transactionID, timeout);
  transactionStatusMap.set(transactionID, 'pending');
}

function prepare(transactionRef) {
  const { transactionID } = transactionRef;
  logTransaction(transactionID, 'Prepare message received');
  console.log('N2: Prepare Message received From TC');

  // Clear timeout when prepare is received
  if (timeoutHandlers.has(transactionID)) {
    clearTimeout(timeoutHandlers.get(transactionID));
    timeoutHandlers.delete(transactionID);
    logTransaction(transactionID, 'Timeout cleared on prepare');
  }

  return new Promise((resolve, reject) => {
    if (simulateCrash) {
      const errorMessage = 'Simulated crash - N2 is unresponsive';
      logTransaction(transactionID, errorMessage, 'error');
      console.log(`N2: ${errorMessage}`);
      return reject(new Error(errorMessage));
    }

    setTimeout(() => {
      const isTimeout = TC_DOWN_TIME > N2_TIME_OUT;
      if (isTimeout) {
        transactionStatusMap.set(transactionID, 'timed out');
        logTransaction(transactionID, 'Transaction Timed Out during prepare', 'error');
      }

      // Configurable chance to vote 'no'
      const shouldAbort = Math.random() < abortProbability;

      const status = transactionStatusMap.get(transactionID);
      if (status === 'timed out' || shouldAbort) {
        const reason = status === 'timed out' ? 'timed out' : 'random abort';
        logTransaction(transactionID, `Transaction aborted due to ${reason}`, 'warn');
        console.log('N2: Returning reply as no');
        logTransaction(transactionID, 'Reply: no');
        transactionStatusMap.set(transactionID, 'aborted');
        return resolve('no');
      }

      console.log('N2: Returning reply as yes');
      logTransaction(transactionID, 'Reply: yes');
      transactionStatusMap.set(transactionID, 'prepared');
      return resolve('yes');
    }, N2_DOWN_TIME);
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
  console.log(`N2: Transaction ${transactionID} ${normalizedMsg}`);
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
