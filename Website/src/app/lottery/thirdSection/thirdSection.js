"use client";
import { useContext, useEffect } from "react";
import RemoveAllBtn from "./selectedNumbers/removeAllBtn.js";
import SelectedNumbersBox from "./selectedNumbers/selectedNumbersBox.js";
import AddRemoveBtn from "./selection/addRemoveBtn.js";
import BuyBtn from "./selection/buyBtn.js";
import LottoBtnBox from "./selection/lottoBtnBox.js";
import PriceDisplay from "./selection/priceDisplay.js";
import RandomBtn from "./selection/randomBtn.js";
import { ContextAPI } from "@/components/contextAPI/playWinContextAPI.js";

export default function ThirdSection() {
  const { screenWidth, xl, setLotteryNumList, setTempLotteryNumList } =
    useContext(ContextAPI);
  useEffect(() => {
    return () => {
      setLotteryNumList([]);
      setTempLotteryNumList([]);
    };
  }, []);
  if (screenWidth > xl) {
    return (
      <section className="infoText w-full flex flex-col justify-center items-center lotterySmallInformationCard">
        <div className="lotterySmallInformationCardHead">Purchase</div>
        <div className="w-full grid grid-cols-2 p-5 gap-5">
          <div className="w-full flex flex-col just-start items-center  gap-5">
            <p className="">Selected Numbers</p>
            <SelectedNumbersBox />
            <RemoveAllBtn />
          </div>

          <div className="w-full flex flex-col just-start items-center gap-5">
            <p className="">Selection</p>
            <LottoBtnBox />
            <AddRemoveBtn />
            <RandomBtn />
            <PriceDisplay />
            <BuyBtn />
          </div>
        </div>
      </section>
    );
  } else {
    return (
      <section className="w-full flex flex-col justify-center items-center gap-10">
        <div className=" flex flex-col justify-start lotterySmallInformationCard !pb-2 !w-[90%] ">
          <div className="lotterySmallInformationCardHead">Purchase</div>
          <div className="w-full flex flex-col just-start items-center gap-5">
            <p className="pt-6">Selection</p>
            <LottoBtnBox />
            <AddRemoveBtn />
            <RandomBtn />
            <PriceDisplay />
            <BuyBtn />
          </div>
        </div>
        <div className=" flex flex-col justify-start lotterySmallInformationCard !pb-2 !w-[90%] ">
          <div className="lotterySmallInformationCardHead">Purchased Info</div>
          <div className="w-full flex flex-col just-start items-center gap-5">
            <p className="pt-6">Selected Numbers</p>
            <SelectedNumbersBox />
            <RemoveAllBtn />
          </div>
        </div>
      </section>
    );
  }
}
