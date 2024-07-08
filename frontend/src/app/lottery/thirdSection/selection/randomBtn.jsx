import { useContext, useState } from "react";

import { toastMessage } from "@/utils/toastMessage";
import { ContextAPI } from "@/app/contextAPI/playWinContextAPI";

export default function RandomBtn() {
  const { lotteryNumList, setLotteryNumList, maxTicket } =
    useContext(ContextAPI);
  const [inputValue, setInputValue] = useState("");
  const changeInputValue = (e) => {
    const value = Number(e.target.value);
    if (value > maxTicket || value < 0) {
      setInputValue("");
      return toastMessage("Maximum quantity");
    } else {
      setInputValue(value);
    }
  };
  const inc = () => {
    if (!inputValue) return setInputValue(1);
    if (inputValue + 1 > maxTicket) return toastMessage("Maximum quantity");
    return setInputValue(inputValue + 1);
  };
  const dec = () => {
    if (!inputValue) return setInputValue(1);
    if (inputValue - 1 < 1) return toastMessage("Minimum quantity");
    return setInputValue(inputValue - 1);
  };
  const randomGenerator = () => {
    if (inputValue == null || inputValue < 1)
      return toastMessage("Please input quantity");
    const randomList = Array(Number(inputValue))
      .fill(0)
      .map((v, i) => {
        const randomValue = String(Math.floor(Math.random() * 100000));
        if (randomValue.length === 1) return "0000" + randomValue;
        else if (randomValue.length === 2) return "000" + randomValue;
        else if (randomValue.length === 3) return "00" + randomValue;
        else if (randomValue.length === 4) return "0" + randomValue;
        else return randomValue;
      });
    setLotteryNumList([...randomList]);
  };

  const mxsRandomGenerator = () => {
    const randomList = Array(Number(maxTicket))
      .fill(0)
      .map((v, i) => {
        const randomValue = String(Math.floor(Math.random() * 100000));
        if (randomValue.length === 1) return "0000" + randomValue;
        else if (randomValue.length === 2) return "000" + randomValue;
        else if (randomValue.length === 3) return "00" + randomValue;
        else if (randomValue.length === 4) return "0" + randomValue;
        else return randomValue;
      });
    setLotteryNumList([...randomList]);
  };

  return (
    <div className="w-full grid grid-cols-2 mx-auto gap-1 sm:gap-3">
      <div className="w-full grid grid-cols-5 gap-1 sm:gap-2">
        <input
          id="randomNumber"
          className="inputStyle text-center removeIncDecArrow inputStyle w-full col-span-3 rounded-md"
          type="number"
          value={inputValue || ""}
          onChange={changeInputValue}
          placeholder="Total Random"
        />

        <button onClick={inc} className="infoText w-full btn">
          +
        </button>
        <button onClick={dec} className="infoText w-full btn">
          −
        </button>
      </div>
      <div className="grid grid-cols-2 w-full gap-1 sm:gap-3">
        <button onClick={randomGenerator} className="btn">
          ADD
        </button>
        <button onClick={mxsRandomGenerator} className="btn">
          MAX
        </button>
      </div>
    </div>
  );
}
