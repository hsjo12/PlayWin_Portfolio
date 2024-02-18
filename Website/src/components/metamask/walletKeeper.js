"use client";

import { useContext, useEffect } from "react";
import { ContextAPI } from "../contextAPI/playWinContextAPI";
import { getUserAddress, saveUserAddress } from "../utils/storage";
import { toastMessage } from "../utils/toastMessage";
import { chainCheck } from "./connector";
require("dotenv").config();
export default function WalletKeeper() {
  const { setUser, user, update } = useContext(ContextAPI);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Keep account
    const userAddress = getUserAddress();

    if (userAddress != null) {
      setUser(userAddress);
    }

    // Detect a changed account
    window.ethereum && window.ethereum.on("accountsChanged", (accounts) => {
      saveUserAddress(accounts[0]);
      setUser(accounts[0]);
    });

    // Keep the same chain
    window.ethereum && window.ethereum.on("chainChanged", async (chainId) => {
      await chainCheck(chainId);
    });
  }, []);
}
