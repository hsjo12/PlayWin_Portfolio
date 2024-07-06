import { ethers } from "ethers";

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
