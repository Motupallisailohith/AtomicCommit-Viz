// shared/transactionStatus.js

class TransactionStatus {
  constructor() {
    this.processName = '';
    this.timedOut = false;
    this.prepareSuccess = false;
  }
}

module.exports = TransactionStatus;
