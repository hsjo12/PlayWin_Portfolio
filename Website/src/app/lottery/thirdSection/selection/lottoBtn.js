import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import React, { useContext, useState } from "react";

export default function LottoBtn({ index }) {
  const { tempLotteryNumList, setTempLotteryNumList } = useContext(ContextAPI);

  const selectNumber = (selectedNumber) => {
    const list = tempLotteryNumList;
    list[index] = selectedNumber;
    setTempLotteryNumList([...list]);
  };
  return (
    <div className="w-full grid grid-cols-10 sm:gap-3 gap-2 p-0 ">
      {Array(10)
        .fill(0)
        .map((v, i) => {
          return (
            <React.Fragment key={i}>
              {tempLotteryNumList[index] === i ? (
                <button
                  className="lbtnText ottoNumBtnSelected"
                  onClick={() => selectNumber(i)}
                >
                  {i}
                </button>
              ) : (
                <button
                  className="btnText lottoNumBtn"
                  onClick={() => selectNumber(i)}
                >
                  {i}
                </button>
              )}
            </React.Fragment>
          );
        })}
    </div>
  );
}
