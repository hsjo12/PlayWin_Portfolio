const { requestVRFNumber, announce } = require("./logic/helper");
const cron = require("node-cron");
/// Request Random
cron.schedule(
  "51 23 * * *",
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
  "59 23 * * *",
  async () => {
    try {
      console.log("REQUEST ANNOUNCEMENT");
      await announce();
      console.log("ANNOUNCEMENT");
    } catch (error) {
      console.log(error);
    }
  },
  {
    timezone: "Asia/Seoul", // Adjust timezone according to your location
  }
);
