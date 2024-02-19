"use client";
import { useContext, useState, useEffect, useCallback } from "react";
import { ContextAPI } from "../contextAPI/playWinContextAPI";
import { connectMetamask } from "../metamask/connector";
import { ethers } from "ethers";
export default function Connect({ className, text }) {
  const { setUser } = useContext(ContextAPI);
  const connect = useCallback(async () => {
    const user = await connectMetamask();
    if (!ethers.isAddress(user)) return;
    setUser(user);
  }, []);

  return (
    <button onClick={connect} className={className}>
      {text}
    </button>
  );
}
