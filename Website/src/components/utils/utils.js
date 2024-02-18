import { ethers } from "ethers";

require("dotenv").config();

export const getProvider = () => {
  return new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC);
};

export const getUserProvider = () => {
  if (typeof window.ethereum === "undefined") return null;
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    return provider;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getContractForReadOnly = (target, abi) => {
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC);
  return new ethers.Contract(target, abi, provider);
};

export const getContract = async (target, abi) => {
  if (typeof window.ethereum === "undefined") return null;
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(target, abi, signer);
    return contract;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const converter = (amount, decimals = 18) => {
  if (amount === 0n) return "0";
  const formattedAmount = ethers.formatUnits(amount, decimals);
  const [num, decimalsPointNum] = formattedAmount.split(".");

  if (BigInt(num) > 0) {

    return Number(decimalsPointNum.slice(0, 2)) === 0 ? num : `${num}.${decimalsPointNum.slice(0, 2)}`;
  } else {
    return `0.${decimalsPointNum.slice(0, 5)}`;
  }
};

export const ipfsToHttpConverter = (uri) => {
  if (!String(uri).includes("ipfs://")) return uri;

  return String(uri).replace("ipfs://", "https://ipfs.io/ipfs/");
};

export const getDate = (time) => {
  const date = new Date(Number(time * 1000n));

  if (date < Math.floor(Date.now())) {
    return "Time Ended";
  }

  return {
    date: date.toLocaleDateString().replace(/\./g, "").replace(/\s/g, "-"),
    time: date.toTimeString().split(" ")[0],
  };
};
