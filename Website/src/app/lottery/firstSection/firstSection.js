"use client";
import { converter, getContractForReadOnly } from "@/components/utils/utils";
import LottoBalls from "./lottoBalls";
import BlockNumberCounter from "./blockNumberCounter";
import ExpectedTime from "./expectedTime";
import { useContext, useEffect, useState } from "react";
import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import Loading from "@/components/utils/loading";
import lotteryJson from "../../../abis/lottery.json";
export default function FirstSection({
  currentEachPlacePrizes,
  currentRound,
  previousRoundInfo,
}) {
  const { screenWidth, xl, update } = useContext(ContextAPI);
  const [currentPrizeAmount, setCurrentPrizeAmount] = useState(null);
  const [previousWinningNumber, setPreviousWinningNumber] = useState(null);

  /// Get data from SSR
  useEffect(() => {
    const prizeInfo = {
      totalPrize: currentEachPlacePrizes[0],
      firstPlacePrize: currentEachPlacePrizes[1],
      secondPlacePrize: currentEachPlacePrizes[2],
      thirdPlacePrize: currentEachPlacePrizes[3],
    };
    const lastRoundWinningNumber =
      previousRoundInfo[0] === "" ? "00000" : previousRoundInfo[0];
    setCurrentPrizeAmount({ ...prizeInfo });
    setPreviousWinningNumber(lastRoundWinningNumber);
  }, [currentEachPlacePrizes]);

  /// Get data for update
  useEffect(() => {
    (async () => {
      const lottery = await getContractForReadOnly(
        lotteryJson.address,
        lotteryJson.abi
      );
      const currentEachPlacePrizes = await lottery.getCurrentRoundTotalPrize();

      const prizeInfo = {
        totalPrize: currentEachPlacePrizes[0],
        firstPlacePrize: currentEachPlacePrizes[1],
        secondPlacePrize: currentEachPlacePrizes[2],
        thirdPlacePrize: currentEachPlacePrizes[3],
      };
      setCurrentPrizeAmount({ ...prizeInfo });
    })();
  }, [update]);

  if (!screenWidth || !currentPrizeAmount || !previousWinningNumber) {
    return (
      <div className="w-full min-h-[30vh] flex flex-col justify-center items-center ">
        <Loading loaderType="hugeLoader" />
      </div>
    );
  }
  // if the screen size is more than 1280px
  else if (screenWidth > xl) {
    const { totalPrize, firstPlacePrize, secondPlacePrize, thirdPlacePrize } =
      currentPrizeAmount;
    return (
      <section className="grid grid-cols-2 w-full justify-center items-center lotteryInformationCard text-center gap-5">
        <div className="flex flex-col w-[90%] mx-auto gap-5">
          <p className="lottoSubTitle">Current Prize</p>
          <div className="grid grid-cols-2 justify-center items-center lottoText w-full ">
            <p className="text-left">Total Prize</p>
            <p className="text-right">{`${converter(totalPrize, 6)} FUSDT`}</p>
          </div>
          <div className="grid grid-cols-2 justify-center items-center lottoText  w-full  ">
            <p className="text-left">1st Prize</p>
            <p className="text-right">{`${converter(
              firstPlacePrize,
              6
            )} FUSDT`}</p>
          </div>
          <div className="grid grid-cols-2 justify-center items-center lottoText  w-full  ">
            <p className="text-left">2nd Prize</p>
            <p className="text-right">{`${converter(
              secondPlacePrize,
              6
            )} FUSDT`}</p>
          </div>
          <div className="grid grid-cols-2 justify-center items-center lottoText w-full   ">
            <p className="text-left">3rd Prize</p>
            <p className="text-right">{`${converter(
              thirdPlacePrize,
              6
            )} FUSDT`}</p>
          </div>
        </div>
        <div className="flex flex-col w-[90%] mx-auto gap-5">
          <p className="lottoSubTitle ">Lottery Info</p>
          <div className="grid grid-cols-2 justify-center items-center lottoText w-full ">
            <p className="text-left">Current round</p>
            <p className="text-right">{`${currentRound} ROUND`}</p>
          </div>

          <div className="grid grid-cols-2 justify-center items-center lottoText  w-full  ">
            <p className="text-left">winningNumber</p>

            <LottoBalls winningNumber={previousWinningNumber} />
          </div>
          <div className="grid grid-cols-2 justify-center items-center lottoText  w-full  ">
            <p className="text-left">Remaining Blocks</p>
            <BlockNumberCounter />
          </div>
          <div className="grid grid-cols-2 justify-center items-center lottoText w-full   ">
            <p className="text-left">Expected end time</p>
            <ExpectedTime />
          </div>
        </div>
      </section>
    );
  }
  // if the screen size is less than 1280px
  else {
    const { totalPrize, firstPlacePrize, secondPlacePrize, thirdPlacePrize } =
      currentPrizeAmount;

    return (
      <section className="font-bebas_neue flex flex-col justify-start items-center gap-9 w-full">
        <div className="flex flex-col w-[90%] md:w-[50%] mx-auto">
          <p className="lottoSubTitle w-full text-center ">Current Round</p>
          <p className="w-full text-center  text-[3rem] ">{`${currentRound} Round`}</p>
        </div>

        <div className="flex flex-col w-[90%] md:w-[50%] mx-auto justify-center items-center ">
          <p className="lottoSubTitle w-full text-center ">Winning Number</p>
          <div className="w-full">
            <LottoBalls winningNumber={previousWinningNumber} />
          </div>
        </div>
        <div className="flex flex-col w-[90%] md:w-[50%] mx-auto justify-center items-center ">
          <p className="lottoSubTitle w-full text-center ">Remaining Blocks</p>
          <div className="flex w-full smallText justify-between ">
            <p className="w-full ">Expected time</p>

            <ExpectedTime />
          </div>
          <BlockNumberCounter />
        </div>
        <div className="flex flex-col w-[90%] md:w-[50%] mx-auto">
          <p className="lottoSubTitle w-full text-center ">Current Prize</p>
          <div className="grid grid-cols-2 justify-center items-center lottoText w-full ">
            <p className="text-left">Total Prize</p>
            <p className="text-right">{`${converter(totalPrize, 6)} FUSDT`}</p>
          </div>
          <div className="grid grid-cols-2 justify-center items-center lottoText  w-full  ">
            <p className="text-left">1st Prize</p>
            <p className="text-right">{`${converter(
              firstPlacePrize,
              6
            )} FUSDT`}</p>
          </div>
          <div className="grid grid-cols-2 justify-center items-center lottoText  w-full  ">
            <p className="text-left">2nd Prize</p>
            <p className="text-right">{`${converter(
              secondPlacePrize,
              6
            )} FUSDT`}</p>
          </div>
          <div className="grid grid-cols-2 justify-center items-center lottoText w-full   ">
            <p className="text-left">3rd Prize</p>
            <p className="text-right">{`${converter(
              thirdPlacePrize,
              6
            )} FUSDT`}</p>
          </div>
        </div>
      </section>
    );
  }
}
