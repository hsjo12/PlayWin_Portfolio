"use client";
import { useContext, useEffect, useState } from "react";
import { ContextAPI } from "@/app/contextAPI/playWinContextAPI";
import {
  fetchOldestMyEntryList,
  fetchTimeEndEntryListOfMine,
  fetchNewestMyEntryList,
} from "@/utils/fetch/myEntries";
import Loading from "@/utils/loading";
import ItemCard from "../itemCard";
import Empty from "@/utils/empty";
import { useWeb3ModalAccount } from "@web3modal/ethers/react";

export default function MyEntryList() {
  const [isLoading, setIsLoading] = useState(true);
  const { address, isConnected } = useWeb3ModalAccount();
  const {
    myEntryList,
    setMyEntryList,
    fromIndexForMyEntries,
    offset,
    sortType,
    itemType,
    activeType,
  } = useContext(ContextAPI);

  useEffect(() => {
    if (!isConnected) return setIsLoading(false);
    else {
      (async () => {
        if (sortType === "End time" || sortType == null) {
          /// Initialize 0
          fromIndexForMyEntries.current = 0;
          const userRaffleInfo = await fetchTimeEndEntryListOfMine(
            address,
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
            address,
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
            address,
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
  }, [
    address,
    isConnected,
    fromIndexForMyEntries,
    offset,
    sortType,
    itemType,
    activeType,
  ]);
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
      <div className="w-full grid grid-cols-2  md:grid-cols-4 xl:grid-cols-6 justify-start gap-5">
        {myEntryList.map((v, i) => {
          return <ItemCard key={i} info={v} />;
        })}
      </div>
    );
  }
}
