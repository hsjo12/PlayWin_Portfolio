require("dotenv").config();
const { ethers, Wallet } = require("ethers");
const {
  secondPlaceGenerator,
  thirdPlaceGenerator,
  findIntersection,
} = require("./generators");
const lotteryJson = require("../abis/Lottery.json");
const vrfJson = require("../abis/Vrf.json");
const VRF_ADDRESS = "0x71A7b90dB224642d2A55829418557acF1aD192E6";
const requestVRFNumber = async () => {
  const provider = new ethers.JsonRpcProvider(process.env.RPC);

  const user = new Wallet(process.env.PK, provider);

  const lottery = new ethers.Contract(
    lotteryJson.address,
    lotteryJson.abi,
    user
  );

  const vrf = new ethers.Contract(VRF_ADDRESS, vrfJson.abi, user);

  while (true) {
    if (await lottery.isRoundOver()) {
      break;
    }
    /// Wait for 1 min
    wait(60000);
  }

  const tx = await vrf.requestRandomNumber();
  await tx.wait().then(async (receipt) => {
    if (receipt && receipt.status == 1) {
      console.log(`Request is successful`);
    } else {
      console.log(`Request is failed`);
    }
  });
};
const announce = async () => {
  const provider = new ethers.JsonRpcProvider(process.env.RPC);
  const user = new Wallet(process.env.PK, provider);

  const vrf = new ethers.Contract(VRF_ADDRESS, vrfJson.abi, user);

  const lotteryContract = new ethers.Contract(
    lotteryJson.address,
    lotteryJson.abi,
    user
  );
  const round = await lotteryContract.round();
  let _roundInfo;

  /// Try to fetch random number
  while (true) {
    console.log("try to fetch the round information", round);
    _roundInfo = await vrf.roundInfo(round);
    console.log("_roundInfo.fulfilled", _roundInfo.fulfilled);
    if (_roundInfo.fulfilled) {
      break;
    }
    wait(60000);
  }
  const winningNumber = _roundInfo.formattedRandomNum;

  const secondPlaceWinningNumbers = secondPlaceGenerator(winningNumber);
  const thirdPlaceWinningNumbers = thirdPlaceGenerator(winningNumber);

  const startingBlock = await lotteryContract.startingBlock();
  const intervalBlock = await lotteryContract.intervalBlock();
  const lastBlockOfCurrentRound = startingBlock + intervalBlock;

  const eventFilter = lotteryContract.filters.Buy(round, null, null);
  const events = await lotteryContract.queryFilter(
    eventFilter,
    startingBlock,
    lastBlockOfCurrentRound
  );
  const allTheSelectedNumbersInCurrentRound = events.map(
    (event) => event.args.selectedNumber
  );

  const intersectionForFirstWinningNumber = findIntersection(
    [winningNumber],
    allTheSelectedNumbersInCurrentRound
  );
  const intersectionForSecondWinningNumber = findIntersection(
    secondPlaceWinningNumbers,
    allTheSelectedNumbersInCurrentRound
  );
  const intersectionForThirdWinningNumber = findIntersection(
    thirdPlaceWinningNumbers,
    allTheSelectedNumbersInCurrentRound
  );

  const totalFirstPlaceWinners = await getTotalSelectedNumber(
    lotteryContract,
    round,
    intersectionForFirstWinningNumber
  );
  const totalSecondPlaceWinners = await getTotalSelectedNumber(
    lotteryContract,
    round,
    intersectionForSecondWinningNumber
  );
  const totalThirdPlaceWinners = await getTotalSelectedNumber(
    lotteryContract,
    round,
    intersectionForThirdWinningNumber
  );
  console.log("winningNumber", winningNumber, typeof winningNumber);
  console.log("totalFirstPlaceWinners", totalFirstPlaceWinners);
  console.log("totalSecondPlaceWinners", totalSecondPlaceWinners);
  console.log("totalThirdPlaceWinners", totalThirdPlaceWinners);

  try {
    const tx = await lotteryContract.announce(
      winningNumber,
      totalFirstPlaceWinners,
      totalSecondPlaceWinners,
      totalThirdPlaceWinners
    );

    await tx.wait().then((receipt) => {
      if (receipt && receipt.status === 1) {
        console.log("Transaction is successful.");
      } else {
        console.log("Transaction is failed.");
      }
    });
  } catch (error) {
    console.log(error);
  }
};

const getTotalSelectedNumber = async (
  lotteryContract,
  round,
  targetWinningNumberList
) => {
  let totalWinners = 0n;
  await targetWinningNumberList.reduce(async (acc, cv) => {
    await acc;
    const winners = await lotteryContract.totalSelectedNumberByRound(round, cv);
    totalWinners += winners;
  }, Promise.resolve());

  return totalWinners;
};
const wait = (time) => new Promise((resolve) => setTimeout(resolve, time));

module.exports = {
  requestVRFNumber,
  announce,
};
