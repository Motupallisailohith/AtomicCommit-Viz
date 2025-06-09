/**
 * Interface for a participant process in 2PC.
 * All node process classes should extend this and implement the methods.
 */
class Process {
  /**
   * Simulates the PREPARE phase.
   * @param {TransactionRef} transactionRef
   * @returns {Promise<string>} response: "YES" | "NO"
   */
  async prepare(transactionRef) {
    throw new Error('prepare() not implemented');
  }

  /**
   * Begin transaction execution.
   * @param {string} transactionID
   */
  async beginTransaction(transactionID) {
    throw new Error('beginTransaction() not implemented');
  }

  /**
   * Send a message (commit/abort/other) to the process.
   * @param {string} message
   */
  async sendMessage(message) {
    throw new Error('sendMessage() not implemented');
  }

  /**
   * (Optional) Get status of a transaction.
   * @param {string} transactionID
   * @returns {string}
   */
  getTransactionStatus(transactionID) {
    throw new Error('getTransactionStatus() not implemented');
  }
}

module.exports = Process;
