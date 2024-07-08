"use client";
import { useContext, useEffect, useState } from "react";
import { ContextAPI } from "@/app/contextAPI/playWinContextAPI";
import { formattedBalance, getContractForReadOnly } from "@/utils/utils";
import lotteryJson from "../../../abis/lottery.json";
import Loading from "@/utils/loading";
import LottoBalls from "./lottoBalls";
import Timer from "./timer";
import ExpectedTime from "./expectedTime";
import { useMediaQuery } from "react-responsive";

export default function FirstSection() {
  const isMobile = useMediaQuery({
    query: "(max-width: 768px)",
  });
  const { update } = useContext(ContextAPI);
  const [currentPrizeAmount, setCurrentPrizeAmount] = useState(null);
  const [previousWinningNumber, setPreviousWinningNumber] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);

  useEffect(() => {
    (async () => {
      const lottery = await getContractForReadOnly(
        lotteryJson.address,
        lotteryJson.abi
      );
      const currentEachPlacePrizes = await lottery.getCurrentRoundTotalPrize();
      const currentRound = await lottery.round();
      const previousRound = currentRound - 1n;
      const previousRoundInfo = await lottery.roundInfo(previousRound);

      const prizeInfo = {
        totalPrize: currentEachPlacePrizes[0],
        firstPlacePrize: currentEachPlacePrizes[1],
        secondPlacePrize: currentEachPlacePrizes[2],
        thirdPlacePrize: currentEachPlacePrizes[3],
      };
      const lastRoundWinningNumber =
        previousRoundInfo[0] === "" ? "00000" : previousRoundInfo[0];
      setCurrentRound(currentRound);
      setCurrentPrizeAmount({ ...prizeInfo });
      setPreviousWinningNumber(lastRoundWinningNumber);
    })();
  }, [update]);

  if (!currentPrizeAmount || !previousWinningNumber || !currentRound) {
    return (
      <div className="w-full min-h-[30vh] flex flex-col justify-center items-center ">
        <Loading loaderType="hugeLoader" />
      </div>
    );
  }
  // if the screen size is more than 1280px
  else if (!isMobile) {
    const { totalPrize, firstPlacePrize, secondPlacePrize, thirdPlacePrize } =
      currentPrizeAmount;
    return (
      <section className="font-bebas_neue grid grid-cols-2 w-full justify-center items-start lotteryInformationCard text-center gap-5">
        <div className="flex flex-col w-full mx-auto gap-5">
          <p className="  lottoTitle text-highlight-color font-bebas_neue">
            Current Prize
          </p>
          <div className="grid grid-cols-2 justify-center items-center w-full">
            <p className="text-left">Total Prize</p>
            <p className="text-right">{`${formattedBalance(
              totalPrize,
              6
            )} FUSDT`}</p>
          </div>
          <div className="grid grid-cols-2 justify-center items-center w-full">
            <p className="text-left">1st Prize</p>
            <p className="text-right">{`${formattedBalance(
              firstPlacePrize,
              6
            )} FUSDT`}</p>
          </div>
          <div className="grid grid-cols-2 justify-center items-center w-full">
            <p className="text-left">2nd Prize</p>
            <p className="text-right">{`${formattedBalance(
              secondPlacePrize,
              6
            )} FUSDT`}</p>
          </div>
          <div className="grid grid-cols-2 justify-center items-center w-full">
            <p className="text-left">3rd Prize</p>
            <p className="text-right">{`${formattedBalance(
              thirdPlacePrize,
              6
            )} FUSDT`}</p>
          </div>
        </div>

        <div className="flex flex-col w-full mx-auto gap-5">
          <p className="lottoTitle text-highlight-color font-bebas_neue">
            Lottery Info
          </p>
          <div className="grid grid-cols-2 justify-center items-center w-full">
            <p className="text-left">Current round</p>
            <p className="text-right">{`${currentRound} ROUND`}</p>
          </div>

          <div className="grid grid-cols-2 justify-center items-center w-full">
            <p className="text-left">winningNumber</p>

            <LottoBalls winningNumber={previousWinningNumber} />
          </div>
          <div className="grid grid-cols-2 justify-center items-center w-full">
            <p className="text-left">Remaining Time</p>
            <Timer />
          </div>
          <div className="grid grid-cols-2 justify-center items-center w-full">
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
          <p className="lottoTitle w-full text-center text-highlight-color font-bebas_neue pb-3">
            Current Round
          </p>
          <p className="w-full text-center">{`${currentRound} Round`}</p>
        </div>

        <div className="flex flex-col w-[90%] md:w-[50%] mx-auto justify-center items-center ">
          <p className="lottoTitle w-full text-center text-highlight-color font-bebas_neue pb-3">
            Winning Number
          </p>
          <div className="w-full">
            <LottoBalls winningNumber={previousWinningNumber} />
          </div>
        </div>
        <div className="flex flex-col w-[90%] md:w-[50%] mx-auto justify-center items-center ">
          <p className="lottoTitle w-full text-center text-highlight-color font-bebas_neue pb-3">
            Remaining Blocks
          </p>
          <div className="flex w-full smallText justify-between ">
            <p className="w-full ">Expected time</p>

            <ExpectedTime />
          </div>
          <Timer />
        </div>

        <div className="flex flex-col w-[90%] md:w-[50%] mx-auto">
          <p className="lottoTitle w-full text-center text-highlight-color font-bebas_neue pb-3">
            Current Prize
          </p>
          <div className="grid grid-cols-2 justify-center items-center lottoText w-full ">
            <p className="text-left">Total Prize</p>
            <p className="text-right">{`${formattedBalance(
              totalPrize,
              6
            )} FUSDT`}</p>
          </div>
          <div className="grid grid-cols-2 justify-center items-center lottoText  w-full  ">
            <p className="text-left">1st Prize</p>
            <p className="text-right">{`${formattedBalance(
              firstPlacePrize,
              6
            )} FUSDT`}</p>
          </div>
          <div className="grid grid-cols-2 justify-center items-center lottoText  w-full  ">
            <p className="text-left">2nd Prize</p>
            <p className="text-right">{`${formattedBalance(
              secondPlacePrize,
              6
            )} FUSDT`}</p>
          </div>
          <div className="grid grid-cols-2 justify-center items-center lottoText w-full   ">
            <p className="text-left">3rd Prize</p>
            <p className="text-right">{`${formattedBalance(
              thirdPlacePrize,
              6
            )} FUSDT`}</p>
          </div>
        </div>
      </section>
    );
  }
}
