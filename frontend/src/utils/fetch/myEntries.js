import raffleJson from "../../abis/raffle.json";
import { getContractForReadOnly } from "../utils";
import { getItemType, getActiveType } from "./fetchUtils";

export const fetchOldestMyEntryList = async (
  user,
  fromIndexForMyEntries,
  offset,
  itemType,
  activeType
) => {
  if (!user) {
    return [];
  }
  const raffleInstance = await getContractForReadOnly(
    raffleJson.address,
    raffleJson.abi
  );

  // Get all the raffles ids that the user joined
  const userEntryListLength = Number(
    await raffleInstance.getUserJoinedRaffleListLength(user)
  );
  if (userEntryListLength <= Number(fromIndexForMyEntries.current)) return [];

  let fetchedRaffleList = [];
  while (true) {
    const joinedRaffleIds = await raffleInstance.getUserJoinedRaffleList(
      user,
      fromIndexForMyEntries.current,
      offset
    );

    const promises = Array.from(joinedRaffleIds).map(async (v) => {
      const raffleInfo = await raffleInstance.raffleInfo(v);
      if (
        v !== 0n &&
        getItemType(itemType, raffleInfo.prizeType) &&
        getActiveType(activeType, raffleInfo.status)
      ) {
        return {
          raffleId: v,
          prize: raffleInfo.prize, // prize address
          prizeAmount: raffleInfo.prizeAmount,
          prizeType: raffleInfo.prizeType,
          prizeId: raffleInfo.prizeId, // if it is a nft
          entryPrice: raffleInfo.entryPrice,
          deadline: raffleInfo.deadline,
          status: raffleInfo.status,
        };
      }

      return null;
    });

    const results = await Promise.all(promises);
    fetchedRaffleList.push(...results.filter((v) => v !== null));

    fromIndexForMyEntries.current = fromIndexForMyEntries.current + offset;
    if (
      fetchedRaffleList.length >= offset ||
      userEntryListLength <= Number(fromIndexForMyEntries.current)
    ) {
      break;
    }
  }
  return fetchedRaffleList;
};
export const fetchTimeEndEntryListOfMine = async (
  user,
  fromIndexForMyEntries,
  offset,
  itemType,
  activeType
) => {
  if (fromIndexForMyEntries.noMoreLoadInTimeEndOrder) return [];
  const raffleInstance = getContractForReadOnly(
    raffleJson.address,
    raffleJson.abi
  );

  // Get all the raffles ids that the user joined
  const userEntryListLength = Number(
    await raffleInstance.getUserJoinedRaffleListLength(user)
  );
  if (userEntryListLength === 0) return [];

  /// If the view function fetches too much data, it will result in an error..
  /// So, fetch small amounts of data multiple times.

  let userEntryList = [];
  const fetchingSize = 1000;
  let loopingTimes =
    userEntryListLength > fetchingSize
      ? Math.floor(userEntryListLength / fetchingSize)
      : 1;
  const leftOverDataAfterLoop =
    loopingTimes > 1
      ? userEntryListLength -
        fetchingSize * Math.floor(userEntryListLength / fetchingSize)
      : 0;
  loopingTimes = leftOverDataAfterLoop !== 0 ? loopingTimes + 1 : loopingTimes; /// The reason plus 1 (loopingTimes + 1) is to fetch the leftover data

  const promises = Array(loopingTimes)
    .fill(0)
    .map((v, i) => {
      const index = i * fetchingSize;
      return raffleInstance.getUserJoinedRaffleList(user, index, fetchingSize);
    });
  const results = await Promise.all(promises);
  userEntryList = results.flat();

  if (leftOverDataAfterLoop !== 0) {
    const fetchedData = await raffleInstance.getUserJoinedRaffleList(
      user,
      loopingTimes * fetchingSize,
      leftOverDataAfterLoop
    );
    userEntryList = [...userEntryList, ...fetchedData];
  }

  let fetchedRaffleList = [];
  while (true) {
    const raffleList = await raffleInstance.getList(
      fromIndexForMyEntries.current,
      offset
    );
    /// If there is nothing...
    if (raffleList.length === 0) {
      break;
    }

    const promises = Array.from(raffleList).map(async (v) => {
      const raffleInfo = await raffleInstance.raffleInfo(v.raffleId);
      if (
        userEntryList.includes(v.raffleId) &&
        v.raffleId !== 0n &&
        getItemType(itemType, raffleInfo.prizeType) &&
        getActiveType(activeType, raffleInfo.status)
      ) {
        return {
          raffleId: v.raffleId,
          prize: raffleInfo.prize, // prize address
          prizeAmount: raffleInfo.prizeAmount,
          prizeType: raffleInfo.prizeType,
          prizeId: raffleInfo.prizeId, // if it is a nft
          entryPrice: raffleInfo.entryPrice,
          deadline: raffleInfo.deadline,
          nextRaffleId: v.nextRaffleId,
        };
      }
      return null;
    });

    const results = await Promise.all(promises);
    fetchedRaffleList.push(...results.filter((v) => v !== null));

    let raffleListLength = raffleList.length;
    fromIndexForMyEntries.current =
      raffleListLength === 0 ? 0n : raffleList[raffleListLength - 1].raffleId;

    if (
      fetchedRaffleList.length >= offset ||
      raffleListLength === 0 ||
      fromIndexForMyEntries.current === 0n ||
      raffleList[raffleListLength - 1].nextRaffleId === 0n
    ) {
      break;
    }

    // It reach the end of list
    if (raffleList[raffleListLength - 1].nextRaffleId === 0n) {
      fromIndexForMyEntries.noMoreLoadInTimeEndOrder = true;
    }
  }

  return fetchedRaffleList;
};
export const fetchNewestMyEntryList = async (
  user,
  fromIndexForMyEntries,
  offset,
  itemType,
  activeType
) => {
  if (!user) return [];
  const raffleInstance = await getContractForReadOnly(
    raffleJson.address,
    raffleJson.abi
  );

  // Get all the raffles ids that the user joined
  const userEntryListLength = Number(
    await raffleInstance.getUserJoinedRaffleListLength(user)
  );
  if (userEntryListLength === 0) return [];
  if (userEntryListLength <= Number(fromIndexForMyEntries.current)) return [];
  let fetchedRaffleList = [];

  while (true) {
    // To find the last order index
    let tempIndex =
      userEntryListLength - Number(fromIndexForMyEntries.current) < 0
        ? 0
        : userEntryListLength - Number(fromIndexForMyEntries.current);
    // To fetch events from startTempIndex to the tempIndex.
    // The startTemp index is offset backwards from the tempIndex.
    // E.g. tempIndex is 5, offset is 3, start temp index is 2 (5-3)
    // it will go through from 2 to 4.
    // if tempIndex is 2, and offset is 3, the start temp index is -1 (2-3).
    // In this case, the offset needs to be adjusted to (offset - (offset - tempIndex)) (which evaluates to 1 for the given values: 3 - (3 - 2)).
    let startTempIndex;
    if (tempIndex < offset) {
      startTempIndex = 0;
      offset = offset - (offset - tempIndex);
    } else {
      startTempIndex = tempIndex - offset;
    }

    const joinedRaffleIds = await raffleInstance.getUserJoinedRaffleList(
      user,
      startTempIndex,
      offset
    );

    const promises = Array.from(joinedRaffleIds).map(async (v) => {
      const raffleInfo = await raffleInstance.raffleInfo(v);
      if (
        v !== 0n &&
        getItemType(itemType, raffleInfo.prizeType) &&
        getActiveType(activeType, raffleInfo.status)
      ) {
        return {
          raffleId: v,
          prize: raffleInfo.prize, // prize address
          prizeAmount: raffleInfo.prizeAmount,
          prizeType: raffleInfo.prizeType,
          prizeId: raffleInfo.prizeId, // if it is a nft
          entryPrice: raffleInfo.entryPrice,
          deadline: raffleInfo.deadline,
          status: raffleInfo.status,
        };
      }
      return null;
    });

    const results = await Promise.all(promises);
    fetchedRaffleList.push(...results.filter((v) => v !== null));

    fromIndexForMyEntries.current = fromIndexForMyEntries.current + offset;
    startTempIndex += offset;

    if (
      Number(fromIndexForMyEntries.current) >= Number(userEntryListLength) ||
      fetchedRaffleList.length >= offset
    ) {
      break;
    }
  }
  return fetchedRaffleList.reverse();
};
