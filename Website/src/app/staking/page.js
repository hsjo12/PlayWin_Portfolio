"use client";
import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import { useContext, useState, useEffect, useCallback } from "react";

import Loading from "@/components/utils/loading";
import Info from "./info";
import UserInfo from "./userInfo";
import erc20Json from "../../abis/erc20Abi.json";
import fusdtJSon from "../../abis/fusdt.json";
import stakingJSon from "../../abis/staking.json";
import {
  converter,
  getContractForReadOnly,
  getProvider,
} from "@/components/utils/utils";
import Connect from "@/components/utils/connect";
import Staking from "./staking";

export default function StakingPage() {
  const { user, update } = useContext(ContextAPI);

  const [usdtBalance, setUsdtBalance] = useState(0);
  const [stakingBalance, setStakingBalance] = useState(0);
  const [leftoverLockUpRounds, setLeftoverLockUpRounds] = useState(0);
  const [userReward, setUserReward] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user == null) {
      setIsLoading(false);
      return;
    }
    (async () => {
      const usdtInstance = getContractForReadOnly(
        String(process.env.NEXT_PUBLIC_USDT),
        erc20Json.abi
      );

      const stakingInstance = getContractForReadOnly(
        stakingJSon.address,
        stakingJSon.abi
      );

      const usdtBalance = await usdtInstance.balanceOf(user);
      const stakingInfo = await stakingInstance.userStakingInfo(user);
      const leftoverRound = await stakingInstance.getLeftOverLockUpRound(user);
      const userReward = await stakingInstance.getCurrentRewards(user);

      setUsdtBalance(converter(usdtBalance, 6));
      setStakingBalance(converter(stakingInfo[0], 6));
      setLeftoverLockUpRounds(leftoverRound);
      setUserReward(converter(userReward, 6));
      setIsLoading(false);
    })();
  }, [user, update]);

  if (isLoading) {
    return (
      <main className="mx-auto flex  xl:container w-screen min-h-[80vh] ">
        <div className="flex flex-col justify-center items-center h-full w-[80%] mx-auto gap-10 mt-10 md:mt-28">
          <p className="mainTitle">USDT STAKING</p>
          <div className="flex flex-col w-full h-full justify-center items-center min-h-[20rem]">
            <Loading loaderType="hugeLoader" />
          </div>
        </div>
      </main>
    );
  } else if (!user) {
    return (
      <main className=" mx-auto flex  xl:container w-screen min-h-[80vh] ">
        <div className="flex flex-col justify-center items-center h-full w-[80%] mx-auto gap-10 mt-10 md:mt-28">
          <p className="mainTitle">USDT STAKING</p>
          <Info />
          <div className="flex flex-col w-full p-2 gap-5 ">
            <Connect
              className="btnText connectButton tracking-[0.1rem] font-luckiest_guy"
              text="Connect to Stake USDT"
            />
          </div>
        </div>
      </main>
    );
  } else {
    return (
      <main className="normalText  font-roboto  mx-auto flex  xl:container w-screen min-h-[80vh] ">
        <div className="flex flex-col justify-center items-center h-full w-[80%] mx-auto gap-10 mt-10 md:mt-28">
          <p className="mainTitle">USDT STAKING</p>
          <Info />
          <UserInfo
            user={user}
            usdtBalance={usdtBalance}
            stakingBalance={stakingBalance}
            leftoverLockUpRounds={leftoverLockUpRounds}
            userReward={userReward}
          />
          <Staking />
        </div>
      </main>
    );
  }
}
