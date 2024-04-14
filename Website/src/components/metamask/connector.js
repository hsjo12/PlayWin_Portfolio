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
  console.log("chainId", chainId);
  if (chainId !== String(process.env.NEXT_PUBLIC_CHAIN_ID)) {
    toastMessage(`Please use "sepolia" chain`, "warn");
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      });
    } catch (switchError) {
      if (switchError.code === 4902 || switchError.code === -32603) {
        toastMessage(`Please add "sepolia" chain`, "warn");
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xaa36a7",
              chainName: "sepolia",
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
