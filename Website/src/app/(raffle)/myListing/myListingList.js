"use client";
import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import {
  fetchEndTimeMyListing,
  fetchNewestMyListing,
  fetchOldestMyListing,
} from "@/components/utils/fetchRaffle";
import Loading from "@/components/utils/loading";
import { useContext, useEffect, useState } from "react";
import ItemCard from "./itemCard";
import Empty from "@/components/utils/empty";

export default function MyListingList() {
  const [isLoading, setIsLoading] = useState(true);

  const {
    user,
    myListingList,
    setMyListingList,
    fromIndexForMyListing,
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
          fromIndexForMyListing.current = 0;
          const userRaffleInfo = await fetchEndTimeMyListing(
            user,
            fromIndexForMyListing,
            offset,
            itemType,
            activeType
          );
          setMyListingList(userRaffleInfo);
          setIsLoading(false);
        } else if (sortType === "Newest") {
          /// Initialize 0
          fromIndexForMyListing.current = 0;
          const userRaffleInfo = await fetchNewestMyListing(
            user,
            fromIndexForMyListing,
            offset,
            itemType,
            activeType
          );
          setMyListingList(userRaffleInfo);
          setIsLoading(false);
        } else {
          /// Initialize 0
          fromIndexForMyListing.current = 0;
          const userRaffleInfo = await fetchOldestMyListing(
            user,
            fromIndexForMyListing,
            offset,
            itemType,
            activeType
          );
          setMyListingList(userRaffleInfo);
          setIsLoading(false);
        }
      })();
    }
  }, [user, sortType, itemType, activeType]);
  if (isLoading || myListingList == null) {
    return (
      <div className="flex flex-col justify-center items-center w-full min-h-[50vh]">
        <Loading loaderType="hugeLoader" />
      </div>
    );
  }
  if (myListingList.length === 0) {
    return <Empty />;
  } else {
    return (
      <div className="w-full  grid grid-cols-2  md:grid-cols-4 xl:grid-cols-6 justify-start gap-5">
        {myListingList.map((v, i) => {
          return <ItemCard key={i} info={v} />;
        })}
      </div>
    );
  }
}
