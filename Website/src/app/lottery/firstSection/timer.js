"use client";
import { useEffect, useState } from "react";

import { getContractForReadOnly, getProvider } from "@/components/utils/utils";
import lotteryJson from "../../../abis/lottery.json";
import Loading from "@/components/utils/loading";
export default function Timer() {
  const [leftBlock, setLeftBlock] = useState(null);

  useEffect(() => {
    let updateLeftSeconds;

    (async () => {
      const lotteryInstance = await getContractForReadOnly(
        lotteryJson.address,
        lotteryJson.abi
      );
      let currentTime = Math.floor(new Date().getTime() / 1000);
      let deadline = Number(await lotteryInstance.getDeadline());

      let leftOverBlock = 0;
      updateLeftSeconds = setInterval(async () => {
        leftOverBlock = await timer(currentTime, deadline);

        if (leftOverBlock <= 0) {
          setLeftBlock("Drawing...");
          clearInterval(updateLeftSeconds);
        } else {
          setLeftBlock(leftOverBlock);
        }
        currentTime = Math.floor(new Date().getTime() / 1000);
      }, 1000);
    })();
    return () => clearInterval(updateLeftSeconds);
  }, []);

  if (!leftBlock) {
    return (
      <div className="flex flex-col w-full gap-3 ">
        <Loading loaderType="smallLoader" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-3 smallLotteryCard">
      {isNaN(leftBlock) ? (
        <div className=" w-full text-center">Generating numbers</div>
      ) : (
        <div className="w-full grid grid-cols-5">
          {leftBlock
            .toString()
            .split("")
            .map((v, i) => {
              return (
                <div
                  className="border-r-2 border-dashed last:border-r-0 text-center p-2 xl:p-1"
                  key={i}
                >
                  <div
                    className={`flex flex-col justify-center items-center mx-auto rounded-[50%] w-[40px] h-[40px] md:w-[48px] md:h-[48px]`}
                    key={i}
                  >
                    {v}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

const timer = (currentTime, deadline) => {
  const leftOver = deadline - currentTime;
  return leftOver.toString().padStart(5, "0");
};
