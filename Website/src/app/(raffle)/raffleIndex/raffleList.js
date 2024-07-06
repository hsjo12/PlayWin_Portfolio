"use client";
import { getContractForReadOnly } from "@/components/utils/utils";
import { useContext, useEffect, useState } from "react";
import RaffleJson from "../../../abis/raffle.json";
import Loading from "@/components/utils/loading";
import ItemCard from "./itemCard";
import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import {
  newestOrder,
  oldestOrder,
  timeEndSoon,
  timeEndSoonForInActiveRaffles,
} from "@/components/utils/fetchRaffle";
import Empty from "@/components/utils/empty";
export default function RaffleList() {
  const {
    raffleList,
    setRaffleList,
    offset,
    fromIndexForMain,
    sortType,
    itemType,
    activeType,
  } = useContext(ContextAPI);
  const [isLoading, setIsLoading] = useState(null);

  useEffect(() => {
    (async () => {
      if (sortType === "End time" || sortType == null) {
        let fetchedRaffleList;

        if (activeType === "Active") {
          fetchedRaffleList = await timeEndSoon(
            fromIndexForMain,
            offset,
            itemType
          );
        } else {
          /// inActive
          fetchedRaffleList = await timeEndSoonForInActiveRaffles(
            fromIndexForMain,
            offset,
            itemType
          );
        }
        if (raffleList !== null) {
          setRaffleList([...raffleList, ...fetchedRaffleList]);
        } else {
          setRaffleList(fetchedRaffleList);
        }
      } else if (sortType === "Newest") {
        try {
          const raffle = getContractForReadOnly(
            RaffleJson.address,
            RaffleJson.abi
          );
          fromIndexForMain.current = Number(await raffle.currentId());

          const fetchedRaffleList = await newestOrder(
            fromIndexForMain,
            offset,
            itemType,
            activeType
          );

          console.log(`fetchedRaffleList`, fetchedRaffleList);

          if (raffleList !== null) {
            setRaffleList([...raffleList, ...fetchedRaffleList]);
          } else {
            setRaffleList(fetchedRaffleList);
          }
        } catch (error) {
          if (error.message.includes("NonExistence()")) {
            setRaffleList([]);
          } else {
            console.error(error);
          }
        }
      } else {
        try {
          // sortType === "oldest
          fromIndexForMain.current = 1; // the raffle id starts from 1
          const fetchedRaffleList = await oldestOrder(
            fromIndexForMain,
            offset,
            itemType,
            activeType
          );
          if (raffleList !== null) {
            setRaffleList([...raffleList, ...fetchedRaffleList]);
          } else {
            setRaffleList(fetchedRaffleList);
          }
        } catch (error) {
          if (error.message.includes("NonExistence()")) {
            setRaffleList([]);
          } else {
            console.error(error);
          }
        }
      }
      setIsLoading(false);
    })();
  }, [sortType, itemType, fromIndexForMain, activeType]);

  if (isLoading || raffleList == null) {
    return (
      <div className="flex flex-col justify-center items-center w-full min-h-[40vh]">
        <Loading loaderType="hugeLoader" />
      </div>
    );
  } else if (raffleList.length === 0) {
    return <Empty />;
  } else {
    return (
      <div className="w-full grid grid-cols-2  md:grid-cols-4 xl:grid-cols-6 justify-start gap-5">
        {raffleList.map((v, i) => {
          return <ItemCard key={i} info={v} />;
        })}
      </div>
    );
  }
}
