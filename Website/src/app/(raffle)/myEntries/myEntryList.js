"use client";
import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import {
  fetchTimeEndEntryListOfMine,
  fetchOldestMyEntryList,
  fetchNewestMyEntryList,
} from "@/components/utils/fetchRaffle";
import Loading from "@/components/utils/loading";
import { useContext, useEffect, useState } from "react";
import ItemCard from "./itemCard";
import Empty from "@/components/utils/empty";

export default function MyEntryList() {
  const [isLoading, setIsLoading] = useState(true);

  const {
    user,
    myEntryList,
    setMyEntryList,
    fromIndexForMyEntries,
    offset,
    sortType,
    itemType,
    activeType,
  } = useContext(ContextAPI);

  useEffect(() => {
    if (!user) return setIsLoading(false);
    else {
      (async () => {
        if (sortType === "End time" || sortType == null) {
          /// Initialize 0
          fromIndexForMyEntries.current = 0;
          const userRaffleInfo = await fetchTimeEndEntryListOfMine(
            user,
            fromIndexForMyEntries,
            offset,
            itemType,
            activeType
          );
          setMyEntryList(userRaffleInfo);
          setIsLoading(false);
        } else if (sortType === "Newest") {
          /// Initialize 0
          fromIndexForMyEntries.current = 0;
          const userRaffleInfo = await fetchNewestMyEntryList(
            user,
            fromIndexForMyEntries,
            offset,
            itemType,
            activeType
          );
          setMyEntryList(userRaffleInfo);
          setIsLoading(false);
        } else {
          /// Initialize 0
          fromIndexForMyEntries.current = 0;
          const userRaffleInfo = await fetchOldestMyEntryList(
            user,
            fromIndexForMyEntries,
            offset,
            itemType,
            activeType
          );
          setMyEntryList(userRaffleInfo);
          setIsLoading(false);
        }
      })();
    }
  }, [user, fromIndexForMyEntries, offset, sortType, itemType, activeType]);
  if (isLoading || myEntryList == null) {
    return (
      <div className="flex flex-col justify-center items-center w-full min-h-[50vh]">
        <Loading loaderType="hugeLoader" />
      </div>
    );
  } else if (myEntryList.length === 0) {
    return <Empty />;
  } else {
    return (
      <div className="w-full h-full grid grid-cols-2  md:grid-cols-4 xl:grid-cols-6 justify-start gap-5">
        {myEntryList.map((v, i) => {
          return <ItemCard key={i} info={v} />;
        })}
      </div>
    );
  }
}
