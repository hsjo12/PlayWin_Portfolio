import { getContractForReadOnly } from "../utils";
import raffleJson from "../../abis/raffle.json";
import erc20AbiJson from "../../abis/erc20Abi.json";
import erc721AbiJson from "../../abis/erc721Abi.json";
import erc1155AbiJson from "../../abis/erc1155Abi.json";
import axios from "axios";
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
export const ipfsToHttpConverter = (uri) => {
  if (!String(uri).includes("ipfs://")) return uri;
  return String(uri).replace("ipfs://", "https://ipfs.io/ipfs/");
};
export const getFilters = async (itemType) => {
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

export const getItemType = (itemType, prizeType) => {
  if ("All Types" === itemType || itemType == null) return true;
  else if ("Token" === itemType) return prizeType === 0n;
  else return prizeType === 1n || prizeType === 2n;
};

export const getActiveType = (activeType, raffleStatus) => {
  if ("Active" === activeType) return raffleStatus === 0n;
  else return raffleStatus === 1n || raffleStatus === 2n;
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
