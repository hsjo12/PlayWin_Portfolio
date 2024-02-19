"use client";

import { useContext, useEffect, useState } from "react";
import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import lotteryJson from "../../abis/lottery.json";
import { getContractForReadOnly } from "@/components/utils/utils";
import Loading from "@/components/utils/loading";

export default function SecondSection() {
  const { update } = useContext(ContextAPI);
  const [soldTickets, setSoldTickets] = useState(0);
  const [firstPlaceWinners, setFirstPlaceWinners] = useState(0);
  const [secondPlaceWinners, setSecondPlaceWinners] = useState(0);
  const [thirdPlaceWinners, setThirdPlaceWinners] = useState(0);

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      setLoading(true);
      const lottery = await getContractForReadOnly(
        lotteryJson.address,
        lotteryJson.abi
      );
      const currentRound = await lottery.round();
      const currentRoundInfo = await lottery.roundInfo(currentRound);
      const previousRound = currentRound - 1n;
      const preViousRoundInfo = await lottery.roundInfo(previousRound);
      const {
        totalFirstPlaceWinners,
        totalSecondPlaceWinners,
        totalThirdPlaceWinners,
      } = preViousRoundInfo;

      setSoldTickets(Number(currentRoundInfo.totalSoldTickets));
      setFirstPlaceWinners(Number(totalFirstPlaceWinners));
      setSecondPlaceWinners(Number(totalSecondPlaceWinners));
      setThirdPlaceWinners(Number(totalThirdPlaceWinners));
      setLoading(false);
    })();
  }, [update]);

  return (
    <div className="infoText w-full flex flex-col justify-center items-center ">
      <div className=" w-[90%] grid-cols-1 xl:grid-cols-2 xl:w-full gap-10 xl:gap-5 grid ">
        <div className="flex flex-col justify-start lotterySmallInformationCard">
          <div className="lotterySmallInformationCardHead   ">Entry status</div>
          <div className=" flex flex-col items-center justify-center h-full min-h-[211px]">
            {loading ? (
              <Loading loaderType="smallLoader" />
            ) : (
              `${soldTickets} ticket`
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-start lotterySmallInformationCard">
          <div className="lotterySmallInformationCardHead">
            Last round winners
          </div>

          {loading ? (
            <div className="w-full flex flex-col justify-center items-center min-h-[211px]">
              <Loading loaderType="smallLoader" />
            </div>
          ) : (
            <>
              <div className="infoText grid grid-cols-2 items-center justify-center p-2 border-b-[1px] border-dashed border-[whitesmoke] w-full">
                <div className="text-center">Place</div>
                <div className="text-center">Total</div>
              </div>
              <div className="grid grid-cols-2 items-center justify-center p-2 border-b-[1px] border-dashed border-[whitesmoke] w-full">
                <div className="text-center">1st</div>
                <div className="text-center">{`${firstPlaceWinners}`}</div>
              </div>
              <div className="grid grid-cols-2 p-2 border-b-[1px] border-dashed border-[whitesmoke] w-full">
                <div className="text-center">2nd</div>
                <div className="text-center">{`${secondPlaceWinners}`}</div>
              </div>
              <div className="grid grid-cols-2 p-2 w-full">
                <div className="text-center">3rd</div>
                <div className="text-center">{`${thirdPlaceWinners}`}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
