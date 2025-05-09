const { requestVRFNumber, announce } = require("./logic/helper");
const cron = require("node-cron");
/// Request Random
cron.schedule(
  "03 10 * * *",
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
  "10 10 * * *",
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

// const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// (async () => {
//   await Array.from({ length: 8 }).reduce((promiseChain, _, index) => {
//     return promiseChain.then(async () => {
//       console.log(`REQUEST ANNOUNCEMENT ${index + 1}`);
//       // await requestVRFNumber();
//       await announce();
//       console.log(`ANNOUNCEMENT ${index + 1}`);
//       await delay(1000);
//     });
//   }, Promise.resolve());
// })();
