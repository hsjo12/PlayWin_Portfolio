import React, { useContext } from "react";
import { ContextAPI } from "@/app/contextAPI/playWinContextAPI";

import { toastMessage } from "@/utils/toastMessage";

const AddRemoveBtn = () => {
  const {
    tempLotteryNumList,
    setTempLotteryNumList,
    lotteryNumList,
    setLotteryNumList,
    maxTicket,
  } = useContext(ContextAPI);
  const add = () => {
    if (tempLotteryNumList.length !== 5) {
      setTempLotteryNumList([]);
      return toastMessage("Please select 5 numbers", "warn");
    }
    if (lotteryNumList.length === maxTicket) {
      setTempLotteryNumList([]);
      return toastMessage("Exceeded the maximum amount of tickets");
    }
    setLotteryNumList((oldArray) => [
      ...oldArray,
      tempLotteryNumList.toString().replaceAll(",", ""),
    ]);
    setTempLotteryNumList([]);
  };
  const remove = () => {
    setTempLotteryNumList([]);
  };

  return (
    <div className=" w-full grid grid-cols-2 gap-3">
      <button className="btn" onClick={add}>
        Add
      </button>
      <button className="btn" onClick={remove}>
        Remove
      </button>
    </div>
  );
};
export default AddRemoveBtn;
