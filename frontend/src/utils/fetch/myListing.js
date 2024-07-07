import { ethers } from "ethers";
import raffleJson from "../../abis/raffle.json";
import { getContractForReadOnly } from "../utils";
import { getItemType, getActiveType } from "./fetchUtils";

export const fetchOldestMyListing = async (
  user,
  fromIndexForMyListing,
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
  const createdRaffleLength =
    await raffleInstance.getUserCreatedRaffleListLength(user);
  if (createdRaffleLength === 0) return [];
  /// if fromIndexForMyListing is equal or greater than the length of the user created list.
  if (Number(createdRaffleLength) <= Number(fromIndexForMyListing.current))
    return [];

  let fetchedCreatedRaffleList = [];
  while (true) {
    const createdRaffleIds = await raffleInstance.getUserCreatedRaffleList(
      user,
      fromIndexForMyListing.current,
      offset
    );

    const promises = Array.from(createdRaffleIds).map(async (v) => {
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
    fetchedCreatedRaffleList.push(...results.filter((v) => v !== null));

    fromIndexForMyListing.current = fromIndexForMyListing.current + offset;

    if (
      fetchedCreatedRaffleList.length >= offset ||
      Number(createdRaffleLength) <= Number(fromIndexForMyListing.current)
    ) {
      break;
    }
  }
  return fetchedCreatedRaffleList;
};

export const fetchEndTimeMyListing = async (
  user,
  fromIndexForMyListing,
  offset,
  itemType,
  activeType
) => {
  if (fromIndexForMyListing.noMoreLoadInTimeEndOrder) return [];
  const raffleInstance = getContractForReadOnly(
    raffleJson.address,
    raffleJson.abi
  );
  const createdRaffleLength =
    await raffleInstance.getUserCreatedRaffleListLength(user);
  if (createdRaffleLength === 0) return [];

  let fetchedRaffleList = [];

  while (true) {
    const raffleList = await raffleInstance.getList(
      fromIndexForMyListing.current,
      offset
    );
    /// If there is nothing...
    if (raffleList.length === 0) {
      break;
    }

    const promises = Array.from(raffleList).map(async (v) => {
      const raffleInfo = await raffleInstance.raffleInfo(v.raffleId);
      if (
        ethers.getAddress(raffleInfo.creator) === ethers.getAddress(user) &&
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
    fromIndexForMyListing.current =
      raffleListLength === 0 ? 0n : raffleList[raffleListLength - 1].raffleId;

    if (
      fetchedRaffleList.length >= offset ||
      raffleListLength === 0 ||
      fromIndexForMyListing.current === 0n ||
      raffleList[raffleListLength - 1].nextRaffleId === 0n
    ) {
      break;
    }
    // It reach the end of list
    if (raffleList[raffleListLength - 1].nextRaffleId === 0n) {
      fromIndexForMyListing.noMoreLoadInTimeEndOrder = true;
    }
  }
  return fetchedRaffleList;
};

export const fetchNewestMyListing = async (
  user,
  fromIndexForMyListing,
  offset,
  itemType,
  activeType
) => {
  if (!user) return [];
  const raffleInstance = getContractForReadOnly(
    raffleJson.address,
    raffleJson.abi
  );
  const createdRaffleLength = Number(
    await raffleInstance.getUserCreatedRaffleListLength(user)
  );
  if (createdRaffleLength === 0) return [];
  /// if fromIndexForMyListing is equal or greater than the length of the user created list.
  if (createdRaffleLength <= Number(fromIndexForMyListing.current)) return [];
  let fetchedCreatedRaffleList = [];

  while (true) {
    // To find the last order index
    let tempIndex =
      createdRaffleLength - Number(fromIndexForMyListing.current) < 0
        ? 0
        : createdRaffleLength - Number(fromIndexForMyListing.current);

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
    const createdRaffleIds = await raffleInstance.getUserCreatedRaffleList(
      user,
      startTempIndex,
      offset
    );

    const promises = createdRaffleIds.map(async (v) => {
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
    fetchedCreatedRaffleList.push(...results.filter((v) => v !== null));

    fromIndexForMyListing.current = fromIndexForMyListing.current + offset;
    startTempIndex += offset;

    if (
      Number(fromIndexForMyListing.current) >= Number(createdRaffleLength) ||
      fetchedCreatedRaffleList.length >= offset
    ) {
      break;
    }
  }

  return fetchedCreatedRaffleList.reverse();
};
