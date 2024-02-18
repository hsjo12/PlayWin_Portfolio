"use client";
import { useContext, useEffect, useState } from "react";
import { ContextAPI } from "../contextAPI/playWinContextAPI";
import { clearUserAddress, saveUserAddress } from "../utils/storage";
import Loading from "../utils/loading";
import { connectMetamask } from "../metamask/connector";
import { ethers } from "ethers";

export default function Wallet({ className1, className2 }) {
  const { user, setUser } = useContext(ContextAPI);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
    }
    setIsLoading(false);
  }, [user]);

  const connect = async () => {
    const user = await connectMetamask();
    if (!ethers.isAddress(user)) return;
    setUser(user);
  };

  const disconnect = () => {
    clearUserAddress();
    setUser(null);
  };

  if (isLoading) {
    return <Loading loaderType="smallLoader" />;
  } else if (user) {
    return (
      <div className={className2}>
        <p className="text-center">{`${user.slice(0, 4)}...${user.slice(
          -4
        )}`}</p>

        <button
          onClick={disconnect}
          className="text-center disconnectButton w-full mb-1"
        >
          disconnect
        </button>
      </div>
    );
  } else {
    return (
      <button onClick={connect} className={className1}>
        Connect
      </button>
    );
  }
}
