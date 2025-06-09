// utils/index.js

const constants = require('../constants');

const getConnectedClients = () => {
  return {
    processOne: constants.N1_SERVER_PORT,
    processTwo: constants.N2_SERVER_PORT,
  };
};

module.exports = {
  getConnectedClients,
};
