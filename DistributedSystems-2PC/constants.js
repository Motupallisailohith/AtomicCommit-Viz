// constants.js

module.exports = {
  // Server ports
  TC_SERVER_PORT: 9000,
  N1_SERVER_PORT: 9001,
  N2_SERVER_PORT: 9002,

  // Host
  LOCAL_HOST: "127.0.0.1",

  // Timeouts and downtimes in milliseconds (as they are in Java)
  TC_TIME_OUT: 8000,        // 8 seconds
  TC_DOWN_TIME: 0,          // 0 seconds

  N1_TIME_OUT: 15000,       // 15 seconds
  N1_DOWN_TIME: 10000,      // 10 seconds

  N2_TIME_OUT: 5000,        // 5 seconds
  N2_DOWN_TIME: 0           // 0 seconds
};
