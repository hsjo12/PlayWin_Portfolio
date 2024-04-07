import lottery from "../../abis/lottery.json";
import { getContractForReadOnly, getProvider } from "./utils";
import {
  formattedInfo,
  matchWinningNumbers,
  secondPlaceGenerator,
  thirdPlaceGenerator,
} from "./winningNumberGenerator";
export const fetchTicketList = async (user) => {
  if (!user) return [];

  const lotteryInstance = getContractForReadOnly(lottery.address, lottery.abi);
  const currentRound = await lotteryInstance.round();
  const intervalBlockNumber = await lotteryInstance.intervalBlock();
  let startingBlockNumber = await lotteryInstance.startingBlock();

  const lastBlockNumberForTheRound =
    Number(startingBlockNumber) + Number(intervalBlockNumber);
  const filter = await lotteryInstance.filters.Buy(currentRound, user, null);
  const currentBlock = await getProvider().getBlockNumber();
  const events = await lotteryInstance.queryFilter(
    filter,
    lastBlockNumberForTheRound,
    currentBlock
  );

  const info = [];
  const temporaryInfo = new Object();
  events.map((event) => {
    if (temporaryInfo[event.args.selectedNumber] === undefined) {
      temporaryInfo[event.args.selectedNumber] = 1;
    } else {
      temporaryInfo[event.args.selectedNumber] += 1;
    }
  });

  for (let key in temporaryInfo) {
    info.push({
      round: Number(currentRound),
      selectedNumber: key,
      total: temporaryInfo[key],
    });
  }
  return info.sort((a, b) => b.total - a.total);
};

export const fetchPrizeList = async (user) => {
  // if it is the first round or no user, return []
  if (!user) return [];

  const lotteryInstance = getContractForReadOnly(lottery.address, lottery.abi);
  const currentRound = await lotteryInstance.round();
  if (currentRound === 1n) return [];

  const claimableRound = await lotteryInstance.claimableRound();

  const intervalBlockNumber = await lotteryInstance.intervalBlock();

  let startingPreviousRound =
    currentRound < claimableRound
      ? 1 // Very first starting round
      : Number(currentRound - claimableRound); // Start from the very first valid round from expiration.

  let totalRoundsToFetchEvents =
    currentRound < claimableRound
      ? Number(currentRound) - 1 /// Fetch events for the total rounds just before the current round
      : Number(claimableRound); // Fetch events for the total rounds of claimable rounds.

  let copyStartingRound = startingPreviousRound;
  // Generate the list of rounds to go through.
  const allTheRoundList = Array(totalRoundsToFetchEvents)
    .fill(0)
    .map((v, i) => copyStartingRound++);

  let claimablePrize = [];

  let claimEvents = [];

  const buyFilter = await lotteryInstance.filters.Buy(null, user, null);
  const claimFilter = await lotteryInstance.filters.Claim(null, user, null);

  const startAnnounceBlockForClaimNFTEvent = Number(
    (await lotteryInstance.roundInfo(startingPreviousRound)).announcedBlock -
      intervalBlockNumber
  );

  /// Fetched claimed NFT events for up to 3 rounds.
  claimEvents = await lotteryInstance.queryFilter(
    claimFilter,
    startAnnounceBlockForClaimNFTEvent,
    "latest"
  );

  await allTheRoundList.reduce(async (acc, round) => {
    await acc;
    /// if round is 1, there is no previous round, so the event will fetch from the announce block of the first round - intervalBlockNumber to the announce block of the first round
    /// events can be fetched by 50_000 blocks once, the interval block is 42900 blocks which is around 23 hours and 50 mins
    const targetRoundAnnounceBlock =
      (await lotteryInstance.roundInfo(round)).announcedBlock === 0n
        ? await lotteryInstance.startingBlock()
        : (await lotteryInstance.roundInfo(round)).announcedBlock;
    const lastRoundAnnounceBlock =
      round === 1
        ? targetRoundAnnounceBlock - intervalBlockNumber * 2n
        : (await lotteryInstance.roundInfo(round - 1)).announcedBlock;

    let buyEvents = await lotteryInstance.queryFilter(
      buyFilter,
      lastRoundAnnounceBlock,
      targetRoundAnnounceBlock
    );

    // get only numbers user purchased and claimed
    let userPurchasedNumbersOfThisRound = buyEvents.map((event) => {
      return {
        number: event.args.selectedNumber,
        round: event.args.round,
      };
    });
    let selectedNumbersWithClaimedWinningNumber = claimEvents.map((event) => {
      return {
        number: event.args.winningNumber,
        round: event.args.round,
      };
    });

    // Exclude the selected number that users have already taken a prize corresponding to the winning numbers.
    let selectedNumbersExcludingClaimedWinningNumber = removeDuplicates(
      userPurchasedNumbersOfThisRound,
      selectedNumbersWithClaimedWinningNumber
    );

    // get first, second, third place winning numbers in this round
    const { winningNumber } = await lotteryInstance.roundInfo(round);
    const secondPlaceWinningNumbersList = secondPlaceGenerator(winningNumber);
    const thirdPlaceWinningNumberList = thirdPlaceGenerator(winningNumber);

    /// Find if there is a matched numbers between user's purchased numbers and winning numbers
    let matchedFirstPlaceWinningNumber = matchWinningNumbers(
      [winningNumber],
      selectedNumbersExcludingClaimedWinningNumber
    );
    let matchedSecondPlaceWinningNumber = matchWinningNumbers(
      secondPlaceWinningNumbersList,
      selectedNumbersExcludingClaimedWinningNumber
    );
    let matchedThirdPlaceWinningNumber = matchWinningNumbers(
      thirdPlaceWinningNumberList,
      selectedNumbersExcludingClaimedWinningNumber
    );

    /// Sort out first, second, third place winning numbers
    if (matchedFirstPlaceWinningNumber.length > 0) {
      const firstPlacePrizeInfo = await formattedInfo(
        currentRound,
        matchedFirstPlaceWinningNumber,
        round, // winning round since reduce go through all the round
        1, // winning place
        claimableRound
      );

      claimablePrize = [...claimablePrize, ...firstPlacePrizeInfo];
    }

    if (matchedSecondPlaceWinningNumber.length > 0) {
      const secondPlacePrizeInfo = await formattedInfo(
        currentRound,
        matchedSecondPlaceWinningNumber,
        round, // winning round since reduce go through all the round
        2, // winning place
        claimableRound
      );

      claimablePrize = [...claimablePrize, ...secondPlacePrizeInfo];
    }

    if (matchedThirdPlaceWinningNumber.length > 0) {
      const thirdPlacePrizeInfo = await formattedInfo(
        currentRound,
        matchedThirdPlaceWinningNumber,
        round, // winning round since reduce go through all the round
        3, // winning place
        claimableRound
      );

      claimablePrize = [...claimablePrize, ...thirdPlacePrizeInfo];
    }
  }, Promise.resolve());

  return claimablePrize;
};

function removeDuplicates(arr1, arr2) {
  arr1 = filterBigInts(arr1);
  arr2 = filterBigInts(arr2);
  const set = new Set(arr2.map((item) => JSON.stringify(item)));
  const filteredArr1 = arr1.filter((item) => !set.has(JSON.stringify(item)));
  return filteredArr1;
}

function filterBigInts(arr) {
  return arr.map((obj) => {
    const newObj = { ...obj };
    newObj.round = obj.round.toString();
    return newObj;
  });
}
