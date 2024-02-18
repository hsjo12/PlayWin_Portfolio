const {
  secondPlaceGenerator,
  thirdPlaceGenerator,
  findIntersection,
} = require("./winningNumbersGenerator");

const getTheNumOfEachWinningPlaceWinners = async (
  lotteryContract,
  round,
  firstWinningNumber
) => {
  const secondPlaceWinningNumbers = secondPlaceGenerator(firstWinningNumber);
  const thirdPlaceWinningNumbers = thirdPlaceGenerator(firstWinningNumber);

  const eventFilter = lotteryContract.filters.Buy(round, null, null);
  const events = await lotteryContract.queryFilter(eventFilter, 0, "latest");
  const allTheSelectedNumbersInCurrentRound = events.map(
    (event) => event.args.selectedNumber
  );

  const intersectionForFirstWinningNumber = findIntersection(
    [firstWinningNumber],
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

  return {
    totalFirstPlaceWinners,
    totalSecondPlaceWinners,
    totalThirdPlaceWinners,
  };
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

module.exports = {
  getTheNumOfEachWinningPlaceWinners,
};
