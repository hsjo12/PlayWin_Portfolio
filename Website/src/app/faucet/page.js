"use client";
import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import { useContext, useState, useEffect, useCallback } from "react";
import ThreeButtons from "./threeButtons";

import UserInfo from "./userInfo";
import Info from "./info";
import erc20Json from "../../abis/erc20Abi.json";
import fusdtJSon from "../../abis/fusdt.json";
import Loading from "@/components/utils/loading";
import {
  converter,
  getContractForReadOnly,
  getProvider,
} from "@/components/utils/utils";
import Connect from "@/components/utils/connect";
import WrapUSDT from "./wrapUSDT.js";
require("dotenv").config();
export default function Faucet() {
  const { user, update } = useContext(ContextAPI);
  const [isLoading, setIsLoading] = useState(true);
  const [maticBalance, setMaticBalance] = useState(0);
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [fusdtBalance, setFusdtBalance] = useState(0);
  useEffect(() => {
    if (user == null) {
      setIsLoading(false);
      return;
    }
    (async () => {
      const provider = getProvider();
      const usdtInstance = getContractForReadOnly(
        String(process.env.NEXT_PUBLIC_USDT),
        erc20Json.abi
      );
      const fusdtInstance = getContractForReadOnly(
        fusdtJSon.address,
        fusdtJSon.abi
      );
      const maticBalance = await provider.getBalance(user);
      const usdtBalance = await usdtInstance.balanceOf(user);
      const fusdtBalance = await fusdtInstance.balanceOf(user);

      setMaticBalance(converter(maticBalance, 18));
      setUsdtBalance(converter(usdtBalance, 6));
      setFusdtBalance(converter(fusdtBalance, 6));
      setIsLoading(false);
    })();
  }, [user, update]);

  if (isLoading) {
    return (
      <main className="mx-auto flex  xl:container w-screen min-h-[80vh] ">
        <div className="flex flex-col justify-center items-center h-full w-[80%] mx-auto gap-7 mt-10 md:mt-28">
          <p className="mainTitle">USDT FAUCET</p>
          <div className="flex flex-col w-full h-full justify-center items-center min-h-[20rem]">
            <Loading loaderType="hugeLoader" />
          </div>
        </div>
      </main>
    );
  } else if (!user) {
    return (
      <main className="mx-auto flex  xl:container w-screen min-h-[80vh] ">
        <div className="flex flex-col justify-center items-center h-full w-[80%] mx-auto gap-7 mt-10 md:mt-28">
          <p className="mainTitle">USDT FAUCET</p>
          <Info />
          <div className="flex flex-col w-full p-2 gap-5 ">
            <Connect
              className="connectButton btnText tracking-[0.1rem] font-luckiest_guy"
              text="Connect to faucet USDT"
            />
          </div>
        </div>
      </main>
    );
  } else {
    return (
      <main className="mx-auto flex  xl:container w-screen min-h-[80vh] ">
        <div className="flex flex-col justify-center items-center h-full w-[80%] mx-auto gap-7 mt-10 md:mt-28">
          <p className="mainTitle">USDT FAUCET</p>
          <Info />
          <UserInfo
            user={user}
            maticBalance={maticBalance}
            usdtBalance={usdtBalance}
            fusdtBalance={fusdtBalance}
          />
          <ThreeButtons />
          <WrapUSDT />
        </div>
      </main>
    );
  }
}
