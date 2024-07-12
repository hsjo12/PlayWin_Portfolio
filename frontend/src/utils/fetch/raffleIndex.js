import { ethers } from "ethers";
import raffleJson from "../../abis/raffle.json";
import { getContractForReadOnly } from "../utils";
import { getFilters, getItemType, getActiveType } from "./fetchUtils";

import erc20AbiJson from "../../abis/erc20Abi.json";
import erc721AbiJson from "../../abis/erc721Abi.json";
import erc1155AbiJson from "../../abis/erc1155Abi.json";
import axios from "axios";

export const oldestOrder = async (
  fromIndexForMain,
  offset,
  itemType,
  activeType
) => {
  const raffle = getContractForReadOnly(raffleJson.address, raffleJson.abi);
  const currentId = Number(await raffle.currentId());

  if (fromIndexForMain.current > currentId + 1) return []; // if it is the next index of the raffle that is not created.
  let fetchedEventList = [];
  let fetchedRaffleList = [];
  let startingBlockNumber = await raffle.blockNumberByRaffleId(
    fromIndexForMain.current
  );
  let lastBlockNumber = await raffle.blockNumberByRaffleId(currentId);
  const filter = await getFilters(itemType);
  while (true) {
    const events = await raffle.queryFilter(
      filter,
      startingBlockNumber,
      startingBlockNumber + 100000n
    );

    fetchedEventList = [...fetchedEventList, ...events];
    startingBlockNumber = startingBlockNumber + 100000n;

    if (
      fetchedEventList.length >= offset ||
      fromIndexForMain.current + offset > currentId ||
      lastBlockNumber <= startingBlockNumber
    ) {
      break;
    }
  }

  const promises = fetchedEventList.slice(0, offset).map(async (v) => {
    const raffleInfo = await raffle.raffleInfo(v.args.raffleId);
    if (getActiveType(activeType, raffleInfo.status)) {
      return {
        raffleId: v.args.raffleId,
        prize: raffleInfo.prize, // prize address
        prizeAmount: raffleInfo.prizeAmount,
        prizeType: raffleInfo.prizeType,
        prizeId: raffleInfo.prizeId, // if it is a nft
        entryPrice: raffleInfo.entryPrice,
        deadline: raffleInfo.deadline,
      };
    }
    return null;
  });

  const results = await Promise.all(promises);
  fetchedRaffleList.push(...results.filter((v) => v !== null));

  if (fromIndexForMain.current + offset >= currentId) {
    // if current index and current id are equal, meaning that there is no need to fetch,
    // so it will be marked as currentId + 1 which trigger the condition to return [].
    if (fromIndexForMain.current === currentId) {
      fromIndexForMain.current = currentId + 1;
    } else {
      fromIndexForMain.current =
        fromIndexForMain.current + (currentId - fromIndexForMain.current); //(currentId - fromIndexForMain.current) becomes offset.
    }
  } else {
    fromIndexForMain.current = fromIndexForMain.current + offset;
  }
  return fetchedRaffleList.slice(0, offset);
};

export const newestOrder = async (
  fromIndexForMain,
  offset,
  itemType,
  activeType
) => {
  try {
    if (fromIndexForMain.current === 0) return [];

    const raffle = getContractForReadOnly(raffleJson.address, raffleJson.abi);

    let fetchedEventList = [];
    let fetchedRaffleList = [];
    let startingBlockNumber = await raffle.blockNumberByRaffleId(
      fromIndexForMain.current
    );

    let lastBlockNumber = await raffle.blockNumberByRaffleId(
      1 // raffle id starts at 1
    );

    const filter = await getFilters(itemType);

    while (true) {
      const events = await raffle.queryFilter(
        filter,
        startingBlockNumber - 100000n,
        startingBlockNumber
      );

      fetchedEventList = [...fetchedEventList, ...events];
      startingBlockNumber = startingBlockNumber - 100000n;
      if (
        fetchedEventList.length >= offset ||
        fromIndexForMain.current - offset < 1 ||
        startingBlockNumber <= lastBlockNumber
      ) {
        break;
      }
    }

    const promises = fetchedEventList
      .reverse()
      .slice(0, offset)
      .map(async (v) => {
        const raffleInfo = await raffle.raffleInfo(v.args.raffleId);
        if (getActiveType(activeType, raffleInfo.status)) {
          return {
            raffleId: v.args.raffleId,
            prize: raffleInfo.prize, // prize address
            prizeAmount: raffleInfo.prizeAmount,
            prizeType: raffleInfo.prizeType,
            prizeId: raffleInfo.prizeId, // if it is a nft
            entryPrice: raffleInfo.entryPrice,
            deadline: raffleInfo.deadline,
          };
        }
        return null;
      });

    const result = await Promise.all(promises);

    fetchedRaffleList.push(...result.filter((v) => v !== null));

    fromIndexForMain.current =
      fromIndexForMain.current - offset < 1
        ? 0
        : fromIndexForMain.current - offset;

    return fetchedRaffleList.slice(0, offset);
  } catch (error) {
    console.log(error);
  }
};

export const timeEndSoon = async (
  fromIndexForMain,
  offset,
  itemType,
  activeType
) => {
  const raffle = getContractForReadOnly(raffleJson.address, raffleJson.abi);

  if (fromIndexForMain.noMoreLoadInTimeEndOrder) return [];
  let fetchedRaffleList = [];
  let loop = true;

  while (loop) {
    const allFetchedRaffleList = await raffle.getList(
      fromIndexForMain.current,
      offset
    );

    /// If there is nothing...
    if (allFetchedRaffleList.length === 0) {
      break;
    }

    const promises = Array.from(allFetchedRaffleList).map(async (v, i) => {
      const raffleInfo = await raffle.raffleInfo(v.raffleId);

      if (
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

    let allFetchedRaffleListLength = allFetchedRaffleList.length;
    fromIndexForMain.current =
      allFetchedRaffleListLength === 0
        ? 0n
        : allFetchedRaffleList[allFetchedRaffleListLength - 1].raffleId;

    if (
      fetchedRaffleList.length >= offset ||
      allFetchedRaffleList.length === 0 ||
      fromIndexForMain.current === 0n ||
      allFetchedRaffleList[allFetchedRaffleListLength - 1].nextRaffleId === 0n
    ) {
      loop = false;
    }

    // It reach the end of list
    if (
      allFetchedRaffleList[allFetchedRaffleListLength - 1].nextRaffleId === 0n
    ) {
      fromIndexForMain.noMoreLoadInTimeEndOrder = true;
    }
  }

  return fetchedRaffleList;
};
