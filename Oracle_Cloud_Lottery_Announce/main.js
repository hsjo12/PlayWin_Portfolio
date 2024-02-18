const { requestVRFNumber } = require("./logic/helper");

/// Request Random
cron.schedule(
  "25 * * * *",
  async () => {
    try {
      console.log("START REQUEST");
      await requestVRFNumber();
      console.log("FETCHED WINNING NUMBER");
    } catch (error) {
      console.log(error);
    }
  },
  {
    timezone: "Asia/Seoul", // Adjust timezone according to your location
  }
);

/// Announce
cron.schedule(
  "35 * * * *",
  async () => {
    try {
      console.log("REQUEST ANNOUNCEMENT");
      await announce(klaytn_rpc, winningNumber);
      console.log("ANNOUNCEMENT");
    } catch (error) {
      console.log(error);
    }
  },
  {
    timezone: "Asia/Seoul", // Adjust timezone according to your location
  }
);
