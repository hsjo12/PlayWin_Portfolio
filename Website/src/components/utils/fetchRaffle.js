import { ethers } from "ethers";
import raffleJson from "../../abis/raffle.json";
import {
  getContract,
  getContractForReadOnly,
  getProvider,
  ipfsToHttpConverter,
} from "./utils";
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
      startingBlockNumber + 10000n
    );

    fetchedEventList = [...fetchedEventList, ...events];
    startingBlockNumber = startingBlockNumber + 10000n;

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
        startingBlockNumber - 10000n,
        startingBlockNumber
      );

      fetchedEventList = [...fetchedEventList, ...events];
      startingBlockNumber = startingBlockNumber - 10000n;
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

export const timeEndSoon = async (fromIndexForMain, offset, itemType) => {
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
      if (v.raffleId !== 0n && getItemType(itemType, raffleInfo.prizeType)) {
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

export const timeEndSoonForInActiveRaffles = async (
  fromIndexForMain,
  offset,
  itemType
) => {
  const raffleInstance = await getContractForReadOnly(
    raffleJson.address,
    raffleJson.abi
  );

  const inActiveRaffleListLength =
    await raffleInstance.getInactiveRaffleListLength();
  if (inActiveRaffleListLength === 0) return [];
  if (Number(inActiveRaffleListLength) <= Number(fromIndexForMain.current))
    return [];
  let fetchedInActiveRaffleList = [];

  while (true) {
    const inactiveRaffleIds = await raffleInstance.getInactiveList(
      fromIndexForMain.current,
      offset
    );

    const promises = Array.from(inactiveRaffleIds).map(async (v, i) => {
      const raffleInfo = await raffleInstance.raffleInfo(v);
      if (v !== 0n && getItemType(itemType, raffleInfo.prizeType)) {
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

    fetchedInActiveRaffleList = await Promise.all(
      promises.filter((v) => v !== null)
    );

    fromIndexForMain.current = fromIndexForMain.current + offset;

    if (
      fetchedInActiveRaffleList.length >= offset ||
      Number(inActiveRaffleListLength) <= Number(fromIndexForMain.current)
    ) {
      break;
    }
  }
  return fetchedInActiveRaffleList;
};

export const fetchCreatorTx = async (raffleId, creator) => {
  const raffle = getContractForReadOnly(raffleJson.address, raffleJson.abi);
  raffleId = Number(raffleId);
  let startingBlockNumber = await raffle.blockNumberByRaffleId(raffleId);

  const filter = await raffle.filters.Create(raffleId, creator, null);
  const events = await raffle.queryFilter(
    filter,
    startingBlockNumber,
    startingBlockNumber + 10000n
  );

  return events[0].transactionHash;
};

//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
/// MY entry Listing
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

//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
/// MY Listing
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
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
export const fetchTokenInfo = async (prizeType, prize, prizeId) => {
  let prizeInstance;
  if (prizeType === 0n) {
    // if the prize is erc20
    prizeInstance = getContractForReadOnly(prize, erc20AbiJson.abi);

    return {
      decimals: await prizeInstance.decimals(),
      name: await prizeInstance.name(),
      symbol: await prizeInstance.symbol(),
      image: "/tokens/erc20Prize.jpg",
    };
  } else if (prizeType === 1n) {
    prizeInstance = getContractForReadOnly(prize, erc721AbiJson.abi);

    const response = await axios.get(await prizeInstance.tokenURI(prizeId));
    return {
      name: await prizeInstance.name(),
      image: ipfsToHttpConverter(response.data.image),
    };
  } else {
    prizeInstance = getContractForReadOnly(prize, erc1155AbiJson.abi);
    const response = await axios.get(await prizeInstance.uri(prizeId));

    return {
      name: "ERC1155",
      image: ipfsToHttpConverter(response.data.image),
    };
  }
};
const getFilters = async (itemType) => {
  itemType = itemType == null ? null : String(itemType);
  const raffle = getContractForReadOnly(raffleJson.address, raffleJson.abi);
  if (itemType === "All Types" || itemType == null) {
    return await raffle.filters.Create(null, null, null);
  } else if (itemType === "Token") {
    return await raffle.filters.Create(null, null, 0);
  } else {
    return await raffle.filters.Create(null, null, [1, 2]);
  }
};

const getItemType = (itemType, prizeType) => {
  if ("All Types" === itemType || itemType == null) return true;
  else if ("Token" === itemType) return prizeType === 0n;
  else return prizeType === 1n || prizeType === 2n;
};

const getActiveType = (activeType, raffleStatus) => {
  if ("Active" === activeType) return raffleStatus === 0n;
  else return raffleStatus === 1n || raffleStatus === 2n;
};
