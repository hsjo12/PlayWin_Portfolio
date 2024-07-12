"use client";
import { getContractForReadOnly } from "@/utils/utils";
import { useContext, useEffect, useState } from "react";
import RaffleJson from "../../../abis/raffle.json";
import Loading from "@/utils/loading";
import ItemCard from "../itemCard";
import { ContextAPI } from "@/app/contextAPI/playWinContextAPI";
import {
  newestOrder,
  oldestOrder,
  timeEndSoon,
} from "@/utils/fetch/raffleIndex";
import Empty from "@/utils/empty";

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
    let isMounted = true;

    (async () => {
      let fetchedRaffleList;
      if (sortType === "End time" || sortType == null) {
        try {
          fromIndexForMain.current = 0;
          fetchedRaffleList = await timeEndSoon(
            fromIndexForMain,
            offset,
            itemType,
            activeType
          );
        } catch (error) {
          fetchedRaffleList = [];
          console.error(error);
        }
      } else if (sortType === "Newest") {
        try {
          const raffle = getContractForReadOnly(
            RaffleJson.address,
            RaffleJson.abi
          );
          fromIndexForMain.current = Number(await raffle.currentId());
          fetchedRaffleList = await newestOrder(
            fromIndexForMain,
            offset,
            itemType,
            activeType
          );
        } catch (error) {
          fetchedRaffleList = [];
          console.error(error);
        }
      } else {
        // sortType === "oldest"
        try {
          fromIndexForMain.current = 1; // the raffle id starts from 1
          fetchedRaffleList = await oldestOrder(
            fromIndexForMain,
            offset,
            itemType,
            activeType
          );
        } catch (error) {
          fetchedRaffleList = [];
          console.error(error);
        }
      }

      if (isMounted) {
        setRaffleList((prevList) =>
          prevList ? [...prevList, ...fetchedRaffleList] : fetchedRaffleList
        );
        setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false; // cleanup 함수: 컴포넌트가 언마운트되었음을 표시
    };
  }, [sortType, itemType, activeType, fromIndexForMain]);

  if (isLoading || raffleList == null) {
    return (
      <div className="flex flex-col justify-center items-center w-full min-h-[70vh]">
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
