"use client";
import { useContext, useEffect } from "react";
import { ContextAPI } from "@/app/contextAPI/playWinContextAPI.js";
import RemoveAllBtn from "./selectedNumbers/removeAllBtn";
import SelectedNumbersBox from "./selectedNumbers/selectedNumbersBox";
import AddRemoveBtn from "./selection/addRemoveBtn";
import BuyBtn from "./selection/buyBtn";
import LottoBtnBox from "./selection/lottoBtnBox";
import PriceDisplay from "./selection/priceDisplay";
import RandomBtn from "./selection/randomBtn";
import { useMediaQuery } from "react-responsive";

export default function ThirdSection() {
  const isMobile = useMediaQuery({
    query: "(max-width: 768px)",
  });
  const { setLotteryNumList, setTempLotteryNumList } = useContext(ContextAPI);
  useEffect(() => {
    return () => {
      setLotteryNumList([]);
      setTempLotteryNumList([]);
    };
  }, []);
  if (!isMobile) {
    return (
      <section className="w-full flex flex-col justify-center items-center lotterySmallInformationCard">
        <div className="lotterySmallInformationCardHead">Purchase</div>
        <div className="w-full grid grid-cols-2 p-5 gap-5">
          <div className="w-full flex flex-col justify-start items-center gap-5">
            <p className="">Selected Numbers</p>
            <SelectedNumbersBox />
            <RemoveAllBtn />
          </div>

          <div className="w-full flex flex-col justify-start items-center gap-5">
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
        <div className=" flex flex-col justify-start lotterySmallInformationCard">
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
        <div className=" flex flex-col justify-start lotterySmallInformationCard">
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
