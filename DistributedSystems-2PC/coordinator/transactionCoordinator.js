// coordinator/transactionCoordinator.js

const axios = require('axios');
const constants = require('../constants');
const TransactionRef = require('../shared/transactionRef');
const utils = require('../utils');
const nodes = utils.getConnectedClients();

const tcDownTime = (ms) => new Promise(res => setTimeout(res, ms));

// Send prepare message to all clients using the same transactionRef
const sendPrepareMessage = async (transactionRef) => {
  const votes = {};
  for (const [name, port] of Object.entries(nodes)) {
    try {
      // Begin transaction on participant
      await axios.post(`http://${constants.LOCAL_HOST}:${port}/begin`, {
        transactionID: transactionRef.transactionID,
      });

      await tcDownTime(constants.TC_DOWN_TIME);

      // Send prepare request
      const response = await axios.post(
        `http://${constants.LOCAL_HOST}:${port}/prepare`,
        { transactionRef },
        { timeout: constants.TC_TIME_OUT }
      );

      const ack = response.data.ack;
      votes[name] = ack;
      console.log(`Acknowledgment from ${name}: ${ack}`);

      if (ack.toLowerCase() !== 'yes') {
        return { success: false, failedNode: name, votes };
      }
    } catch (err) {
      console.log(`Transaction timed out or error with ${name}:`, err.message);
      votes[name] = 'NO_RESPONSE';
      return { success: false, failedNode: name, votes };
    }
  }
  return { success: true, votes };
};

const sendMessageToClients = async (transactionRef, messageObj) => {
  for (const [name, port] of Object.entries(nodes)) {
    try {
      await axios.post(
        `http://${constants.LOCAL_HOST}:${port}/message`,
        { transactionID: transactionRef.transactionID, message: messageObj }
      );
      console.log(`Sent "${messageObj.type}" to ${name}`);
    } catch (err) {
      console.log(`Failed to send "${messageObj.type}" to ${name}:`, err.message);
    }
  }
};

const runTransaction = async () => {
  const transactionRef = new TransactionRef();
  const prepareResult = await sendPrepareMessage(transactionRef);

  if (prepareResult.success) {
    console.log("All clients replied yes. Sending Global Commit.");
    await sendMessageToClients(transactionRef, { type: "COMMIT", transactionID: transactionRef.transactionID });
    return { outcome: "COMMITTED", votes: prepareResult.votes };
  } else {
    console.log(`Some clients replied no or failed. Sending Global Abort. (Failed node: ${prepareResult.failedNode})`);
    await sendMessageToClients(transactionRef, { type: "ABORT", transactionID: transactionRef.transactionID });
    return { outcome: "ABORTED", failedNode: prepareResult.failedNode, votes: prepareResult.votes };
  }
};

// Export for use in Express routes
module.exports = {
  runTransaction,
  sendPrepareMessage,
  sendMessageToClients,
};
