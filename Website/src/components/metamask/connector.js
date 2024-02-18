"use client";
import { toastMessage } from "../utils/toastMessage";
import { saveUserAddress } from "../utils/storage";

require("dotenv").config();
export const connectMetamask = async () => {
  if (typeof window.ethereum === "undefined") {
    return toastMessage("MetaMask is not installed!", "warn");
  } else {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      saveUserAddress(accounts[0]);
      const chainId = await window.ethereum.request({
        method: "eth_chainId",
        params: [],
      });
      await chainCheck(chainId);
      return accounts[0];
    } catch (error) {}
  }
};

export const chainCheck = async (chainId) => {
  if (chainId !== String(process.env.NEXT_PUBLIC_CHAIN_ID)) {
    toastMessage(`Please use "Mumbai" chain`, "warn");
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x13881" }],
      });
    } catch (switchError) {
      if (switchError.code === 4902 || switchError.code === -32603) {
        toastMessage(`Please add "Mumbai" chain`, "warn");
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x13881",
              chainName: "Mumbai",
              rpcUrls: ["https://rpc-mumbai.maticvigil.com"],

              nativeCurrency: {
                name: "mumbaiMatic",
                symbol: "mumbaiMatic",
                decimals: 18,
              },
              blockExplorerUrls: ["https://rpc-mumbai.maticvigil.com"],
            },
          ],
        });
      }
    }
  }
};
