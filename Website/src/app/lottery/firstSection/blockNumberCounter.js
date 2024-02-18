"use client";
import { useEffect, useState } from "react";

import { getContractForReadOnly, getProvider } from "@/components/utils/utils";
import Loading from "@/components/utils/loading";
export default function BlockNumberCounter({ currentBlock, deadlineBlocks }) {
  const [leftBlock, setLeftBlock] = useState(null);

  useEffect(() => {
    let blockNumberToAnnounce;
    let _currentBlock = currentBlock;
    let updateLeftBlock;
    (async () => {
      blockNumberToAnnounce = Number(deadlineBlocks);
      let leftOverBlock = 0;
      updateLeftBlock = setInterval(async () => {
        leftOverBlock = await blockTimer(_currentBlock, blockNumberToAnnounce);

        if (leftOverBlock <= 0) {
          setLeftBlock("Drawing...");
          clearInterval(updateLeftBlock);
        } else {
          setLeftBlock(leftOverBlock);
        }
        _currentBlock = _currentBlock + 1;
      }, 2500);
    })();
    return () => clearInterval(updateLeftBlock);
  }, [currentBlock, deadlineBlocks]);

  if (!leftBlock || !currentBlock || !deadlineBlocks) {
    return (
      <div className="flex flex-col w-full gap-3 ">
        <Loading />
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

const blockTimer = (currentBlock, blockNumberToAnnounce) => {
  const leftOver = blockNumberToAnnounce - currentBlock;
  return leftOver.toString().padStart(5, "0");
};
