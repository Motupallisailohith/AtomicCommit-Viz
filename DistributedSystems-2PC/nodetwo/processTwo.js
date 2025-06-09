const { N2_DOWN_TIME, N2_TIME_OUT, TC_DOWN_TIME } = require('../constants');

class ProcessTwo {
  constructor() {
    this.transactionStatusMap = new Map();
    this.handlerMap = new Map();
    this.logs = [];
    this.simulateCrash = false;
  }

  logEvent(transactionID, event) {
    const timestamp = new Date().toISOString();
    const entry = { transactionID, event, timestamp };
    this.logs.push(entry);
    console.log(`[${timestamp}] TX ${transactionID}: ${event}`);
  }

  async sendWithRetry(sendFunc, maxRetries = 3, delay = 500) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await sendFunc();
      } catch (err) {
        this.logEvent('global', `Retry ${i + 1} failed: ${err.message}`);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
    throw new Error('All retries failed');
  }

  async prepare(transactionRef) {
    const txID = transactionRef.transactionID;
    this.logEvent(txID, "Prepare message received");

    if (this.simulateCrash) {
      this.logEvent(txID, "Simulated crash - not responding");
      throw new Error("Simulated crash");
    }

    return this.sendWithRetry(async () => {
      await this.n2Downtime(N2_DOWN_TIME);

      // 30% chance to abort
      const shouldAbort = Math.random() < 0.3;

      if (TC_DOWN_TIME > N2_TIME_OUT || shouldAbort) {
        this.transactionStatusMap.set(txID, "abort");
      }

      const status = this.transactionStatusMap.get(txID);
      if (status === "timed out" || status === "abort") {
        this.logEvent(txID, "Transaction timed out or simulated abort. Voting NO");
        return "no";
      }

      this.logEvent(txID, "Voting YES");
      return "yes";
    });
  }

  n2Downtime(timeMs) {
    return new Promise(resolve => setTimeout(resolve, timeMs));
  }

  async beginTransaction(transactionID) {
    if (this.transactionStatusMap.has(transactionID)) {
      this.logEvent(transactionID, "Duplicate beginTransaction ignored.");
      return;
    }

    this.logEvent(transactionID, "Begin transaction. Timer started");
    this.transactionStatusMap.set(transactionID, "pending");

    const timerId = setTimeout(() => {
      this.logEvent(transactionID, "Timeout occurred");
      this.transactionStatusMap.set(transactionID, "timed out");
      this.handlerMap.delete(transactionID);
    }, N2_TIME_OUT);

    this.handlerMap.set(transactionID, timerId);
  }

  clearTransactionTimeout(transactionID) {
    if (this.handlerMap.has(transactionID)) {
      clearTimeout(this.handlerMap.get(transactionID));
      this.handlerMap.delete(transactionID);
      this.logEvent(transactionID, "Timeout cleared");
    }
  }

  sendMessage(transactionID, message) {
    this.logEvent(transactionID, `Received message: ${message}`);

    if (message === 'commit' || message === 'abort') {
      this.clearTransactionTimeout(transactionID);
      this.transactionStatusMap.set(transactionID, message);
      this.logEvent(transactionID, `Transaction ${message}`);
    }
  }

  getTransactionLogs(transactionID = null) {
    return transactionID
      ? this.logs.filter(log => log.transactionID === transactionID)
      : this.logs;
  }

  getTransactionStatus(transactionID) {
    return this.transactionStatusMap.get(transactionID) || 'unknown';
  }

  setSimulateCrash(flag) {
    this.simulateCrash = !!flag;
    console.log(`N2 simulate crash set to: ${this.simulateCrash}`);
  }

  getSimulateCrash() {
    return this.simulateCrash;
  }

  // Optional: Reset all state (for tests/restarts)
  reset() {
    this.transactionStatusMap.clear();
    this.handlerMap.forEach(timer => clearTimeout(timer));
    this.handlerMap.clear();
    this.logs = [];
    this.simulateCrash = false;
    console.log("ProcessTwo state reset.");
  }
}

module.exports = ProcessTwo;
