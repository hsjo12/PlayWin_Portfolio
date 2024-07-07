import { ethers } from "ethers";
require("dotenv").config();
export const formattedBalance = (balance, decimals) => {
  balance = ethers.formatUnits(balance, decimals);
  const parsedBalance = Number(balance);
  if (parsedBalance === 0) return 0;

  // Check if the balance is an integer
  if (Number.isInteger(parsedBalance)) {
    return parsedBalance.toString();
  }

  // Format to four decimal places
  return parsedBalance.toFixed(4);
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

export const getProvider = () => {
  return new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC);
};
